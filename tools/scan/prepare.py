#!/usr/bin/env python3
"""Prepares a 3D scan of the laboratory for the virtual tour page.

    python3 tools/scan/prepare.py scan.ply                  writes public/scan/room-1.bin, room-2.bin, room-3.bin
    python3 tools/scan/prepare.py scan.ply --look top.png   only straightens the scan and saves a view from above

It needs Python 3 with numpy and scipy (and Pillow for --look). It is not part of the build of the site: run it
once for a new scan, from the folder of the repository, and commit the files it writes.

The scan is a point cloud exported from the Scaniverse app as PLY (binary, with x y z and red green blue for
every point). The script

 1. straightens it: the floor becomes level at height 0, and the walls run along the x and y axes;
 2. keeps the room (ROOM below), and leaves out the ceiling (everything above TOP), loose points and small
    loose clusters;
 3. shuffles the points, splits them into three parts and packs each part for public/js/tour.js.

For a new scan, first run it with --look and read the edges of the room from the grid in that picture (one square
is one metre). Put them into ROOM, run the script again without --look, and copy the lines it prints at the end
into `scan` in src/data.mjs. The places of the labels and the views in that file then need to be found again in
the new model (the README tells how).
"""
import gzip
import json
import os
import sys

import numpy as np

# The part of the straightened scan that is kept, in metres: x from, x to, y from, y to.
# In the scan of November 2026 the wall on the left is at x = -3.70, the windows are at y = -3.50 and the wall with
# the door is at y = +3.50. On the right the laboratory goes on behind the bench with the oven and the desiccators,
# but the scan holds only loose patches of that part, so the model ends in a clean cut just behind that bench.
ROOM = (-3.86, 2.66, -3.63, 3.63)
FLOOR = -0.06          # lowest height that is kept (the floor itself is at 0)
TOP = 2.80             # everything above is left out, so that visitors can look into the room from above
STEP = 0.002           # coordinates are stored in steps of 2 mm
PARTS = (90000, 155000)  # number of points in the first and the second part; the third part takes the rest
OUT = 'public/scan'


def read_ply(path):
    with open(path, 'rb') as f:
        head = b''
        while not head.endswith(b'end_header\n'):
            byte = f.read(1)
            if not byte:
                sys.exit('This file has no PLY header.')
            head += byte
        lines = head.decode('ascii', 'replace').split('\n')
        if 'format binary_little_endian 1.0' not in lines:
            sys.exit('The PLY file must be binary (little endian).')
        props = [l.split()[1:] for l in lines if l.startswith('property')]
        if [p[1] for p in props] != ['x', 'y', 'z', 'red', 'green', 'blue'] or [p[0] for p in props] != ['float'] * 3 + ['uchar'] * 3:
            sys.exit('Expected the properties x y z (float) and red green blue (uchar) for every point.')
        n = int([l for l in lines if l.startswith('element vertex')][0].split()[-1])
        dt = np.dtype([('x', '<f4'), ('y', '<f4'), ('z', '<f4'), ('r', 'u1'), ('g', 'u1'), ('b', 'u1')])
        a = np.frombuffer(f.read(n * dt.itemsize), dtype=dt)
    points = np.stack([a['x'], a['y'], a['z']], 1).astype(np.float64)
    colours = np.stack([a['r'], a['g'], a['b']], 1).astype(np.uint8)
    return points, colours


def straighten(P):
    """Floor to height 0 and level, walls along the axes."""
    # The floor is the level with the most points near the bottom. A plane is then fitted to the points close to it.
    h, e = np.histogram(P[:, 2], bins=np.arange(-0.5, 1.0, 0.01))
    m = np.abs(P[:, 2] - (e[np.argmax(h)] + 0.005)) < 0.06
    for it in range(4):
        Q = P[m]
        coef, *_ = np.linalg.lstsq(np.c_[Q[:, 0], Q[:, 1], np.ones(len(Q))], Q[:, 2], rcond=None)
        m = np.abs(P[:, 2] - (P[:, 0] * coef[0] + P[:, 1] * coef[1] + coef[2])) < (0.03 if it < 2 else 0.015)
    nrm = np.array([-coef[0], -coef[1], 1.0])
    nrm /= np.linalg.norm(nrm)
    v = np.cross(nrm, [0, 0, 1.0])
    s = np.linalg.norm(v)
    if s > 1e-9:    # turn the floor normal to +z
        vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
        P = P @ (np.eye(3) + vx + vx @ vx * ((1 - nrm[2]) / s ** 2)).T
    h, e = np.histogram(P[:, 2], bins=np.arange(-0.5, 1.0, 0.002))
    P[:, 2] -= e[np.argmax(h)] + 0.001
    print(f'floor: tilted by {np.degrees(np.arccos(nrm[2])):.2f} degrees, now level at 0')

    # Turn about the vertical until the walls are along the axes: the angle at which the histograms of x and y
    # of the points at wall height are sharpest.
    W = P[(P[:, 2] > 0.9) & (P[:, 2] < 2.6)][::3]

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
    P = P @ np.array([[np.cos(t), -np.sin(t), 0], [np.sin(t), np.cos(t), 0], [0, 0, 1.0]]).T
    print(f'walls: turned by {best:.2f} degrees about the vertical')
    return P.astype(np.float32).astype(np.float64)


