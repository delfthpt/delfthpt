/* Delft High PT Lab: the 3D scan of the laboratory on the Virtual tour page. Plain WebGL, no dependencies.

   The page (see "Virtual tour" in build.mjs) holds a picture of the scan, a button for each view and a block of
   text for each view. This script puts the model over the picture and lets visitors turn it. The facts about the
   scan, the views and the labelled instruments are in src/data.mjs under `scan` and arrive here in data-scan.

   The points come in three parts (public/scan/room-1.bin and so on; the README tells how they are made). The first
   part alone shows the whole room thinly, so the model appears quickly and fills in while the rest arrives.

   Play runs a tour: the model turns slowly, then the camera visits each instrument and rests there. Turning the
   model, zooming or choosing a view stops the tour, and Play starts it again. For visitors who have asked their
   device for reduced motion nothing moves by itself until they press Play, and the camera jumps instead of flying. */
(() => {
  'use strict';
  const root = document.getElementById('tour-embed');
  if (!root || !root.dataset.scan) return;
  const stage = root.querySelector('.scan-stage');
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  // Without WebGL, or without a way to unpack the points, the picture and the texts stay as they are.
  if (!stage || !gl || !window.fetch || typeof DecompressionStream === 'undefined') return;

  const S = JSON.parse(root.dataset.scan);
  const DEG = Math.PI / 180;
  const FOV = 34 * DEG;                 // angle of view over the shorter side of the picture
  const BG = [7 / 255, 10 / 255, 16 / 255];
  const SPACING = 0.027;                // distance between neighbouring points in the scan, in metres
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia && matchMedia('(max-width: 700px)').matches;
  // Visitors who have asked their browser to save data, and devices with little memory, get the first two
  // parts: half of the points, drawn a little larger.
  const frugal = !!(navigator.connection && navigator.connection.saveData) || (navigator.deviceMemory || 8) <= 2;
  const parts = S.parts.slice(0, frugal ? 2 : 3);
  const total = S.parts.reduce((n, p) => n + p.points, 0);

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
  let mat = null, eye = [0, 0, 0], dist = 1, scale = 1;
  let cutN = [1, 0], cutD = 99;          // the cut: points with x*cutN[0] + y*cutN[1] beyond cutD are left away
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
    scale = H * ratio * f / 2;           // device pixels per metre at a distance of one metre
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
  // Each point is a small disc that faces the camera. A wall is thinned out and then left away as the camera
  // moves to the outside of it (uHide), and far points are dimmed a little so that the room keeps its depth.
  const POINT_VS = `
    attribute vec3 aPos; attribute vec3 aCol;
    uniform mat4 uMat; uniform vec3 uOrigin; uniform float uStep; uniform float uSize; uniform float uMax;
    uniform vec3 uWall; uniform vec3 uHide; uniform vec3 uCut; uniform vec2 uHaze; uniform vec3 uBg;
    varying vec3 vCol; varying float vRound;
    void main() {
      vec3 p = aPos * uStep + uOrigin;
      vec4 q = uMat * vec4(p, 1.0);
      gl_PointSize = clamp(uSize / q.w, 1.5, uMax);
      vRound = step(3.5, gl_PointSize);
      float hide = 0.0;
      if (p.x < uWall.x) hide = max(hide, uHide.x);
      if (p.y > uWall.y) hide = max(hide, uHide.y);
      if (p.y < uWall.z) hide = max(hide, uHide.z);
      float r = fract(sin(dot(aPos.xy, vec2(0.129898, 0.78233)) + aPos.z * 0.37719) * 43758.5453);
      if (dot(p.xy, uCut.xy) - uCut.z > (r - 0.5) * 0.08) hide = 2.0;
      vec3 c = aCol;
      c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, 1.18);
      c = (c - 0.5) * 1.08 + 0.52;
      vCol = mix(c, uBg, 0.42 * clamp((q.w - uHaze.x) / uHaze.y, 0.0, 1.0));
      gl_Position = r < hide ? vec4(2.0, 2.0, 2.0, 1.0) : q;
    }`;
  const POINT_FS = `
    precision mediump float;
    varying vec3 vCol; varying float vRound;
    void main() {
      vec2 d = gl_PointCoord - 0.5;
      if (vRound > 0.5 && dot(d, d) > 0.25) discard;
      gl_FragColor = vec4(vCol, 1.0);
    }`;
  const FLAT_VS = 'attribute vec3 aPos; uniform mat4 uMat; void main() { gl_Position = uMat * vec4(aPos, 1.0); }';
  const FLAT_FS = 'precision mediump float; uniform vec4 uColor; void main() { gl_FragColor = uColor; }';

  let pointProg = null, flatProg = null, loc = {}, floorBuf = null, gridBuf = null, gridCount = 0, maxSize = 64;
  const clouds = [];                    // one entry for each part that has arrived: { pos, col, n, posBuf, colBuf }
  let loaded = 0;

  function setup() {
    pointProg = program(POINT_VS, POINT_FS);
    flatProg = program(FLAT_VS, FLAT_FS);
    if (!pointProg || !flatProg) return false;
    for (const name of ['uMat', 'uOrigin', 'uStep', 'uSize', 'uMax', 'uWall', 'uHide', 'uCut', 'uHaze', 'uBg']) loc[name] = gl.getUniformLocation(pointProg, name);
    loc.aPos = gl.getAttribLocation(pointProg, 'aPos');
    loc.aCol = gl.getAttribLocation(pointProg, 'aCol');
    loc.fMat = gl.getUniformLocation(flatProg, 'uMat');
    loc.fColor = gl.getUniformLocation(flatProg, 'uColor');
    loc.fPos = gl.getAttribLocation(flatProg, 'aPos');
    maxSize = Math.min(96, gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]);
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
    for (const c of clouds) upload(c);
    return true;
  }
  function upload(c) {
    c.posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, c.posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, c.pos, gl.STATIC_DRAW);
    c.colBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, c.colBuf);
    gl.bufferData(gl.ARRAY_BUFFER, c.col, gl.STATIC_DRAW);
  }

  // How far a wall is hidden: not at all while the camera is inside the room, fully once it is well outside.
  const outside = (d) => clamp(d / 0.9, 0, 1);

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

    if (loaded) {
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(pointProg);
      gl.uniformMatrix4fv(loc.uMat, false, mat);
      gl.uniform3f(loc.uOrigin, S.origin[0], S.origin[1], S.origin[2]);
      gl.uniform1f(loc.uStep, S.step);
      // With fewer points each disc is larger, so that surfaces stay closed while the model fills in. A part of
      // the points is spread less evenly than all of them, hence the extra fifth.
      gl.uniform1f(loc.uSize, SPACING * 1.45 * Math.sqrt(total / loaded) * (loaded < total ? 1.2 : 1) * scale);
      gl.uniform1f(loc.uMax, maxSize);
      gl.uniform3f(loc.uWall, S.walls[0], S.walls[1], S.walls[2]);
      gl.uniform3f(loc.uHide, outside(S.walls[0] - eye[0]), outside(eye[1] - S.walls[1]), outside(S.walls[2] - eye[1]));
      gl.uniform3f(loc.uCut, cutN[0], cutN[1], cutD);
      gl.uniform2f(loc.uHaze, dist - 2.5, 9);
      gl.uniform3f(loc.uBg, BG[0], BG[1], BG[2]);
      gl.enableVertexAttribArray(loc.aPos);
      gl.enableVertexAttribArray(loc.aCol);
      for (const c of clouds) {
        gl.bindBuffer(gl.ARRAY_BUFFER, c.posBuf);
        gl.vertexAttribPointer(loc.aPos, 3, gl.UNSIGNED_SHORT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, c.colBuf);
        gl.vertexAttribPointer(loc.aCol, 3, gl.UNSIGNED_BYTE, true, 0, 0);
        gl.drawArrays(gl.POINTS, 0, c.n);
      }
      gl.disableVertexAttribArray(loc.aPos);
      gl.disableVertexAttribArray(loc.aCol);
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

  // In a close view, a label is faded out while its instrument is covered by something nearer to the camera.
  // (With the whole room in view all labels stay, as a key to the room.) This goes through all points, so it
  // is done a few times a second at most, not for every picture.
  let looked = 0;
  function cover(now) {
    if (now - looked < 280 || !loaded) return;
    looked = now;
    const list = spots.filter((s) => s.p);
    if (!list.length) return;
    if (cam.span > 7) {
      for (const s of list) if (s.covered) { s.covered = false; s.node.classList.remove('covered'); s.stem.classList.remove('covered'); }
      return;
    }
    const n = list.length, sx = list.map((s) => s.p[0]), sy = list.map((s) => s.p[1]), sw = list.map((s) => s.p[2] - 0.7), hits = new Array(n).fill(0);
    const far = Math.max(...sw), reach = 5, ox = S.origin[0], oy = S.origin[1], oz = S.origin[2], st = S.step;
    const hw = [outside(S.walls[0] - eye[0]) > 0.5, outside(eye[1] - S.walls[1]) > 0.5, outside(S.walls[2] - eye[1]) > 0.5];
    for (const c of clouds) {
      const P = c.pos;
      for (let i = 0; i < c.n; i++) {
        const x = P[3 * i] * st + ox, y = P[3 * i + 1] * st + oy, z = P[3 * i + 2] * st + oz;
        const w = mat[3] * x + mat[7] * y + mat[11] * z + mat[15];
        if (w >= far || w <= 0.05) continue;
        const px = ((mat[0] * x + mat[4] * y + mat[8] * z + mat[12]) / w * 0.5 + 0.5) * W;
        for (let k = 0; k < n; k++) {
          if (w >= sw[k] || Math.abs(px - sx[k]) > reach) continue;
          const py = (0.5 - (mat[1] * x + mat[5] * y + mat[9] * z + mat[13]) / w * 0.5) * H;
          if (Math.abs(py - sy[k]) > reach) continue;
          if (x * cutN[0] + y * cutN[1] > cutD || (hw[0] && x < S.walls[0]) || (hw[1] && y > S.walls[1]) || (hw[2] && y < S.walls[2])) continue;
          hits[k]++;
        }
      }
    }
    list.forEach((s, k) => {
      const covered = hits[k] >= 3;
      if (covered !== s.covered) { s.covered = covered; s.node.classList.toggle('covered', covered); s.stem.classList.toggle('covered', covered); }
    });
  }

  /* ---------- the points ---------- */
  async function fetchPart(part, done) {
    const res = await fetch(part.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let bytes;
    if (res.body && res.body.getReader) {
      const reader = res.body.getReader(), chunks = [];
      let got = 0;
      for (;;) {
        const { done: end, value } = await reader.read();
        if (end) break;
        chunks.push(value);
        got += value.length;
        progress(done + Math.min(got, part.bytes));
      }
      bytes = new Uint8Array(got);
      let at = 0;
      for (const c of chunks) { bytes.set(c, at); at += c.length; }
    } else bytes = new Uint8Array(await res.arrayBuffer());
    // The files are packed with gzip. A server that has already unpacked them on the way is fine too.
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    }
    return bytes;
  }
  // Undoes the packing described in the README: differences between neighbouring points, for the coordinates
  // and for the colours.
  function decode(bytes) {
    const n = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, true);
    if (bytes.length < 4 + 9 * n) throw new Error('short file');
    const b = bytes.subarray(4), pos = new Uint16Array(3 * n), col = new Uint8Array(3 * n);
    for (let k = 0; k < 3; k++) {
      const lo = b.subarray(2 * k * n, (2 * k + 1) * n), hi = b.subarray((2 * k + 1) * n, (2 * k + 2) * n);
      let v = 0;
      for (let i = 0; i < n; i++) { const z = lo[i] | (hi[i] << 8); v += (z >>> 1) ^ -(z & 1); pos[3 * i + k] = v; }
    }
    const G = b.subarray(6 * n, 7 * n), R = b.subarray(7 * n, 8 * n), B = b.subarray(8 * n, 9 * n);
    let g = 0, r = 0, bl = 0;
    for (let i = 0; i < n; i++) {
      g = (g + G[i]) & 255; r = (r + R[i]) & 255; bl = (bl + B[i]) & 255;
      col[3 * i] = (r + g) & 255; col[3 * i + 1] = g; col[3 * i + 2] = (bl + g) & 255;
    }
    return { pos, col, n };
  }
  const allBytes = parts.reduce((n, p) => n + p.bytes, 0);
  function progress(got) { meter.style.setProperty('--done', `${Math.round(100 * clamp(got / allBytes, 0, 1))}%`); }

  async function load() {
    let done = 0;
    try {
      for (const part of parts) {
        const c = decode(await fetchPart(part, done));
        done += part.bytes;
        upload(c);
        clouds.push(c);
        loaded += c.n;
        if (clouds.length === 1) { root.classList.add('live'); begin(); }
        need();
      }
      note.hidden = true;
    } catch (err) {
      // With no part at all, the picture of the scan stays. With some, the model simply stays thinner.
      if (loaded) note.hidden = true;
      else { noteText.textContent = 'The 3D model could not be loaded. The picture shows the scan.'; note.classList.add('failed'); }
    }
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
  // The point of the model under a place in the picture: of the points drawn there, the one nearest to the camera.
  function pick(px, py) {
    const reach = Math.max(5, SPACING * 1.5 * scale / ratio / dist);
    let best = null, bw = Infinity;
    const hide = [outside(S.walls[0] - eye[0]) > 0.5, outside(eye[1] - S.walls[1]) > 0.5, outside(S.walls[2] - eye[1]) > 0.5];
    for (const c of clouds) {
      const P = c.pos;
      for (let i = 0; i < c.n; i++) {
        const x = P[3 * i] * S.step + S.origin[0], y = P[3 * i + 1] * S.step + S.origin[1], z = P[3 * i + 2] * S.step + S.origin[2];
        const w = mat[3] * x + mat[7] * y + mat[11] * z + mat[15];
        if (w <= 0.05 || w >= bw || x * cutN[0] + y * cutN[1] > cutD) continue;
        const sx = ((mat[0] * x + mat[4] * y + mat[8] * z + mat[12]) / w * 0.5 + 0.5) * W;
        if (Math.abs(sx - px) > reach) continue;
        const sy = (0.5 - (mat[1] * x + mat[5] * y + mat[9] * z + mat[13]) / w * 0.5) * H;
        if (Math.abs(sy - py) > reach) continue;
        if ((hide[0] && x < S.walls[0]) || (hide[1] && y > S.walls[1]) || (hide[2] && y < S.walls[2])) continue;
        best = [x, y, z]; bw = w;
      }
    }
    return best;
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
    ratio = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2) * sharp;
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
  canvas.addEventListener('webglcontextrestored', () => { if (setup()) need(); });

  // Called when the first part of the points is there: the tour starts, unless reduced motion is asked for
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
  root.scan = { cam, pick, where, draw: need, state: () => ({ ...cam, az: cam.az / DEG, el: cam.el / DEG, loaded, current, auto }) };
})();
