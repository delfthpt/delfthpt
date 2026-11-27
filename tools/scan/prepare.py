#!/usr/bin/env python3
"""Prepares a 3D scan of the laboratory for the virtual tour page.

    python3 tools/scan/prepare.py scan.glb                  writes public/scan/room.bin and the textures room-*.webp
    python3 tools/scan/prepare.py scan.glb --look top.png   only straightens the scan and saves a view from above

It needs Python 3 with numpy, scipy and Pillow. It is not part of the build of the site: run it once for a new
scan, from the folder of the repository, and commit the files it writes.

The scan is a textured mesh exported from the Scaniverse app in the GLB format: triangles, and one large picture
(the texture) that holds the colours of all surfaces as thousands of small patches. The script

 1. straightens it: the floor becomes level at height 0, and the walls run along the x and y axes;
 2. keeps the room (ROOM below), cut off cleanly at its edges and at the height TOP, so that the ceiling is left
    out, and drops loose pieces;
 3. packs the patches of the texture that the room still uses into a smaller picture, and saves it in three sizes;
 4. puts the triangles into an order that packs well and writes them, packed, for public/js/tour.js.

For a new scan, first run it with --look and read the edges of the room from the grid in that picture (one square
is one metre). Put them into ROOM, run the script again without --look, and copy the lines it prints at the end
into `scan` in src/data.mjs. The places of the labels and the views in that file then need to be found again in
the new model (the README tells how).
"""
import gzip
import io
import json
import os
import struct
import sys

import numpy as np

# The part of the straightened scan that is kept, in metres: x from, x to, y from, y to.
# In the scan of November 2026 the wall on the left is at x = -3.70, the windows are at y = -3.50 and the wall with
# the door is at y = +3.50. On the right the laboratory goes on behind the bench with the oven and the desiccators,
# but the scan holds only patches of the floor there, so the model ends in a clean cut just behind that bench.
ROOM = (-3.86, 2.66, -3.63, 3.63)
FLOOR = -0.06          # lowest height that is kept (the floor itself is at 0)
TOP = 2.80             # everything above is cut off, so that visitors can look into the room from above
LOOSE = 0.1            # pieces of the mesh with less surface than this, in square metres, are dropped
STEP = 0.002           # coordinates are stored in steps of 2 mm
ATLAS = 4096           # width and height of the packed texture, in pixels (a power of two)
PAD = 2                # pixels of margin that every patch of the texture keeps around its triangles
SIZES = (1024, 2048, 4096)   # the texture is saved in these sizes; the viewer starts with the smallest
QUALITY = 82           # of the WebP pictures, 0 to 100
SPLIT_BOX = 900        # a patch is split only when its box has more pixels than this,
SPLIT_FILL = 0.7       # when its triangles fill less than this share of the box,
SPLIT_GAIN = 0.9       # and when the two new boxes together are at most this share of the old one
SPLIT_AT = (0.25, 0.375, 0.5, 0.625, 0.75)   # where a cut is tried, as shares of the triangles on one side
CHUNK = 65535          # most corners that one part of the mesh may have (the viewer numbers them with 16 bits)
OUT = 'public/scan'


