/* Delft High PT Lab: the 3D scan of the laboratory on the Virtual tour page. Plain WebGL, no dependencies.

   The page (see "Virtual tour" in build.mjs) holds a picture of the scan, a button for each view and a block of
   text for each view. This script puts the model over the picture and lets visitors turn it. The facts about the
   scan, the views and the labelled instruments are in src/data.mjs under `scan` and arrive here in data-scan.

   The model is a surface of triangles (public/scan/room.bin) with the colours of the scan laid over it as a
   picture, the texture (public/scan/room-1024.webp and larger; the README tells how these files are made). The
   triangles and the smallest texture are loaded first, so that the model appears quickly. The sharpest texture
   that suits the device takes its place as soon as it has arrived.

   Only the side of a surface that faced the scanner is drawn. Seen from outside the room, the walls nearest to
   the camera therefore vanish by themselves, and visitors look into the room as into a model.

   Play runs a tour: the model turns slowly, then the camera visits each instrument and rests there. Turning the
   model, zooming or choosing a view stops the tour, and Play starts it again. For visitors who have asked their
   device for reduced motion nothing moves by itself until they press Play, and the camera jumps instead of flying. */
(() => {
  'use strict';
  const root = document.getElementById('tour-embed');
  if (!root || !root.dataset.scan) return;
  const stage = root.querySelector('.scan-stage');
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  // Without WebGL, or without a way to unpack the triangles, the picture and the texts stay as they are.
  if (!stage || !gl || !window.fetch || typeof DecompressionStream === 'undefined') return;

  const S = JSON.parse(root.dataset.scan);
  const DEG = Math.PI / 180;
  const FOV = 34 * DEG;                 // angle of view over the shorter side of the picture
  const BG = [7 / 255, 10 / 255, 16 / 255];
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The textures that this device can hold, smallest first. Visitors who have asked their browser to save data,
  // and devices with little memory, stop one size below the largest.
  const frugal = !!(navigator.connection && navigator.connection.saveData) || (navigator.deviceMemory || 8) <= 2;
  const fits = S.textures.filter((t) => t.size <= gl.getParameter(gl.MAX_TEXTURE_SIZE));
  const textures = frugal ? fits.slice(0, Math.max(1, fits.length - 1)) : fits;
  if (!textures.length) return;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

  /* ---------- the page around the model ---------- */
  const views = S.views;
  const byKey = Object.fromEntries(views.map((v) => [v.key, v]));
  const buttons = Array.from(root.querySelectorAll('.bar button[data-key]'));
  const infos = Array.from(root.querySelectorAll('.scan-info'));
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'The laboratory as a 3D model. Use the buttons below it to choose a view, or the arrow keys to turn it.');
  canvas.tabIndex = 0;
  stage.append(canvas);
  const labels = el('div', 'scan-spots');
  stage.append(labels);
  const spots = views.filter((v) => v.spot).map((v, i) => {
    const b = el('button', 'scan-spot'), stem = el('i', 'scan-stem');
    b.type = 'button';
    b.append(el('b', '', String(i + 1)), el('span', '', v.label));
    b.addEventListener('click', () => choose(v.key));
    labels.prepend(stem);
    labels.append(b);
    return { view: v, node: b, stem, w: 0, h: 0, lift: 0, p: null, covered: false };
  });
  const note = el('div', 'scan-note');
  note.setAttribute('role', 'status');
  const noteText = el('span', '', 'Loading the 3D model');
  const meter = el('i');
  note.append(noteText, meter);
  stage.append(note);
  const zoomBox = el('div', 'scan-zoom');
  const zin = el('button', '', '+'), zout = el('button', '', '−');
  zin.type = zout.type = 'button';
  zin.setAttribute('aria-label', 'Zoom in');
  zout.setAttribute('aria-label', 'Zoom out');
  zoomBox.append(zin, zout);
  stage.append(zoomBox);
  const ICON = { play: '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M2 1l9 5-9 5z"/></svg>', pause: '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg>' };
  const play = el('button', 'play');
  play.type = 'button';
  root.insertBefore(play, stage);

  /* ---------- camera ---------- */
  // The camera looks at `at` from the direction `az` (round the room) and `el` (height), and shows about `span`
  // metres across the shorter side of the picture. Whatever stands more than `cut` metres in front of that point,
  // measured over the floor towards the camera, is left away: the room is cut open like a model, so that a close
  // view is not blocked by the things between the camera and its subject.
  const first = views[0];
  const cutFor = (span) => clamp(span * 0.66, 1.4, 9);
  const cam = { x: first.at[0], y: first.at[1], z: first.at[2], az: first.look[0] * DEG, el: first.look[1] * DEG, span: first.look[2], cut: cutFor(first.look[2]) };
  let W = 2, H = 2, ratio = 1;           // size of the picture in CSS pixels, and device pixels per CSS pixel
  let mat = null, eye = [0, 0, 0], dist = 1;
  let axes = null, lens = [1, 1];      // the three axes of the camera, and how strongly it magnifies across and up
  let cutN = [1, 0], cutD = 99;          // the cut: whatever has x*cutN[0] + y*cutN[1] beyond cutD is left away
  let current = first.key;

  function update() {
    const aspect = W / H;
    const fovY = aspect >= 1 ? FOV : 2 * Math.atan(Math.tan(FOV / 2) / aspect);
    dist = cam.span / 2 / Math.tan(FOV / 2);
    const ce = Math.cos(cam.el), se = Math.sin(cam.el);
    eye = [cam.x + dist * ce * Math.cos(cam.az), cam.y + dist * ce * Math.sin(cam.az), cam.z + dist * se];
    // the three axes of the camera: z points from the target to the eye
    const z = [ce * Math.cos(cam.az), ce * Math.sin(cam.az), se];
    const x = [-Math.sin(cam.az), Math.cos(cam.az), 0];
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const near = Math.max(0.3, dist - 9), far = dist + 10;
    // Seen from steeply above nothing stands in the way, so the cut moves out of the room.
    const steep = Math.cos(Math.min(cam.el, 50 * DEG)) / Math.max(0.05, Math.cos(cam.el));
    cutN = [Math.cos(cam.az), Math.sin(cam.az)];
    cutD = cam.x * cutN[0] + cam.y * cutN[1] + cam.cut * steep;
    const f = 1 / Math.tan(fovY / 2), nf = 1 / (near - far);
    const t = [-(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]), -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]), -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2])];
    const a = f / aspect, c = (far + near) * nf, d = 2 * far * near * nf;
    // projection times view, column by column
    mat = new Float32Array([
      a * x[0], f * y[0], c * z[0], -z[0],
      a * x[1], f * y[1], c * z[1], -z[1],
      a * x[2], f * y[2], c * z[2], -z[2],
      a * t[0], f * t[1], c * t[2] + d, -t[2],
    ]);
    axes = [x, y, z];
    lens = [a, f];
  }
  // Where a point of the room lands in the picture, in CSS pixels. Null when it is behind the camera.
  function project(p) {
    const w = mat[3] * p[0] + mat[7] * p[1] + mat[11] * p[2] + mat[15];
    if (w <= 0.05) return null;
    const cx = (mat[0] * p[0] + mat[4] * p[1] + mat[8] * p[2] + mat[12]) / w;
    const cy = (mat[1] * p[0] + mat[5] * p[1] + mat[9] * p[2] + mat[13]) / w;
    return [(cx * 0.5 + 0.5) * W, (0.5 - cy * 0.5) * H, w];
  }

  /* ---------- drawing ---------- */
  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const program = (vs, fs) => {
    const p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  };
  // The surface takes its colours from the texture. What stands beyond the cut is left away (vCut), and far
  // surfaces are dimmed a little so that the room keeps its depth (vHaze).
  const MESH_VS = `
    attribute vec3 aPos; attribute vec2 aAt;
    uniform mat4 uMat; uniform vec3 uOrigin; uniform float uStep; uniform vec3 uCut; uniform vec2 uHaze;
    varying vec2 vAt; varying float vCut; varying float vHaze;
    void main() {
      vec3 p = aPos * uStep + uOrigin;
      vec4 q = uMat * vec4(p, 1.0);
      vAt = aAt / 32768.0;
      vCut = dot(p.xy, uCut.xy) - uCut.z;
      vHaze = 0.42 * clamp((q.w - uHaze.x) / uHaze.y, 0.0, 1.0);
      gl_Position = q;
    }`;
  // A place in a texture of 4096 pixels needs more digits than "mediump" promises, so "highp" is used where the
  // device has it (nearly all have).
  const fine = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision > 0 ? 'highp' : 'mediump';
  const MESH_FS = `
    precision ${fine} float;
    uniform sampler2D uTex; uniform vec3 uBg;
    varying vec2 vAt; varying float vCut; varying float vHaze;
    void main() {
      if (vCut > 0.0) discard;
      vec3 c = texture2D(uTex, vAt).rgb;
      c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, 1.12);
      c = (c - 0.5) * 1.05 + 0.51;
      gl_FragColor = vec4(mix(c, uBg, vHaze), 1.0);
    }`;
  const FLAT_VS = 'attribute vec3 aPos; uniform mat4 uMat; void main() { gl_Position = uMat * vec4(aPos, 1.0); }';
  const FLAT_FS = 'precision mediump float; uniform vec4 uColor; void main() { gl_FragColor = uColor; }';

  let meshProg = null, flatProg = null, loc = {}, floorBuf = null, gridBuf = null, gridCount = 0;
  const mesh = [];                      // the parts of the mesh: { pos, at, idx, ball, group, nv, nt, posBuf, atBuf, idxBuf }
  const GROUP = 64;                     // triangles that follow each other in the file lie together: see `meet`
  let tex = null, shown = null;         // the texture on the model, and which entry of `textures` it is
  let loaded = 0;                       // triangles that can be drawn

  function setup() {
    meshProg = program(MESH_VS, MESH_FS);
    flatProg = program(FLAT_VS, FLAT_FS);
    if (!meshProg || !flatProg) return false;
    for (const name of ['uMat', 'uOrigin', 'uStep', 'uCut', 'uHaze', 'uTex', 'uBg']) loc[name] = gl.getUniformLocation(meshProg, name);
    loc.aPos = gl.getAttribLocation(meshProg, 'aPos');
    loc.aAt = gl.getAttribLocation(meshProg, 'aAt');
    loc.fMat = gl.getUniformLocation(flatProg, 'uMat');
    loc.fColor = gl.getUniformLocation(flatProg, 'uColor');
    loc.fPos = gl.getAttribLocation(flatProg, 'aPos');
    // The floor plate under the room and a grid on it with squares of one metre.
    const m = 0.3, x0 = S.origin[0] - m, y0 = S.origin[1] - m, x1 = S.box[0] + m, y1 = S.box[1] + m, z = S.origin[2] - 0.01;
    floorBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x0, y0, z, x1, y0, z, x0, y1, z, x1, y1, z]), gl.STATIC_DRAW);
    const lines = [];
    for (let gx = Math.ceil(x0); gx <= x1; gx++) lines.push(gx, y0, z, gx, y1, z);
    for (let gy = Math.ceil(y0); gy <= y1; gy++) lines.push(x0, gy, z, x1, gy, z);
    gridBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
    gridCount = lines.length / 3;
    for (const c of mesh) upload(c);
    return true;
  }
  function upload(c) {
    c.posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, c.posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, c.pos, gl.STATIC_DRAW);
    c.atBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, c.atBuf);
    gl.bufferData(gl.ARRAY_BUFFER, c.at, gl.STATIC_DRAW);
    c.idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, c.idx, gl.STATIC_DRAW);
  }
  // Puts a picture on the model as its texture. Smaller copies are made for surfaces that are far away, and
  // surfaces seen at a flat angle (the floor, the benches) are drawn with more care where the device can.
  // Answers false when the device cannot hold the picture; the model then keeps the texture it has.
  function dress(picture, entry) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    for (let n = 0; n < 8 && gl.getError() !== gl.NO_ERROR; n++) { /* earlier errors are not about this picture */ }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, picture);
    gl.generateMipmap(gl.TEXTURE_2D);
    const held = gl.getError() === gl.NO_ERROR && !gl.isContextLost();
    if (picture.close) picture.close();
    if (!held) { gl.deleteTexture(t); gl.bindTexture(gl.TEXTURE_2D, tex); return false; }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const care = gl.getExtension('EXT_texture_filter_anisotropic');
    if (care) gl.texParameterf(gl.TEXTURE_2D, care.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(care.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    if (tex) gl.deleteTexture(tex);
    tex = t;
    shown = entry;
    return true;
  }

  function draw(dt) {
    update();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(BG[0], BG[1], BG[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // the floor plate and its grid lie under everything else, so they are drawn first and without depth
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(flatProg);
    gl.uniformMatrix4fv(loc.fMat, false, mat);
    gl.enableVertexAttribArray(loc.fPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, floorBuf);
    gl.vertexAttribPointer(loc.fPos, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(loc.fColor, 0.066, 0.086, 0.125, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
    gl.vertexAttribPointer(loc.fPos, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(loc.fColor, 0.13, 0.165, 0.235, 1);
    gl.drawArrays(gl.LINES, 0, gridCount);
    gl.disableVertexAttribArray(loc.fPos);

    if (loaded && tex) {
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);          // a surface is drawn only from the side that faced the scanner
      gl.useProgram(meshProg);
      gl.uniformMatrix4fv(loc.uMat, false, mat);
      gl.uniform3f(loc.uOrigin, S.origin[0], S.origin[1], S.origin[2]);
      gl.uniform1f(loc.uStep, S.step);
      gl.uniform3f(loc.uCut, cutN[0], cutN[1], cutD);
      gl.uniform2f(loc.uHaze, dist - 2.5, 9);
      gl.uniform3f(loc.uBg, BG[0], BG[1], BG[2]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(loc.uTex, 0);
      gl.enableVertexAttribArray(loc.aPos);
      gl.enableVertexAttribArray(loc.aAt);
      for (const c of mesh) {
        gl.bindBuffer(gl.ARRAY_BUFFER, c.posBuf);
        gl.vertexAttribPointer(loc.aPos, 3, gl.UNSIGNED_SHORT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, c.atBuf);
        gl.vertexAttribPointer(loc.aAt, 2, gl.UNSIGNED_SHORT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.idxBuf);
        gl.drawElements(gl.TRIANGLES, 3 * c.nt, gl.UNSIGNED_SHORT, 0);
      }
      gl.disableVertexAttribArray(loc.aPos);
      gl.disableVertexAttribArray(loc.aAt);
      gl.disable(gl.CULL_FACE);
    }
    return place(dt);
  }

  // The labels sit above their instruments, each on a thin line. Where two labels would overlap, the upper one
  // is lifted clear of the lower one. A label outside the picture, or of an instrument that is cut away, is hidden.
  // Returns true while a label is still on its way to its place.
  const STEM = 16;
  function place(dt) {
    const list = [];
    for (const s of spots) {
      const p = project(s.view.spot);
      const a = s.view.spot;
      const on = !!p && a[0] * cutN[0] + a[1] * cutN[1] < cutD && p[0] > 6 && p[0] < W - 6 && p[1] > 44 && p[1] < H + 12;
      if (on === s.node.hidden) { s.node.hidden = s.stem.hidden = !on; s.lift = 0; s.w = 0; }
      if (!on) { s.p = null; continue; }
      if (!s.w) { s.w = s.node.offsetWidth; s.h = s.node.offsetHeight; }
      s.p = p;
      list.push(s);
    }
    list.sort((a, b) => b.p[1] - a.p[1]);    // from the bottom of the picture upwards
    const placed = [];
    let busy = false;
    for (const s of list) {
      const cx = clamp(s.p[0], s.w / 2 + 6, Math.max(s.w / 2 + 6, W - s.w / 2 - 6));
      const base = s.p[1] - STEM - s.h;
      let top = base;
      for (let n = 0; n < 6; n++) {
        const hit = placed.find((q) => Math.abs(q.cx - cx) < (q.w + s.w) / 2 + 6 && top < q.top + q.h + 4 && top + s.h > q.top - 4);
        if (!hit) break;
        top = hit.top - s.h - 5;
      }
      const want = base - top;
      s.lift = dt > 0 ? s.lift + (want - s.lift) * Math.min(1, dt * 10) : want;
      if (Math.abs(want - s.lift) < 0.5) s.lift = want; else busy = true;
      const y = Math.max(4, base - s.lift);
      placed.push({ cx, top: y, w: s.w, h: s.h });
      s.node.style.transform = `translate(${(cx - s.w / 2).toFixed(1)}px, ${y.toFixed(1)}px)`;
      s.stem.style.transform = `translate(${s.p[0].toFixed(1)}px, ${(y + s.h).toFixed(1)}px)`;
      s.stem.style.height = `${Math.max(0, s.p[1] - y - s.h).toFixed(1)}px`;
    }
    return busy;
  }

  // Where a straight line from `o` in the direction `d` (of length one) first meets the model, as the distance
  // in metres, or Infinity when it meets nothing within `reach`. Only what is drawn counts: the side of a surface
  // that faced the scanner, and nothing beyond the cut. Nearly all triangles are ruled out quickly: there is a
  // ball around every GROUP triangles in a row, and a ball around each triangle, and the line must pass through
  // both before the triangle itself is looked at.
  function meet(o, d, reach) {
    const st = S.step, ox = S.origin[0], oy = S.origin[1], oz = S.origin[2];
    let best = reach, found = false;
    const miss = (B, b) => {
      const r = B[b + 3], cx = B[b] - o[0], cy = B[b + 1] - o[1], cz = B[b + 2] - o[2];
      const along = cx * d[0] + cy * d[1] + cz * d[2];
      return along < -r || along > best + r || cx * cx + cy * cy + cz * cz - along * along > r * r;
    };
    for (const c of mesh) {
      const B = c.ball, G = c.group, P = c.pos, I = c.idx;
      for (let g = 0, groups = G.length / 4; g < groups; g++) {
        if (miss(G, 4 * g)) continue;
        for (let t = g * GROUP, n = Math.min(c.nt, t + GROUP); t < n; t++) {
          if (miss(B, 4 * t)) continue;
          const i0 = 3 * I[3 * t], i1 = 3 * I[3 * t + 1], i2 = 3 * I[3 * t + 2];
          const ax = P[i0], ay = P[i0 + 1], az = P[i0 + 2];
          const e1x = (P[i1] - ax) * st, e1y = (P[i1 + 1] - ay) * st, e1z = (P[i1 + 2] - az) * st;
          const e2x = (P[i2] - ax) * st, e2y = (P[i2 + 1] - ay) * st, e2z = (P[i2 + 2] - az) * st;
          const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x;
          const det = e1x * px + e1y * py + e1z * pz;
          if (det < 1e-12) continue;    // seen from behind or edge-on: not drawn
          const tx = o[0] - (ax * st + ox), ty = o[1] - (ay * st + oy), tz = o[2] - (az * st + oz);
          const u = tx * px + ty * py + tz * pz;
          if (u < 0 || u > det) continue;
          const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
          const v = d[0] * qx + d[1] * qy + d[2] * qz;
          if (v < 0 || u + v > det) continue;
          const w = (e2x * qx + e2y * qy + e2z * qz) / det;
          if (w < 0.05 || w >= best) continue;
          if ((o[0] + d[0] * w) * cutN[0] + (o[1] + d[1] * w) * cutN[1] > cutD) continue;
          best = w; found = true;
        }
      }
    }
    return found ? best : Infinity;
  }

  // In a close view, a label is faded out while its instrument is covered by something nearer to the camera.
  // (With the whole room in view all labels stay, as a key to the room.) This is done a few times a second,
  // not for every picture.
  let looked = 0;
  function cover(now) {
    if (now - looked < 280 || !loaded) return;
    looked = now;
    for (const s of spots) {
      if (!s.p) continue;
      let covered = false;
      if (cam.span <= 7) {
        const a = s.view.spot, d = [a[0] - eye[0], a[1] - eye[1], a[2] - eye[2]], far = Math.hypot(d[0], d[1], d[2]);
        covered = far > 0.8 && meet(eye, d.map((v) => v / far), far - 0.7) < Infinity;
      }
      if (covered !== s.covered) { s.covered = covered; s.node.classList.toggle('covered', covered); s.stem.classList.toggle('covered', covered); }
    }
  }

  /* ---------- the triangles and the textures ---------- */
  // Fetches a file and tells `got` how many bytes have arrived so far.
  async function fetchBytes(item, got) {
    const res = await fetch(item.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!res.body || !res.body.getReader) return new Uint8Array(await res.arrayBuffer());
    const reader = res.body.getReader(), chunks = [];
    let n = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      n += value.length;
      got(Math.min(n, item.bytes));
    }
    const bytes = new Uint8Array(n);
    let at = 0;
    for (const c of chunks) { bytes.set(c, at); at += c.length; }
    return bytes;
  }
  // Undoes the packing described at `pack` in tools/scan/prepare.py. The mesh comes in parts of at most 65,535
  // corners. For every corner the file holds the differences to the corner before it: of its place in the room
  // and of its place in the texture. For every triangle it holds three numbers: 0 for the next new corner,
  // otherwise how far back from the next new corner the corner lies.
  function decode(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = view.getUint32(0, true), parts = [];
    let from = 4 + 8 * count;
    for (let k = 0; k < count; k++) {
      const nv = view.getUint32(4 + 8 * k, true), nt = view.getUint32(8 + 8 * k, true);
      if (from + 10 * nv + 6 * nt > bytes.length) throw new Error('short file');
      const pos = new Uint16Array(3 * nv), at = new Uint16Array(2 * nv), idx = new Uint16Array(3 * nt);
      const row = (to, width, a) => {
        const lo = bytes.subarray(from, from + nv), hi = bytes.subarray(from + nv, from + 2 * nv);
        let v = 0;
        for (let i = 0; i < nv; i++) { const z = lo[i] | (hi[i] << 8); v = (v + ((z >>> 1) ^ -(z & 1))) & 65535; to[width * i + a] = v; }
        from += 2 * nv;
      };
      for (let a = 0; a < 3; a++) row(pos, 3, a);
      for (let a = 0; a < 2; a++) row(at, 2, a);
      const lo = bytes.subarray(from, from + 3 * nt), hi = bytes.subarray(from + 3 * nt, from + 6 * nt);
      let next = 0;
      for (let i = 0; i < 3 * nt; i++) { const back = lo[i] | (hi[i] << 8); idx[i] = back ? next - back : next++; }
      from += 6 * nt;
      // For `meet`: the ball around each triangle (its middle, and how far its corners are from there), and the
      // ball around every GROUP triangles in a row. The file lists neighbouring triangles one after the other, so
      // these groups are small patches of the surface.
      const ball = new Float32Array(4 * nt), group = new Float32Array(4 * Math.ceil(nt / GROUP)), st = S.step;
      for (let t = 0; t < nt; t++) {
        const i0 = 3 * idx[3 * t], i1 = 3 * idx[3 * t + 1], i2 = 3 * idx[3 * t + 2];
        const x = (pos[i0] + pos[i1] + pos[i2]) / 3, y = (pos[i0 + 1] + pos[i1 + 1] + pos[i2 + 1]) / 3, z = (pos[i0 + 2] + pos[i1 + 2] + pos[i2 + 2]) / 3;
        let r = 0;
        for (const i of [i0, i1, i2]) r = Math.max(r, Math.hypot(pos[i] - x, pos[i + 1] - y, pos[i + 2] - z));
        ball[4 * t] = x * st + S.origin[0]; ball[4 * t + 1] = y * st + S.origin[1]; ball[4 * t + 2] = z * st + S.origin[2]; ball[4 * t + 3] = r * st + 1e-4;
      }
      for (let g = 0, t0 = 0; t0 < nt; g++, t0 += GROUP) {
        const t1 = Math.min(nt, t0 + GROUP);
        let x = 0, y = 0, z = 0, r = 0;
        for (let t = t0; t < t1; t++) { x += ball[4 * t]; y += ball[4 * t + 1]; z += ball[4 * t + 2]; }
        x /= t1 - t0; y /= t1 - t0; z /= t1 - t0;
        for (let t = t0; t < t1; t++) r = Math.max(r, Math.hypot(ball[4 * t] - x, ball[4 * t + 1] - y, ball[4 * t + 2] - z) + ball[4 * t + 3]);
        group[4 * g] = x; group[4 * g + 1] = y; group[4 * g + 2] = z; group[4 * g + 3] = r + 1e-4;
      }
      parts.push({ pos, at, idx, ball, group, nv, nt });
    }
    return parts;
  }
  async function fetchMesh(got) {
    let bytes = await fetchBytes(S.mesh, got);
    // The file is packed with gzip. A server that has already unpacked it on the way is fine too.
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    }
    return decode(bytes);
  }
  // A texture as a picture that is ready to be put on the model.
  async function fetchPicture(entry, got) {
    const blob = new Blob([await fetchBytes(entry, got || (() => {}))], { type: 'image/webp' });
    if (window.createImageBitmap) {
      try { return await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }); } catch (err) { /* the long way below */ }
    }
    const img = new Image(), url = URL.createObjectURL(blob);
    try {
      await new Promise((ok, fail) => { img.onload = ok; img.onerror = () => fail(new Error('picture')); img.src = url; });
    } finally { URL.revokeObjectURL(url); }
    return img;
  }

  async function load() {
    const start = textures[0], best = textures[textures.length - 1];
    const all = S.mesh.bytes + start.bytes, got = [0, 0];
    const progress = (k) => (n) => { got[k] = n; meter.style.setProperty('--done', `${Math.round(100 * clamp((got[0] + got[1]) / all, 0, 1))}%`); };
    try {
      const [parts, picture] = await Promise.all([fetchMesh(progress(0)), fetchPicture(start, progress(1))]);
      if (!dress(picture, start)) throw new Error('texture');
      for (const c of parts) { upload(c); mesh.push(c); loaded += c.nt; }
    } catch (err) {
      // Without the model, the picture of the scan stays.
      noteText.textContent = 'The 3D model could not be loaded. The picture shows the scan.';
      note.classList.add('failed');
      return;
    }
    note.hidden = true;
    root.classList.add('live');
    begin();
    need();
    if (best === start) return;
    try { dress(await fetchPicture(best), best); need(); } catch (err) { /* the model keeps the smaller texture */ }
  }

  /* ---------- moving ---------- */
  let raf = 0, last = 0, auto = false, seen = false, inView = true, drift = 0, slow = 0, sharp = 1;
  let flight = null;                    // { from, to, t, time } while the camera flies to a view
  const need = () => { if (!raf) raf = requestAnimationFrame(frame); };

  // In a frame that is square or upright the camera stands a little further away, so that the room fits its width.
  const fit = () => (W / H < 1.15 ? 1.14 : 1);
  function target(v) {
    const span = v.look[2] * fit();
    return { x: v.at[0], y: v.at[1], z: v.at[2], az: v.look[0] * DEG, el: v.look[1] * DEG, span, cut: v.cut || cutFor(span) };
  }
  // Flies the camera to a state `to`. On a long way it rises a little in between, so that the room stays in view.
  function flyTo(to, time) {
    // turn the short way round
    to.az = cam.az + ((to.az - cam.az + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    if (still || time <= 0) { Object.assign(cam, to); flight = null; } else flight = { from: { ...cam }, to, t: 0, time, rise: 0.3 * Math.hypot(to.x - cam.x, to.y - cam.y) };
    need();
  }
  const fly = (v, time) => flyTo(target(v), time);
  function show(key) {
    current = key;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.key === key));
    for (const i of infos) i.hidden = i.dataset.key !== key;
    for (const s of spots) s.node.classList.toggle('on', s.view.key === key);
  }
  // A view chosen by the visitor: the tour stops there. The address of the page then names the view
  // (/tour#press), so that it can be passed on, and so that the equipment page can link to an instrument.
  function choose(key) {
    setAuto(false);
    show(key);
    fly(byKey[key], 1.4);
    try { history.replaceState(null, '', key === first.key ? location.pathname + location.search : `#${key}`); } catch (err) { /* the address stays as it is */ }
  }
  function named() {
    let key = '';
    try { key = decodeURIComponent(location.hash.slice(1)); } catch (err) { /* not a view */ }
    return byKey[key] ? key : '';
  }

  // The tour: every view in turn. The model turns slowly while the camera rests.
  let stop = 0, rest = 0;
  function nextStop() {
    stop = (stop + 1) % views.length;
    const v = views[stop];
    show(v.key);
    fly(v, 2.4);
    rest = v.rest || 8;
    drift = (v.turn == null ? 2 : v.turn) * DEG;
  }
  function setAuto(on) {
    if (on === auto) return;
    auto = on;
    play.innerHTML = `${auto ? ICON.pause : ICON.play}<span>${auto ? 'Pause' : 'Play'}</span>`;
    play.setAttribute('aria-label', auto ? 'Pause the tour of the laboratory' : 'Play the tour of the laboratory');
    if (auto) {
      // go on from the view that is shown
      stop = Math.max(0, views.findIndex((v) => v.key === current));
      rest = views[stop].rest || 8;
      drift = (views[stop].turn == null ? 2 : views[stop].turn) * DEG;
      last = 0;
      need();
    }
  }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    let moving = false;
    if (flight) {
      flight.t += dt;
      const u = ease(clamp(flight.t / flight.time, 0, 1));
      for (const k of ['x', 'y', 'z', 'az', 'el', 'span', 'cut']) cam[k] = lerp(flight.from[k], flight.to[k], u);
      const up = flight.rise * Math.sin(Math.PI * u);
      cam.span += up; cam.cut += up * 0.66;
      if (flight.t >= flight.time) flight = null;
      moving = true;
    } else if (auto && inView && loaded) {
      cam.az += drift * dt;
      rest -= dt;
      if (rest <= 0) nextStop();
      moving = true;
    }
    if (draw(dt)) moving = true;
    cover(now);
    if (moving) {
      // On a machine that cannot keep up, the picture is drawn with fewer pixels from then on.
      slow = dt > 0.036 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 24 && sharp > 0.6) { sharp *= 0.8; slow = 0; resize(); }
      need();
    } else {
      last = 0;
      if (looked !== now) setTimeout(need, 300);       // one more look at the labels once the camera rests
    }
  }

  /* ---------- turning, zooming and moving by hand ---------- */
  const SPAN = [2.4, 15];
  const hold = () => { setAuto(false); flight = null; };
  function zoom(factor) {
    const span = clamp(cam.span * factor, SPAN[0], SPAN[1]);
    // the cut keeps its share of the picture, and moves out of the room when the whole room is in view
    cam.cut = clamp(cam.cut * span / cam.span, 1.1, 9);
    if (span > 7.5) cam.cut = Math.max(cam.cut, cutFor(span));
    cam.span = span;
    need();
  }
  function turn(dx, dy) {
    cam.az -= dx * 0.0062;
    cam.el = clamp(cam.el + dy * 0.005, 7 * DEG, 89.4 * DEG);
    need();
  }
  // Moves the point the camera looks at over the floor, by a distance in pixels on screen.
  function slide(dx, dy) {
    const m = cam.span / Math.min(W, H);
    const sa = Math.sin(cam.az), ca = Math.cos(cam.az), se = Math.max(0.35, Math.sin(cam.el));
    cam.x = clamp(cam.x + (dx * sa + dy * ca / se) * m, S.origin[0], S.box[0]);
    cam.y = clamp(cam.y + (-dx * ca + dy * sa / se) * m, S.origin[1], S.box[1]);
    need();
  }

  // With a mouse: drag to turn and tilt, drag with Shift or the right button to move over the floor.
  // With a finger: swipe sideways to turn (a swipe up or down scrolls the page as usual), two fingers apart or
  // together to zoom, and two fingers in one direction to move over the floor.
  const fingers = new Map();
  let active = false, pinch = 0, mid = null, tap = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button > 2) return;
    const touch = e.pointerType === 'touch';
    if (!touch) { active = true; hold(); }
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: e.timeStamp, touch, slide: e.button === 2 || e.shiftKey });
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* the pointer is already gone */ }
    pinch = 0; mid = null;
    if (fingers.size === 2) hold();
    canvas.classList.add('held');
  });
  canvas.addEventListener('pointermove', (e) => {
    const f = fingers.get(e.pointerId);
    if (!f) return;
    const dx = e.clientX - f.x, dy = e.clientY - f.y;
    f.x = e.clientX; f.y = e.clientY;
    if (fingers.size === 1) {
      if (f.slide) slide(dx, dy);
      else if (!f.touch) turn(dx, dy);
      else if (dx) { hold(); turn(dx, 0); }
    } else if (fingers.size === 2) {
      const [a, b] = Array.from(fingers.values());
      const gap = Math.hypot(a.x - b.x, a.y - b.y), m = [(a.x + b.x) / 2, (a.y + b.y) / 2];
      if (pinch && gap > 0) zoom(pinch / gap);
      if (mid) slide(m[0] - mid[0], m[1] - mid[1]);
      pinch = gap; mid = m;
    }
  });
  const release = (e) => {
    const f = fingers.get(e.pointerId);
    fingers.delete(e.pointerId);
    pinch = 0; mid = null;
    if (!fingers.size) canvas.classList.remove('held');
    // two short taps of a finger at one place count as a double click
    if (f && f.touch && e.type === 'pointerup' && e.timeStamp - f.t < 300 && Math.hypot(e.clientX - f.x0, e.clientY - f.y0) < 12) {
      if (tap && e.timeStamp - tap.t < 420 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 30) { tap = null; closer(e.clientX, e.clientY); } else tap = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    }
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { if (!fingers.size) active = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  // The wheel zooms once the visitor has taken hold of the model (or holds Ctrl). Before that it scrolls the
  // page as usual, so that the model does not trap visitors who are scrolling past it.
  canvas.addEventListener('wheel', (e) => {
    if (!active && !e.ctrlKey) return;
    e.preventDefault();
    hold();
    zoom(Math.exp(clamp(e.deltaY, -120, 120) * 0.0016));
  }, { passive: false });
  canvas.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [24, 0], ArrowRight: [-24, 0], ArrowUp: [0, 16], ArrowDown: [0, -16] }[e.key];
    if (step) { hold(); turn(step[0], step[1]); } else if (e.key === '+' || e.key === '=') { hold(); zoom(0.87); } else if (e.key === '-') { hold(); zoom(1.15); } else return;
    e.preventDefault();
  });
  // A double click, or a double tap, brings the spot under the pointer to the middle and comes closer.
  let cameCloser = 0, picked = null;
  function closer(clientX, clientY) {
    if (performance.now() - cameCloser < 500) return;      // a double tap may arrive as a double click as well
    const box = canvas.getBoundingClientRect();
    const hit = pick(clientX - box.left, clientY - box.top);
    if (!hit) return;
    cameCloser = performance.now(); picked = hit;
    hold();
    const span = Math.max(SPAN[0] + 0.6, Math.min(cam.span * 0.6, 5));
    flyTo({ ...cam, x: hit[0], y: hit[1], z: clamp(hit[2], 0.5, 1.6), span, cut: cutFor(span) }, 0.9);
  }
  canvas.addEventListener('dblclick', (e) => closer(e.clientX, e.clientY));
  // The place on the model under a place in the picture, as [x, y, z] in the room, or null.
  function pick(px, py) {
    if (!loaded || !axes) return null;
    const sx = (2 * px / W - 1) / lens[0], sy = (1 - 2 * py / H) / lens[1];
    const d = [0, 1, 2].map((k) => axes[0][k] * sx + axes[1][k] * sy - axes[2][k]);
    const len = Math.hypot(d[0], d[1], d[2]);
    for (let k = 0; k < 3; k++) d[k] /= len;
    const w = meet(eye, d, dist + 12);
    return w < Infinity ? [eye[0] + d[0] * w, eye[1] + d[1] * w, eye[2] + d[2] * w] : null;
  }

  zin.addEventListener('click', () => { hold(); zoom(0.8); });
  zout.addEventListener('click', () => { hold(); zoom(1.25); });
  for (const b of buttons) b.addEventListener('click', () => choose(b.dataset.key));
  play.addEventListener('click', () => { setAuto(!auto); if (auto && current !== views[stop].key) show(views[stop].key); });

  /* ---------- size, visibility and start ---------- */
  const textBox = root.querySelector('.scan-text');
  function reserve() {
    if (!textBox) return;
    let h = 0;
    for (const i of infos) { const was = i.hidden; i.hidden = false; h = Math.max(h, Math.ceil(i.getBoundingClientRect().height)); i.hidden = was; }
    textBox.style.minHeight = `${h}px`;
  }
  function resize() {
    const box = stage.getBoundingClientRect();
    if (!box.width || !box.height) return;
    if (box.width !== W) reserve();
    W = box.width; H = box.height;
    ratio = Math.min(window.devicePixelRatio || 1, 2) * sharp;
    const w = Math.round(W * ratio), h = Math.round(H * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    for (const s of spots) s.w = 0;       // the labels are measured again
    need();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  if (window.IntersectionObserver) {
    new IntersectionObserver((list) => {
      inView = list[list.length - 1].isIntersecting;
      if (inView) { last = 0; need(); }
    }, { threshold: 0.2 }).observe(stage);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = 0; need(); } });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0; });
  // A browser may take the model away, from a page in the background or when the device runs short of memory.
  // When it gives the canvas back, the triangles are sent again from memory and the texture is fetched again
  // (from the cache of the browser): one size smaller than before, in case the large one was too much.
  canvas.addEventListener('webglcontextrestored', () => {
    const again = shown && textures[Math.max(0, textures.indexOf(shown) - 1)];
    tex = shown = null;
    if (!setup()) return;
    need();
    if (again) fetchPicture(again).then((picture) => { dress(picture, again); need(); }).catch(() => {});
  });

  // Called when the model is there: the tour starts, unless reduced motion is asked for
  // or the address of the page names a view.
  function begin() {
    if (seen) return;
    seen = true;
    if (!still && !asked) setAuto(true);
  }

  if (!setup()) return;
  root.classList.add('ready');
  auto = true; setAuto(false);          // writes the Play button
  resize();
  const asked = named();
  show(asked || first.key);
  Object.assign(cam, target(byKey[asked || first.key]));
  window.addEventListener('hashchange', () => { const key = named(); if (key && key !== current) choose(key); });
  load();

  // For whoever adds or corrects a view (see the README). In the console of the browser,
  // document.getElementById('tour-embed').scan.where() answers with the present view the way it is written in
  // src/data.mjs, and with the point of the model that was double-clicked last. `state` and `pick` serve the tests.
  const round = (v, n) => Math.round(v * n) / n;
  const where = () => ({
    at: [cam.x, cam.y, cam.z].map((v) => round(v, 100)),
    look: [round(((cam.az / DEG + 180) % 360 + 360) % 360 - 180, 10), round(cam.el / DEG, 10), round(cam.span / fit(), 10)],
    cut: round(cam.cut, 100),
    picked: picked && picked.map((v) => round(v, 100)),
  });
  root.scan = { cam, pick, where, draw: need, state: () => ({ ...cam, az: cam.az / DEG, el: cam.el / DEG, loaded, texture: shown ? shown.size : 0, current, auto }) };
})();