def look(P, C, path, res=0.012):
    """A view from above, without the ceiling, with a line every metre: to read the edges of the room from."""
    from PIL import Image, ImageDraw
    m = P[:, 2] < 2.3
    p, c = P[m], C[m]
    x0, y0, x1, y1 = np.floor(P[:, 0].min()), np.floor(P[:, 1].min()), np.ceil(P[:, 0].max()), np.ceil(P[:, 1].max())
    w, h = int((x1 - x0) / res) + 1, int((y1 - y0) / res) + 1
    ix, iy = ((p[:, 0] - x0) / res).astype(int), h - 1 - ((p[:, 1] - y0) / res).astype(int)
    order = np.argsort(p[:, 2])         # the highest point wins
    img = np.full((h, w, 3), 18, np.uint8)
    for dx in range(3):
        for dy in range(3):
            img[np.clip(iy[order] + dy, 0, h - 1), np.clip(ix[order] + dx, 0, w - 1)] = c[order]
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


def clean(P, C):
    """Keeps the room below the ceiling, without loose points and small loose clusters."""
    from scipy import ndimage
    from scipy.spatial import cKDTree
    n0 = len(P)
    x0, x1, y0, y1 = ROOM
    m = (P[:, 0] > x0) & (P[:, 0] < x1) & (P[:, 1] > y0) & (P[:, 1] < y1) & (P[:, 2] > FLOOR) & (P[:, 2] < 3.75)
    P, C = P[m], C[m]
    # A point on a surface has about 20 neighbours within 7 cm. Points with fewer than five are loose.
    near = cKDTree(P).query_ball_point(P, 0.07, return_length=True, workers=-1)
    P, C = P[near >= 6], C[near >= 6]   # the count includes the point itself
    # Groups of connected cells of 8 cm that hold fewer than 120 points are loose clusters.
    ijk = np.floor((P - [x0, y0, FLOOR]) / 0.08).astype(np.int32)
    grid = np.zeros(ijk.max(0) + 1, bool)
    grid[ijk[:, 0], ijk[:, 1], ijk[:, 2]] = True
    lab, count = ndimage.label(grid, structure=np.ones((3, 3, 3), bool))
    group = lab[ijk[:, 0], ijk[:, 1], ijk[:, 2]]
    keep = np.bincount(group, minlength=count + 1)[group] >= 120
    P, C = P[keep], C[keep]
    below = P[:, 2] <= TOP
    print(f'points: {n0} in the scan, {int(below.sum())} kept ({int((~below).sum())} of the ceiling left out)')
    return P[below], C[below]


def spread(v):
    """Puts two empty bits between the bits of a number, to weave three coordinates into one."""
    v = v.astype(np.uint64) & 0x1fffff
    v = (v | (v << 32)) & 0x1f00000000ffff
    v = (v | (v << 16)) & 0x1f0000ff0000ff
    v = (v | (v << 8)) & 0x100f00f00f00f00f
    v = (v | (v << 4)) & 0x10c30c30c30c30c3
    v = (v | (v << 2)) & 0x1249249249249249
    return v


def pack(q, c):
    """One part of the points as bytes, gzipped. The viewer undoes this in `decode` (public/js/tour.js).

    The points are sorted along a curve that keeps neighbours in space next to each other, and stored as
    differences from one point to the next. Small differences repeat often, so gzip packs them to about a third.

        uint32 n (little endian)
        x: n low bytes, then n high bytes, of the zigzag-coded differences; the same for y and for z
        n bytes each: the differences (modulo 256) of green, of red minus green and of blue minus green
    """
    order = np.argsort(spread(q[:, 0]) | (spread(q[:, 1]) << 1) | (spread(q[:, 2]) << 2), kind='stable')
    q, c = q[order], c[order].astype(np.int32)
    d = np.diff(q, axis=0, prepend=0).astype(np.int32)
    z = ((d << 1) ^ (d >> 31)).astype(np.uint32)
    assert z.max() < 65536
    body = [np.uint32(len(q)).tobytes()]
    for a in range(3):
        body += [(z[:, a] & 255).astype(np.uint8).tobytes(), (z[:, a] >> 8).astype(np.uint8).tobytes()]
    g = c[:, 1]
    for plane in (g, c[:, 0] - g, c[:, 2] - g):
        body.append((np.diff(plane, prepend=0) & 255).astype(np.uint8).tobytes())
    return gzip.compress(b''.join(body), 9, mtime=0)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit(__doc__)
    P, C = read_ply(args[0])
    P = straighten(P)
    if '--look' in sys.argv:
        look(P, C, args[1] if len(args) > 1 else 'scan-from-above.png')
        return
    P, C = clean(P, C)
    origin = np.floor(P.min(0) / STEP) * STEP
    order = np.random.default_rng(7).permutation(len(P))
    P, C = P[order], C[order]
    q = np.round((P - origin) / STEP).astype(np.int64)
    assert q.min() >= 0 and q.max() < 65536
    os.makedirs(OUT, exist_ok=True)
    edges = [0, PARTS[0], PARTS[0] + PARTS[1], len(P)]
    parts = []
    for k in range(3):
        packed = pack(q[edges[k]:edges[k + 1]], C[edges[k]:edges[k + 1]])
        name = f'room-{k + 1}.bin'
        with open(os.path.join(OUT, name), 'wb') as f:
            f.write(packed)
        parts.append(f"    {{ file: '{name}', points: {edges[k + 1] - edges[k]}, bytes: {len(packed)} }},")
        print(f'{OUT}/{name}: {edges[k + 1] - edges[k]} points, {len(packed)} bytes')
    print('\nFor `scan` in src/data.mjs:\n')
    print(f"  step: {STEP}, origin: {json.dumps([round(float(v), 3) for v in origin])}, box: {json.dumps([round(float(v), 3) for v in P.max(0)])},")
    print('  parts: [\n' + '\n'.join(parts) + '\n  ],')


if __name__ == '__main__':
    main()