def read_glb(path):
    """Corners, their places in the texture, triangles and the texture of a GLB file from Scaniverse."""
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None       # the texture is one large picture
    with open(path, 'rb') as f:
        data = f.read()
    if data[:4] != b'glTF':
        sys.exit('This is not a GLB file. In Scaniverse, export the scan as a mesh in the GLB format.')
    size = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20 + size].decode('utf-8'))
    base = 20 + size + 8

    def view(i):
        v = doc['bufferViews'][i]
        return base + v.get('byteOffset', 0), v['byteLength']

    def numbers(i):
        a = doc['accessors'][i]
        width = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]
        kind = {5121: 'u1', 5123: '<u2', 5125: '<u4', 5126: '<f4'}[a['componentType']]
        if doc['bufferViews'][a['bufferView']].get('byteStride', 0) not in (0, width * np.dtype(kind).itemsize):
            sys.exit('The numbers in this file are woven together in a way this script does not read.')
        got = np.frombuffer(data, kind, a['count'] * width, view(a['bufferView'])[0] + a.get('byteOffset', 0))
        return got.reshape(-1, width) if width > 1 else got

    parts = [p for m in doc.get('meshes', []) for p in m['primitives']]
    moved = any(k in n for n in doc.get('nodes', []) for k in ('matrix', 'rotation', 'translation', 'scale'))
    if len(parts) != 1 or parts[0].get('mode', 4) != 4 or moved or 'TEXCOORD_0' not in parts[0]['attributes']:
        sys.exit('Expected one mesh of triangles with one texture, the way Scaniverse exports a scan as GLB.')
    part = parts[0]
    P = numbers(part['attributes']['POSITION']).astype(np.float64)
    UV = numbers(part['attributes']['TEXCOORD_0']).astype(np.float64)
    I = numbers(part['indices']).astype(np.int64).reshape(-1, 3)
    texture = doc['materials'][part['material']]['pbrMetallicRoughness']['baseColorTexture']['index']
    start, length = view(doc['images'][doc['textures'][texture]['source']]['bufferView'])
    picture = np.asarray(Image.open(io.BytesIO(data[start:start + length])).convert('RGB'))
    # In a GLB file y points up and z towards the viewer. In the room, z is the height.
    return np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1), UV, I, picture


def areas(P, I):
    return 0.5 * np.linalg.norm(np.cross(P[I[:, 1]] - P[I[:, 0]], P[I[:, 2]] - P[I[:, 0]]), axis=1)


def spread(P, UV, I, n, seed):
    """n points spread evenly over the surface, each with its place in the texture and its triangle."""
    A = areas(P, I)
    rng = np.random.default_rng(seed)
    t = rng.choice(len(I), n, p=A / A.sum())
    u = rng.random((n, 2))
    over = u.sum(1) > 1
    u[over] = 1 - u[over]
    w = np.c_[1 - u.sum(1), u]

    def mix(V):
        return sum(V[I[t, k]] * w[:, k:k + 1] for k in range(3))

    return mix(P), mix(UV), t


def straighten(P, UV, I):
    """Floor to height 0 and level, walls along the axes."""
    # The mesh has more corners where it is fine, so the fit uses points spread evenly over its surface instead.
    S = spread(P, UV, I, 600000, 3)[0]
    # The floor is the level with the most surface near the bottom. A plane is then fitted to the points close to it.
    h, e = np.histogram(S[:, 2], bins=np.arange(-0.5, 1.0, 0.01))
    m = np.abs(S[:, 2] - (e[np.argmax(h)] + 0.005)) < 0.06
    for it in range(4):
        Q = S[m]
        coef, *_ = np.linalg.lstsq(np.c_[Q[:, 0], Q[:, 1], np.ones(len(Q))], Q[:, 2], rcond=None)
        m = np.abs(S[:, 2] - (S[:, 0] * coef[0] + S[:, 1] * coef[1] + coef[2])) < (0.03 if it < 2 else 0.015)
    nrm = np.array([-coef[0], -coef[1], 1.0])
    nrm /= np.linalg.norm(nrm)
    v = np.cross(nrm, [0, 0, 1.0])
    s = np.linalg.norm(v)
    R = np.eye(3)
    if s > 1e-9:    # turn the floor normal to +z
        vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
        R = np.eye(3) + vx + vx @ vx * ((1 - nrm[2]) / s ** 2)
    S = S @ R.T
    h, e = np.histogram(S[:, 2], bins=np.arange(-0.5, 1.0, 0.002))
    lift = -(e[np.argmax(h)] + 0.001)
    S[:, 2] += lift
    print(f'floor: tilted by {np.degrees(np.arccos(nrm[2])):.2f} degrees, now level at 0')

    # Turn about the vertical until the walls are along the axes: the angle at which the histograms of x and y
    # of the points at wall height are sharpest.
    W = S[(S[:, 2] > 0.9) & (S[:, 2] < 2.6)][::3]

    def sharp(deg):
        t = np.radians(deg)
        x = W[:, 0] * np.cos(t) - W[:, 1] * np.sin(t)
        y = W[:, 0] * np.sin(t) + W[:, 1] * np.cos(t)
        hx, _ = np.histogram(x, bins=np.arange(-9, 9, 0.02))
        hy, _ = np.histogram(y, bins=np.arange(-9, 9, 0.02))
        return float((hx.astype(float) ** 2).sum() + (hy.astype(float) ** 2).sum())

    coarse = np.arange(0, 90, 0.5)
    best = coarse[int(np.argmax([sharp(d) for d in coarse]))]
    fine = np.arange(best - 0.6, best + 0.6, 0.02)
    best = float(fine[int(np.argmax([sharp(d) for d in fine]))])
    t = np.radians(best)
    R = np.array([[np.cos(t), -np.sin(t), 0], [np.sin(t), np.cos(t), 0], [0, 0, 1.0]]) @ R
    print(f'walls: turned by {best:.2f} degrees about the vertical')
    return P @ R.T + [0, 0, lift]


def look(P, UV, I, picture, path, res=0.008):
    """A view from above, without the ceiling, with a line every metre: to read the edges of the room from."""
    from PIL import Image, ImageDraw
    pts, uv, t = spread(P, UV, I, 6000000, 5)
    up = np.cross(P[I[:, 1]] - P[I[:, 0]], P[I[:, 2]] - P[I[:, 0]])[:, 2] > 0
    m = (pts[:, 2] < 2.3) & up[t]        # what faces up, below the ceiling: what a camera above the room would see
    pts, uv = pts[m], uv[m]
    hgt, wid = picture.shape[:2]
    c = picture[np.clip((uv[:, 1] * hgt).astype(int), 0, hgt - 1), np.clip((uv[:, 0] * wid).astype(int), 0, wid - 1)]
    x0, y0, x1, y1 = np.floor(P[:, 0].min()), np.floor(P[:, 1].min()), np.ceil(P[:, 0].max()), np.ceil(P[:, 1].max())
    w, h = int((x1 - x0) / res) + 1, int((y1 - y0) / res) + 1
    ix, iy = ((pts[:, 0] - x0) / res).astype(int), h - 1 - ((pts[:, 1] - y0) / res).astype(int)
    order = np.argsort(pts[:, 2])        # the highest point wins
    img = np.full((h, w, 3), 18, np.uint8)
    img[iy[order], ix[order]] = c[order]
    im = Image.fromarray(img)
    draw = ImageDraw.Draw(im)
    for g in np.arange(x0, x1 + 1):
        X = int((g - x0) / res)
        draw.line([(X, 0), (X, h)], fill=(255, 255, 0))
        draw.text((X + 3, 2), f'x {g:g}', fill=(255, 255, 0))
    for g in np.arange(y0, y1 + 1):
        Y = h - 1 - int((g - y0) / res)
        draw.line([(0, Y), (w, Y)], fill=(0, 255, 255))
        draw.text((2, Y + 2), f'y {g:g}', fill=(0, 255, 255))
    im.save(path)
    print(f'{path}: the straightened scan from above, one square is one metre')


def tidy(P, UV, I):
    """Leaves out the corners that no triangle uses."""
    used, inverse = np.unique(I, return_inverse=True)
    return P[used], UV[used], inverse.reshape(-1, 3)


def cut(P, UV, I, axis, limit, side):
    """Keeps the part of the mesh on one side of a plane: side -1 keeps what lies below `limit` along `axis`,
    side +1 what lies above. Triangles that cross the plane are cut, so the edge is straight."""
    d = side * (limit - P[:, axis])     # how far a corner is beyond the plane
    out = d > 0
    k = out[I].sum(1)
    if not k.any():
        return P, UV, I
    n = len(P)
    # Going round each triangle that crosses the plane, starting at the corner that differs from the other two:
    one = I[k == 1]             # one corner cut off (o): what is left has four corners, so it becomes two triangles
    r = np.argmax(out[one], 1)
    o, a, b = (one[np.arange(len(one)), (r + j) % 3] for j in range(3))
    two = I[k == 2]             # two corners cut off (o1, o2): a smaller triangle is left
    r = np.argmin(out[two], 1)
    c, o1, o2 = (two[np.arange(len(two)), (r + j) % 3] for j in range(3))
    # A new corner is made where an edge crosses the plane: one for each edge, shared by the triangles on it.
    edge, new = np.unique(np.r_[a * n + o, b * n + o, c * n + o1, c * n + o2], return_inverse=True)
    qa, qb, q1, q2 = np.split(new + n, np.cumsum([len(one), len(one), len(two)]))
    kept, gone = edge // n, edge % n
    t = (d[kept] / (d[kept] - d[gone]))[:, None]
    P = np.r_[P, P[kept] + (P[gone] - P[kept]) * t]
    UV = np.r_[UV, UV[kept] + (UV[gone] - UV[kept]) * t]
    return tidy(P, UV, np.r_[I[k == 0], np.c_[qa, a, b], np.c_[qa, b, qb], np.c_[c, q1, q2]])


def groups(I, n):
    """Numbers the triangles by the group they belong to: triangles that share corners are in one group."""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    link = coo_matrix((np.ones(2 * len(I), bool), (np.r_[I[:, 0], I[:, 1]], np.r_[I[:, 1], I[:, 2]])), shape=(n, n))
    return connected_components(link, directed=False)[1][I[:, 0]]


def weld(P):
    """One number for each place: corners that lie at one place (the texture splits them) get the same number."""
    return np.unique(np.round(P / 0.0005).astype(np.int64), axis=0, return_inverse=True)[1].ravel()


def clean(P, UV, I):
    """Keeps the room below the ceiling, without loose pieces."""
    n0, s0 = len(I), areas(P, I).sum()
    x0, x1, y0, y1 = ROOM
    for axis, limit, side in ((0, x0, 1), (0, x1, -1), (1, y0, 1), (1, y1, -1), (2, FLOOR, 1), (2, TOP, -1)):
        P, UV, I = cut(P, UV, I, axis, limit, side)
    A = areas(P, I)
    P, UV, I = tidy(P, UV, I[A > 1e-9])     # triangles without any surface
    A = areas(P, I)
    place = weld(P)
    piece = groups(place[I], place.max() + 1)
    keep = np.bincount(piece, A)[piece] >= LOOSE
    print(f'mesh: {n0} triangles and {s0:.0f} m2 in the scan; {int(keep.sum())} triangles and {A[keep].sum():.0f} m2 kept '
          f'({len(np.unique(piece[~keep]))} loose pieces with {A[~keep].sum():.2f} m2 dropped)')
    return tidy(P, UV, I[keep])


def patches(px, I):
    """Numbers the triangles by their patch of the texture, and gives every patch its own corners.

    A patch is a group of triangles that lie next to each other in the texture. A large patch with a ragged outline
    wastes most of the box around it, so such patches are split until their boxes are filled reasonably well."""
    patch = groups(I, len(px))
    a, b = px[I[:, 1]] - px[I[:, 0]], px[I[:, 2]] - px[I[:, 0]]
    T = 0.5 * np.abs(a[:, 0] * b[:, 1] - a[:, 1] * b[:, 0])       # texels in each triangle
    mid = px[I].mean(1)
    lo, hi = px[I].min(1), px[I].max(1)
    order = np.argsort(patch, kind='stable')
    ends = np.r_[0, np.cumsum(np.bincount(patch))]
    out = np.zeros(len(I), np.int64)
    count = 0

    def box(t):
        return np.prod(hi[t].max(0) - lo[t].min(0) + 2 * PAD + 2)

    def halves(t):       # the best way to cut a patch in two, across or down: the two boxes with the least area
        best = (whole := box(t), None)
        for axis in (0, 1):
            for at in np.quantile(mid[t, axis], SPLIT_AT):
                first = mid[t, axis] <= at
                if 0 < first.sum() < len(t):
                    both = box(t[first]) + box(t[~first])
                    if both < best[0]:
                        best = (both, first)
        return best[1] if best[0] < SPLIT_GAIN * whole else None

    todo = [order[ends[i]:ends[i + 1]] for i in range(len(ends) - 1)]
    while todo:
        t = todo.pop()
        if len(t) >= 4 and box(t) > SPLIT_BOX and T[t].sum() < SPLIT_FILL * box(t):
            first = halves(t)
            if first is not None:
                todo += [t[first], t[~first]]
                continue
        out[t] = count
        count += 1
    # a corner that two patches share becomes two corners, so that each patch can move on its own
    pairs, inverse = np.unique(np.c_[I.ravel(), np.repeat(out, 3)], axis=0, return_inverse=True)
    return pairs[:, 0], inverse.reshape(-1, 3), pairs[:, 1], count


def shelves(w, h, width):
    """Places boxes of w by h pixels on shelves in a picture of the given width: the tallest first, each on the first
    shelf that has room. Returns the left and top edge of every box, and the height that is used."""
    order = np.argsort(-h, kind='stable')
    x, y = np.zeros(len(w), np.int64), np.zeros(len(w), np.int64)
    free, top = [], []          # for each shelf: the pixels left on it, and where it starts
    used = 0
    for i in order:
        k = next((s for s in range(len(free)) if free[s] >= w[i]), -1)
        if k < 0:
            free.append(width)
            top.append(used)
            used += int(h[i])
            k = len(free) - 1
        x[i], y[i] = width - free[k], top[k]
        free[k] -= int(w[i])
    return x, y, used


def texture(picture, UV, I):
    """Packs the patches of the texture that the mesh uses into a picture of ATLAS by ATLAS pixels.
    Returns the picture and the new places of the corners in it, in pixels, with the corners and triangles."""
    from PIL import Image, ImageDraw
    from scipy import ndimage
    hgt, wid = picture.shape[:2]
    px = UV * [wid, hgt]
    old, I, patch, count = patches(px, I)
    px = px[old]
    # the box of every patch: all pixels that drawing its triangles can touch, and PAD more on every side
    lo = np.full((count, 2), np.inf)
    hi = np.full((count, 2), -np.inf)
    np.minimum.at(lo, patch, px)
    np.maximum.at(hi, patch, px)
    lo = np.floor(lo - 0.5).astype(np.int64) - PAD
    hi = np.floor(hi - 0.5).astype(np.int64) + 2 + PAD
    size = hi - lo
    scale = 1.0
    while True:     # at full size if the patches fit, otherwise a little smaller
        w, h = np.ceil(size[:, 0] * scale).astype(np.int64), np.ceil(size[:, 1] * scale).astype(np.int64)
        x, y, used = shelves(w, h, ATLAS)
        if used <= ATLAS:
            break
        scale *= min(0.98, np.sqrt(ATLAS / used))
    print(f'texture: {count} patches with {int((size[:, 0] * size[:, 1]).sum() / 1e6 * 10) / 10} million pixels, '
          f'packed at {scale * 100:.0f}% of their size into {ATLAS} by {used} of {ATLAS} pixels')
    # which pixels of the texture belong to the mesh: those inside a triangle, or within PAD + 1 pixels of one
    mask = Image.new('L', (wid, hgt), 0)
    draw = ImageDraw.Draw(mask)
    for tri in (px[I] - 0.5).reshape(-1, 6).tolist():
        draw.polygon(tri, fill=255, outline=255)
    mask = ndimage.maximum_filter(np.asarray(mask), size=2 * PAD + 3) > 0
    atlas = np.zeros((ATLAS, ATLAS, 3), np.uint8)
    filled = np.zeros((ATLAS, ATLAS), bool)
    for i in range(count):
        x0, y0, x1, y1 = lo[i, 0], lo[i, 1], hi[i, 0], hi[i, 1]
        sx0, sy0, sx1, sy1 = max(x0, 0), max(y0, 0), min(x1, wid), min(y1, hgt)      # a box may reach over the edge
        colour = np.zeros((y1 - y0, x1 - x0, 3), np.uint8)
        own = np.zeros((y1 - y0, x1 - x0), bool)
        colour[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = picture[sy0:sy1, sx0:sx1]
        own[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = mask[sy0:sy1, sx0:sx1]
        if scale != 1.0:
            colour = np.asarray(Image.fromarray(colour).resize((int(w[i]), int(h[i])), Image.LANCZOS))
            own = np.asarray(Image.fromarray(own.astype(np.uint8) * 255).resize((int(w[i]), int(h[i])), Image.BOX)) > 0
        part = atlas[y[i]:y[i] + h[i], x[i]:x[i] + w[i]]
        part[own] = colour[own]
        filled[y[i]:y[i] + h[i], x[i]:x[i] + w[i]] |= own
    # every other pixel takes the colour of the nearest pixel that belongs to the mesh, so that the patches
    # do not get dark rims when the picture is drawn small
    near = ndimage.distance_transform_edt(~filled, return_distances=False, return_indices=True)
    atlas = atlas[near[0], near[1]]
    at = (px - lo[patch]) * (np.c_[w, h] / size)[patch] + np.c_[x, y][patch]
    return atlas, at, old, I


def spreadbits(v):
    """Puts two empty bits between the bits of a number, to weave three coordinates into one."""
    v = v.astype(np.uint64) & 0x1fffff
    v = (v | (v << 32)) & 0x1f00000000ffff
    v = (v | (v << 16)) & 0x1f0000ff0000ff
    v = (v | (v << 8)) & 0x100f00f00f00f00f
    v = (v | (v << 4)) & 0x10c30c30c30c30c3
    v = (v | (v << 2)) & 0x1249249249249249
    return v


def walk(q, I):
    """An order for the triangles in which each one lies next to the one before it wherever that is possible.
    Neighbours then share corners that were used a moment ago, which is what makes the file pack small."""
    J = np.unique(q, axis=0, return_inverse=True)[1].ravel()[I]     # by place, so that neighbours across a seam of the texture count as well
    n = len(I)
    edge = np.sort(np.stack([J, np.roll(J, -1, 1)], 2).reshape(-1, 2), 1)
    key = edge[:, 0] * (int(J.max()) + 1) + edge[:, 1]
    order = np.argsort(key, kind='stable')
    same = key[order][1:] == key[order][:-1]
    a, b = order[:-1][same] // 3, order[1:][same] // 3          # two triangles on one edge
    near = [[] for _ in range(n)]
    for s, t in zip(a.tolist(), b.tolist()):
        near[s].append(t)
        near[t].append(s)
    mid = q[I].mean(1).astype(np.int64)
    start = np.argsort(spreadbits(mid[:, 0]) | (spreadbits(mid[:, 1]) << 1) | (spreadbits(mid[:, 2]) << 2), kind='stable')
    seen = np.zeros(n, bool)
    out = []
    for s in start.tolist():
        if seen[s]:
            continue
        stack = [s]
        while stack:
            t = stack.pop()
            if seen[t]:
                continue
            seen[t] = True
            out.append(t)
            stack.extend(u for u in near[t] if not seen[u])
    return np.array(out)


def planes(v):
    """A row of 16-bit numbers as the differences from one to the next: first their low bytes, then their high bytes."""
    d = (np.diff(v.astype(np.int64), prepend=0) + 32768) % 65536 - 32768
    z = ((d << 1) ^ (d >> 63)).astype(np.uint32)
    return (z & 255).astype(np.uint8).tobytes() + (z >> 8).astype(np.uint8).tobytes()


def pack(q, t, I):
    """The mesh as bytes, gzipped. The viewer undoes this in `decode` (public/js/tour.js).

    The mesh is split into parts of at most CHUNK corners. In each part the corners are numbered in the order in
    which the triangles first use them, so a triangle either takes the next new corner or looks a short way back.

        uint32 number of parts, then for each part uint32 corners, uint32 triangles (little endian)
        for each part:
          x, y, z, then the place in the texture across and down: for each, the low bytes and then the high bytes
            of the zigzag-coded differences from one corner to the next
          for each of the three corners of every triangle, low bytes and then high bytes: 0 for the next new
            corner, otherwise how far back from the next new corner it lies
    """
    head, body, start = [], [], 0
    while start < len(I):
        end = len(I)
        while len(np.unique(I[start:end])) > CHUNK:
            end = start + max(1, int((end - start) * 0.9))
        flat = I[start:end].ravel()
        corner, first, flat = np.unique(flat, return_index=True, return_inverse=True)
        number = np.empty(len(corner), np.int64)
        number[np.argsort(first)] = np.arange(len(corner))      # in the order of first use
        flat = number[flat]
        corner = corner[np.argsort(first)]
        nxt = np.r_[0, np.maximum.accumulate(flat)[:-1] + 1]        # the number that the next new corner gets
        code = np.where(flat == nxt, 0, nxt - flat)
        assert code.min() >= 0 and code.max() < 65536
        head.append(struct.pack('<II', len(corner), end - start))
        body += [planes(q[corner, k]) for k in range(3)] + [planes(t[corner, k]) for k in range(2)]
        body += [(code & 255).astype(np.uint8).tobytes(), (code >> 8).astype(np.uint8).tobytes()]
        start = end
    return gzip.compress(struct.pack('<I', len(head)) + b''.join(head) + b''.join(body), 9, mtime=0), len(head)


def main():
    from PIL import Image
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit(__doc__)
    P, UV, I, picture = read_glb(args[0])
    P = straighten(P, UV, I)
    if '--look' in sys.argv:
        look(P, UV, I, picture, args[1] if len(args) > 1 else 'scan-from-above.png')
        return
    P, UV, I = clean(P, UV, I)
    atlas, at, old, I = texture(picture, UV, I)
    P = P[old]
    origin = np.floor(P.min(0) / STEP) * STEP
    q = np.round((P - origin) / STEP).astype(np.int64)
    t = np.round(at * (32768 / ATLAS)).astype(np.int64)     # places in the texture in steps of 1/8 pixel
    assert q.min() >= 0 and q.max() < 65536 and t.min() >= 0 and t.max() <= 32768
    I = I[walk(q, I)]
    packed, parts = pack(q, t, I)
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'room.bin'), 'wb') as f:
        f.write(packed)
    print(f'{OUT}/room.bin: {len(I)} triangles, {len(q)} corners, {parts} parts, {len(packed)} bytes')
    lines = []
    im = Image.fromarray(atlas)
    for size in sorted(SIZES, reverse=True):
        while im.size[0] > size:
            im = im.reduce(2)       # each pixel becomes the mean of four, so the patches stay where they are
        name = f'room-{size}.webp'
        im.save(os.path.join(OUT, name), 'WEBP', quality=QUALITY, method=6)
        nbytes = os.path.getsize(os.path.join(OUT, name))
        lines.insert(0, f"    {{ file: '{name}', size: {size}, bytes: {nbytes} }},")
        print(f'{OUT}/{name}: {nbytes} bytes')
    print('\nFor `scan` in src/data.mjs:\n')
    print(f"  step: {STEP}, origin: {json.dumps([round(float(v), 3) for v in origin])}, box: {json.dumps([round(float(v), 3) for v in P.max(0)])},")
    print(f"  mesh: {{ file: 'room.bin', bytes: {len(packed)} }},")
    print('  textures: [\n' + '\n'.join(lines) + '\n  ],')


if __name__ == '__main__':
    main()
