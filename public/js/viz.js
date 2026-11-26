/* Delft High PT Lab: interactive illustrations on the equipment page.
   Plain canvas, no dependencies. Each illustration is registered in VIZ and mounted on
   <figure class="viz" data-viz="name">. Numbers are approximations for outreach, see the notes on the page.

   Every illustration plays a tour by itself: a list of scenes, each with one sentence under the picture. The
   controls glide to the values of a scene and rest there, so that the sentence can be read. While they glide,
   the numbers in the picture and next to the sliders change in coarse steps, a few times a second at most.
   Touching a control ends the tour and hands the controls over. Play starts it again from where things stand. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  const INK = '#e8ecf3', MUTED = '#9aa6ba', LINE = '#2f3b55', ACCENT = '#ff8a3d', BLUE = '#5fc8ff', VIOLET = '#c9b8ff';
  const TAU = Math.PI * 2;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
  function interp(tab, x, col = 1) {
    if (x <= tab[0][0]) return tab[0][col];
    for (let i = 1; i < tab.length; i++) {
      if (x <= tab[i][0]) {
        const a = tab[i - 1], b = tab[i];
        return a[col] + (b[col] - a[col]) * (x - a[0]) / (b[0] - a[0]);
      }
    }
    return tab[tab.length - 1][col];
  }
  function niceStep(x) {
    const p = Math.pow(10, Math.floor(Math.log10(x)));
    const f = x / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }
  const num = (v, sig = 2) => Number(v.toPrecision(sig)).toLocaleString('en-US', { maximumFractionDigits: 6 });
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');
  const minus = (v) => String(v).replace('-', '−'); // typographic minus sign
  // A length of time in everyday words, from seconds to years.
  function fmtTime(s) {
    const units = [[1, 'second', 120], [60, 'minute', 120], [3600, 'hour', 48], [86400, 'day', 60], [2629800, 'month', 24], [31557600, 'year', Infinity]];
    for (const [size, name, upTo] of units) {
      const v = s / size;
      if (v < upTo) { const r = Number(v.toPrecision(2)); return `${r.toLocaleString('en-US')} ${name}${r === 1 ? '' : 's'}`; }
    }
    return '';
  }

  function label(ctx, str, x, y, o = {}) {
    ctx.font = `${o.weight || 400} ${o.size || 12}px ${FONT}`;
    ctx.fillStyle = o.color || INK;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    ctx.fillText(str, x, y);
  }
  function measure(ctx, str, size, weight = 400) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    return ctx.measureText(str).width;
  }
  function wrap(ctx, str, x, y, maxW, lh, o = {}) {
    ctx.font = `${o.weight || 400} ${o.size || 12}px ${FONT}`;
    const words = str.split(' ');
    let line = '', yy = y;
    for (const wd of words) {
      const test = line ? `${line} ${wd}` : wd;
      if (ctx.measureText(test).width > maxW && line) { label(ctx, line, x, yy, o); line = wd; yy += lh; } else line = test;
    }
    if (line) label(ctx, line, x, yy, o);
    return yy;
  }
  function box(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }
  function starfield(ctx, w, h, seed, n, maxY = 1) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h * maxY, s = 0.4 + r() * 0.9, a = 0.25 + r() * 0.5;
      ctx.fillStyle = `rgba(226,232,245,${a.toFixed(2)})`;
      ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    }
  }
  const mix = (c1, c2, u) => {
    const a = c1.match(/\w\w/g).map((v) => parseInt(v, 16)), b = c2.match(/\w\w/g).map((v) => parseInt(v, 16));
    return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], u))).join(',')})`;
  };
  // A soft patch of colour without an edge. `rgb` is written as "r,g,b".
  function blob(ctx, x, y, rx, ry, rot, rgb, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${rgb},${alpha})`); g.addColorStop(0.55, `rgba(${rgb},${(alpha * 0.6).toFixed(3)})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------- tours ---------- */
  // A tour plays `count` scenes in turn. `enter(k)` starts scene k: it notes where the controls are and where they
  // should go, sets the sentence, and returns { glide, hold } in seconds. `move(u)` is called while the controls
  // glide, with u running from 0 to 1.
  function tour(count, enter, move) {
    let k = -1, clock = 0, dur = null;
    const self = {
      moving: false,
      go(to) {
        k = ((to % count) + count) % count; clock = 0; dur = enter(k);
        self.moving = dur.glide > 0;
        if (!self.moving) move(1);
      },
      tick(dt) {
        if (!dur) { self.go(k + 1); return; }
        clock += dt;
        if (self.moving) { const u = Math.min(1, clock / dur.glide); move(ease(u)); if (u >= 1) self.moving = false; }
        if (clock >= dur.glide + dur.hold) self.go(k + 1);
      },
      stop() { dur = null; self.moving = false; },         // the next tick starts the scene after this one
      from(to) { k = to - 1; dur = null; self.moving = false; }, // the next tick starts scene `to`
    };
    return self;
  }
  // A value as it is written while a control glides: rounded to a coarse step, and changed at most every `gap` seconds.
  function calmer(gap = 0.3) {
    let shown = null, since = gap;
    return (v, step, moving, dt) => {
      if (!moving) { shown = null; since = gap; return v; }
      since += dt;
      const q = Math.round(v / step) * step;
      if (shown === null || (q !== shown && since >= gap)) { shown = q; since = 0; }
      return shown;
    };
  }

  /* ---------- controls ---------- */
  function segmented(bar, items, initial, onPick, name) {
    const wrapEl = document.createElement('div');
    wrapEl.className = 'seg';
    wrapEl.setAttribute('role', 'group');
    wrapEl.setAttribute('aria-label', name);
    const btns = items.map(([k, text]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.setAttribute('aria-pressed', String(k === initial));
      b.addEventListener('click', () => { set(k); onPick(k); });
      wrapEl.appendChild(b);
      return [k, b];
    });
    function set(k) { btns.forEach(([kk, b]) => b.setAttribute('aria-pressed', String(kk === k))); }
    bar.appendChild(wrapEl);
    return { set };
  }
  // `chars` reserves room for the longest number, so that the slider keeps its length when the number changes.
  function slider(bar, o, onInput) {
    const l = document.createElement('label');
    const s = document.createElement('span');
    s.textContent = o.label;
    const i = document.createElement('input');
    i.type = 'range'; i.min = o.min; i.max = o.max; i.step = o.step; i.value = o.value;
    const out = document.createElement('output');
    out.setAttribute('aria-hidden', 'true'); // the slider itself carries the same words, as its value
    if (o.chars) out.style.minWidth = `${o.chars}ch`;
    let step = o.step, fmt = o.fmt;
    const show = (v) => {
      const text = fmt(v);
      if (out.textContent !== text) { out.textContent = text; i.setAttribute('aria-valuetext', text); }
    };
    show(o.value);
    i.addEventListener('input', () => { const v = parseFloat(i.value); show(v); onInput(v); });
    l.append(s, i, out);
    bar.appendChild(l);
    return {
      // During a tour the thumb glides freely, and the number beside it shows `shown`, a calmer value.
      glide(v, shown) { if (i.step !== 'any') i.step = 'any'; i.value = v; show(shown); },
      // Back under hand control: the thumb rests on the nearest step. Returns the value it rests on.
      settle(v) { i.step = step; i.value = v; const at = parseFloat(i.value); show(at); return at; },
      limits(min, max, st, f) { step = st; if (f) fmt = f; i.min = min; i.max = max; if (i.step !== 'any') i.step = st; },
    };
  }
  function toggle(bar, text, onToggle) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tog'; b.textContent = text;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); onToggle(on); });
    bar.appendChild(b);
  }

  const VIZ = {};

  /* ---------- planet disk used by the press illustration ---------- */
  function drawBody(ctx, cx, cy, R, b) {
    if (b.glow) {
      const g = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.18);
      g.addColorStop(0, b.glow); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, 0, TAU); ctx.fill();
    }
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const g = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.05, cx, cy, R * 1.05);
    g.addColorStop(0, b.c[0]); g.addColorStop(0.55, b.c[1]); g.addColorStop(1, b.c[2]);
    ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    const r = rng(b.seed);
    const at = (reach) => { const a = r() * TAU, rad = Math.sqrt(r()) * R * reach; return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]; };
    if (b.feat === 'bands') {
      for (let i = 0; i < 9; i++) {
        const yy = cy - R + ((i + 0.5) / 9) * 2 * R + (r() - 0.5) * R * 0.08;
        ctx.strokeStyle = `rgba(255,255,255,${(0.05 + r() * 0.09).toFixed(3)})`;
        ctx.lineWidth = R * (0.04 + r() * 0.07);
        ctx.beginPath(); ctx.moveTo(cx - R * 1.2, yy);
        ctx.bezierCurveTo(cx - R * 0.4, yy - R * 0.14, cx + R * 0.4, yy + R * 0.14, cx + R * 1.2, yy); ctx.stroke();
      }
    } else if (b.feat === 'craters') {
      for (let i = 0; i < 16; i++) {
        const a = r() * TAU, rad = Math.sqrt(r()) * R * 0.92, cr = R * (0.03 + r() * 0.09);
        const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
        ctx.fillStyle = 'rgba(0,0,0,.17)'; ctx.beginPath(); ctx.arc(x, y, cr, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, cr, 3.6, 5.6); ctx.stroke();
      }
    } else if (b.feat === 'earth') { // soft shading only: land, then cloud
      for (let i = 0; i < 6; i++) { const [x, y] = at(0.78); blob(ctx, x, y, R * (0.24 + r() * 0.2), R * (0.15 + r() * 0.14), r() * 3, '104,152,92', 0.8); }
      for (let i = 0; i < 6; i++) { const [x, y] = at(0.85); blob(ctx, x, y, R * (0.2 + r() * 0.2), R * (0.11 + r() * 0.1), r() * 3, '255,255,255', 0.34); }
    } else if (b.feat === 'mars') { // soft shading only: darker regions and a polar cap
      for (let i = 0; i < 5; i++) { const [x, y] = at(0.7); blob(ctx, x, y, R * (0.26 + r() * 0.2), R * (0.14 + r() * 0.12), r() * 3, '92,36,20', 0.45); }
      blob(ctx, cx, cy - R * 0.98, R * 0.5, R * 0.2, 0, '255,255,255', 0.9);
    }
    const s = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    s.addColorStop(0.45, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = s; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    ctx.restore();
  }

  /* ---------- 1. Piston cylinder press: pressure to depth ---------- */
  VIZ.press = (bar, api) => {
    const PMAX = 3.5;
    const CRUST = '#8d8474', MANTLE = '#6f8f4a', CORE = '#e0a13a';
    // p: pressure in GPa as a function of depth in km (table or function). layers: [name, bottom depth in km, colour].
    // notes: [down to this depth in km, sentence], shown under the picture for the depth that is reached.
    const B = {
      earth: { name: 'Earth', the: true, R: 6371, g: 9.81, c: ['#9cc9ff', '#2f6fb5', '#0d2a55'], feat: 'earth', seed: 5, glow: 'rgba(120,180,255,.35)',
        p: [[0, 0], [35, 1.0], [80, 2.45], [115, 3.6], [150, 4.8], [220, 7.1]],
        layers: [['Crust', 35, CRUST], ['Upper mantle', 410, MANTLE], ['Transition zone', 660, '#4f7a52'], ['Lower mantle', 2891, '#b5653a'], ['Outer core', 5150, CORE], ['Inner core', 6371, '#f6dc8c']],
        notes: [[10, 'Many magma chambers under volcanoes lie at depths like this.'], [35, 'Rising magmas often stall and partly crystallise at these depths.'], [Infinity, 'Most basaltic magmas on Earth form in this depth range.']] },
      venus: { name: 'Venus', R: 6052, g: 8.87, c: ['#fbe9bd', '#d9a85c', '#6b3d16'], feat: 'bands', seed: 9, glow: 'rgba(255,200,120,.4)',
        p: [[0, 0], [30, 0.77], [150, 4.29]],
        layers: [['Crust', 30, CRUST], ['Mantle', 2850, MANTLE], ['Core', 6052, CORE]],
        notes: [[30, 'The crust of Venus is thought to be basaltic, like the lava plains that cover most of the planet.'], [Infinity, 'Gravity on Venus is close to that of the Earth, so pressure builds up with depth almost as quickly.']] },
      mars: { name: 'Mars', R: 3390, g: 3.72, c: ['#f0b08a', '#c0562c', '#4a1a0c'], feat: 'mars', seed: 3, glow: 'rgba(255,150,110,.2)',
        p: [[0, 0], [50, 0.54], [400, 4.97]],
        layers: [['Crust', 50, CRUST], ['Mantle', 1600, MANTLE], ['Core', 3390, CORE]],
        notes: [[50, 'Mars has little more than a third of the gravity of the Earth, so the same pressure lies much deeper.'], [Infinity, 'The basalts of Mars are thought to come from melting in this part of the mantle.']] },
      moon: { name: 'Moon', the: true, R: 1737, g: 1.62, c: ['#e6e6e6', '#9a9a9e', '#3a3a40'], feat: 'craters', seed: 12,
        p: (d) => 4.71 * (1 - Math.pow((1737 - d) / 1737, 2)),
        layers: [['Crust', 40, CRUST], ['Mantle', 1400, MANTLE], ['Core', 1737, CORE]],
        notes: [[40, 'The pale crust of the Moon is thought to have floated to the top of an ocean of magma soon after the Moon formed.'], [550, 'The dark mare basalts of the Moon come from melting in this part of the mantle.'], [Infinity, 'At full pressure the press reaches about halfway to the centre of the Moon.']] },
      mercury: { name: 'Mercury', R: 2440, g: 3.70, c: ['#d8cfc4', '#8f857b', '#35302c'], feat: 'craters', seed: 21,
        p: [[0, 0], [35, 0.36], [420, 5.06]],
        layers: [['Crust', 35, CRUST], ['Mantle', 420, MANTLE], ['Core', 2440, CORE]],
        notes: [[35, 'The lavas at the surface of Mercury are rich in magnesium and sulfur and poor in iron.'], [Infinity, 'The rocky mantle of Mercury is only about 400 km thick, above a very large metallic core.']] },
      titan: { name: 'Titan', R: 2575, g: 1.35, c: ['#ffd98a', '#d99632', '#5e370c'], feat: 'bands', seed: 4, glow: 'rgba(255,170,70,.4)',
        p: (d) => (d <= 500 ? interp([[0, 0], [100, 0.126], [350, 0.51], [500, 0.77]], d) : 0.77 + 9.089e-7 * (2075 * 2075 - Math.pow(2575 - d, 2))),
        layers: [['Ice shell', 100, '#cfe8f5'], ['Ocean', 350, '#3f8fd0'], ['High-pressure ice', 500, '#8fb8d6'], ['Rocky interior', 2575, '#8a6a4a']],
        notes: [[100, 'The outer shell of Titan is water ice, as hard as rock in the cold at its surface.'], [350, 'Models of Titan place an ocean of liquid water under the ice shell.'], [500, 'Under this pressure, water freezes into dense forms of ice that sink instead of float.'], [Infinity, 'Below the ice shell and the internal ocean, the press reaches conditions deep inside the rocky interior of Titan.']] },
      vesta: { name: 'Vesta', R: 263, g: 0.25, c: ['#d9d4cc', '#8d8880', '#33302c'], feat: 'craters', seed: 31,
        p: (d) => 0.115 * (1 - Math.pow((263 - d) / 263, 2)),
        layers: [['Crust', 20, CRUST], ['Mantle', 150, MANTLE], ['Core', 263, CORE]],
        notes: [[20, 'The crust of Vesta is basaltic. Pieces of it reach the Earth as meteorites.'], [150, 'Vesta melted and separated into crust, mantle and core within a few million years of the birth of the Solar System.'], [Infinity, 'On Earth the same pressure is found only about 4 km below the surface.']] },
      psyche: { name: 'Psyche', R: 111, g: 0.14, c: ['#e2e6ea', '#8b939c', '#2c3138'], feat: 'craters', seed: 44,
        p: (d) => 0.026 * (1 - Math.pow((111 - d) / 111, 2)),
        layers: [['Metal-rich interior', 111, '#9aa3ad']],
        notes: [[Infinity, 'NASA’s Psyche spacecraft is due to arrive at this metal-rich asteroid in 2029.']] },
    };
    const order = ['earth', 'venus', 'mars', 'moon', 'mercury', 'titan', 'vesta', 'psyche'];
    let key = 'earth', P = PMAX;
    const calm = calmer();

    const pAt = (b, d) => (typeof b.p === 'function' ? b.p(d) : interp(b.p, d));
    function dAt(b, p) {
      if (p >= pAt(b, b.R)) return b.R;
      let lo = 0, hi = b.R;
      for (let i = 0; i < 44; i++) { const m = (lo + hi) / 2; if (pAt(b, m) < p) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    const layerAt = (b, d) => (b.layers.find((l) => d <= l[1]) || b.layers[b.layers.length - 1])[0];
    const noteAt = (b, d) => (b.notes.find((n) => d <= n[0]) || b.notes[b.notes.length - 1])[1];
    const full = (b) => (b.the ? `the ${b.name}` : b.name); // "the Earth" and "the Moon" in a sentence
    const fmtKm = (d) => (d < 20 ? Math.round(d) : d < 500 ? Math.round(d / 5) * 5 : Math.round(d / 10) * 10).toLocaleString('en-US');
    // The slider ends at the maximum of the press, or at the pressure in the centre of a body that is smaller than that.
    function lims(b) {
      const hi = Math.min(PMAX, pAt(b, b.R));
      return hi < 1 ? { min: 0.001, max: +hi.toFixed(3), step: 0.001, dec: 3, coarse: niceStep(hi / 12) } : { min: 0.02, max: hi, step: 0.02, dec: 2, coarse: 0.25 };
    }
    function sentence(b, p) {
      const d = dAt(b, p), at = `${p.toFixed(lims(b).dec)} GPa`;
      if (d >= b.R) return `${at} is the pressure at the very centre of ${full(b)}. The press reaches about ${num(PMAX / pAt(b, b.R))} times as much, so the whole body is within reach. ${noteAt(b, d)}`;
      return `${at} is the pressure about ${fmtKm(d)} km below the surface of ${full(b)}, in the ${layerAt(b, d).toLowerCase()}. ${noteAt(b, d)}`;
    }
    const caption = () => api.setCap(sentence(B[key], P));
    function pick(k) {
      const L = lims(B[k]);
      key = k; bset.set(k);
      sset.limits(L.min, L.max, L.step, (v) => `${v.toFixed(L.dec)} GPa`);
    }

    const bset = segmented(bar, order.map((k) => [k, B[k].name]), key, (k) => {
      const full = P >= lims(B[key]).max - 1e-9, L = lims(B[k]); // full pressure stays full pressure on the next body
      pick(k);
      P = sset.settle(full ? L.max : clamp(P, L.min, L.max));
      caption(); api.kick();
    }, 'Planetary body');
    const sset = slider(bar, { label: 'Pressure', min: 0.02, max: PMAX, step: 0.02, value: P, chars: 9, fmt: (v) => `${v.toFixed(2)} GPa` }, (v) => { P = v; caption(); api.kick(); });
    caption();

    // The tour: each body in turn, from the surface down to as far as the press reaches.
    let from = P, to = P;
    const tr = tour(order.length, (k) => {
      const b = B[order[k]];
      if (order[k] !== key) { pick(order[k]); P = lims(b).min; }
      from = P; to = lims(b).max;
      api.setCap(sentence(b, to));
      return { glide: to > from ? 1.2 + 3.4 * (to - from) / to : 0, hold: 4.4 };
    }, (u) => { P = lerp(from, to, u); });

    return {
      play(first) { if (first) P = lims(B[key]).min; tr.from(order.indexOf(key)); },
      pause() { tr.stop(); P = sset.settle(P); caption(); },
      samples() {
        const list = [];
        for (const k of order) { const b = B[k], L = lims(b); for (let i = 0; i <= 10; i++) list.push(sentence(b, lerp(L.min, L.max, i / 10))); }
        return list;
      },
      draw(ctx, w, h, t, dt) {
        if (api.live) tr.tick(dt);
        const b = B[key], L = lims(b);
        const Ps = calm(P, L.coarse, api.auto && tr.moving, dt); // the pressure as it is written
        if (api.auto) sset.glide(P, Ps);
        const d = dAt(b, P), ds = dAt(b, Ps), compact = w < 560;
        starfield(ctx, w, h, 3, compact ? 40 : 90);

        // title
        label(ctx, b.name, 16, compact ? 24 : 30, { size: compact ? 16 : 20, weight: 700 });
        label(ctx, `Radius ${b.R.toLocaleString('en-US')} km · surface gravity ${b.g} m/s²`, 16, compact ? 40 : 50, { size: compact ? 10.5 : 12.5, color: MUTED });
        const y0 = compact ? 72 : 90, y1 = h - (compact ? 24 : 30), fs = compact ? 9.5 : 11.5;

        // the body, with a wedge cut out that shows its layers
        const R = Math.min(w * 0.145, h * 0.3), cx = compact ? 10 + R : w * 0.165, cy = (y0 + y1) / 2;
        drawBody(ctx, cx, cy, R, b);
        const a0 = -0.6, a1 = 0.6, rIn = R * (1 - d / b.R);
        ctx.save();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.clip();
        let prev = 0;
        for (const [, bot, col] of b.layers) {
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, R * (1 - prev / b.R), 0, TAU); ctx.fill(); prev = bot;
        }
        ctx.fillStyle = 'rgba(255,138,61,.42)';
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.moveTo(cx + rIn, cy); ctx.arc(cx, cy, rIn, 0, TAU); ctx.fill('evenodd');
        ctx.restore();
        ctx.strokeStyle = 'rgba(6,8,13,.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + R * Math.cos(a0), cy + R * Math.sin(a0)); ctx.lineTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1)); ctx.stroke();
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.shadowColor = ACCENT; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(rIn, 1.5), a0, a1); ctx.stroke(); ctx.shadowBlur = 0;

        // narrow column: the whole body from the surface to the centre. The part beyond the press is dimmed.
        const sx = compact ? w * 0.37 : w * 0.43, sw = compact ? 12 : 22, reach = dAt(b, L.max);
        const SY = (dd) => y0 + (dd / b.R) * (y1 - y0);
        ctx.save();
        box(ctx, sx, y0, sw, y1 - y0, 5); ctx.clip();
        prev = 0;
        for (const [, bot, col] of b.layers) { ctx.fillStyle = col; ctx.fillRect(sx, SY(prev), sw, SY(bot) - SY(prev) + 1); prev = bot; }
        if (reach < b.R) { ctx.fillStyle = 'rgba(6,8,13,.55)'; ctx.fillRect(sx, SY(reach), sw, y1 - SY(reach)); }
        ctx.restore();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1; box(ctx, sx, y0, sw, y1 - y0, 5); ctx.stroke();
        label(ctx, 'Whole body', sx + sw / 2, y0 - 12, { size: fs, color: MUTED, align: 'center' });
        label(ctx, 'centre', sx + sw / 2, y1 + 14, { size: fs, color: MUTED, align: 'center' });
        if (!compact) { // layer names beside the column, where there is room next to the planet
          prev = 0;
          for (const [name, bot] of b.layers) {
            const ya = SY(prev), yb = SY(bot), yy = (ya + yb) / 2;
            prev = bot;
            const edge = Math.abs(yy - cy) < R ? cx + Math.sqrt(R * R - (yy - cy) * (yy - cy)) : 0;
            if (yb - ya >= 15 && measure(ctx, name, 11) <= sx - 22 - edge) label(ctx, name, sx - 8, yy, { size: 11, color: MUTED, align: 'right', base: 'middle' });
          }
        }

        // wide column: the part of the body that the press can reach, enlarged
        const colX = compact ? w * 0.53 : w * 0.575, colW = compact ? w * 0.15 : w * 0.14;
        const Dmax = Math.min(b.R, reach * 1.18);
        const Y = (dd) => y0 + (dd / Dmax) * (y1 - y0);
        ctx.fillStyle = 'rgba(154,166,186,.09)';
        ctx.beginPath(); ctx.moveTo(sx + sw, y0); ctx.lineTo(colX, y0); ctx.lineTo(colX, y1); ctx.lineTo(sx + sw, SY(Dmax)); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(154,166,186,.45)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(sx + sw, SY(Dmax)); ctx.lineTo(colX, y1); ctx.stroke(); ctx.setLineDash([]);

        ctx.save();
        box(ctx, colX, y0, colW, y1 - y0, 8); ctx.clip();
        prev = 0;
        const fl = compact ? 10 : 12;
        for (const [name, bot, col] of b.layers) {
          if (prev >= Dmax) break;
          const ya = Y(prev), yb = Y(Math.min(bot, Dmax));
          ctx.fillStyle = col; ctx.fillRect(colX, ya, colW, yb - ya + 1);
          if (yb - ya > fl + 8 && measure(ctx, name, fl, 600) < colW - 8) label(ctx, name, colX + colW / 2, (ya + yb) / 2, { size: fl, weight: 600, color: '#10141d', align: 'center', base: 'middle' });
          prev = bot;
        }
        const heat = ctx.createLinearGradient(0, y0, 0, y1);
        heat.addColorStop(0, 'rgba(0,0,0,.2)'); heat.addColorStop(1, 'rgba(255,110,30,.22)');
        ctx.fillStyle = heat; ctx.fillRect(colX, y0, colW, y1 - y0);
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(colX, y0, colW, Y(d) - y0);
        ctx.restore();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1; box(ctx, colX, y0, colW, y1 - y0, 8); ctx.stroke();
        label(ctx, compact ? 'Within reach' : 'Within reach of the press', colX, y0 - 12, { size: fs, color: MUTED });

        const step = niceStep(Dmax / 5);
        for (let dd = 0; dd <= Dmax + 1e-6; dd += step) {
          const yy = Y(dd);
          ctx.strokeStyle = MUTED; ctx.beginPath(); ctx.moveTo(colX - 5, yy); ctx.lineTo(colX, yy); ctx.stroke();
          label(ctx, dd === 0 ? '0 km' : dd.toLocaleString('en-US'), colX - 8, yy, { size: compact ? 9.5 : 11, color: MUTED, align: 'right', base: 'middle' });
        }
        if (Dmax >= b.R) label(ctx, 'centre', colX + colW / 2, y1 + 14, { size: fs, color: MUTED, align: 'center' });

        // marker on both columns
        const ym = Y(d), ys = SY(d);
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.shadowColor = ACCENT; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(sx - 4, ys); ctx.lineTo(sx + sw + 4, ys);
        ctx.moveTo(colX - 6, ym); ctx.lineTo(colX + colW + 6, ym); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.arc(colX + colW / 2, ym, 5 + (api.still ? 0 : 1.5 * Math.sin(t * 3)), 0, TAU); ctx.fill();

        // what the marker stands for
        const lx = colX + colW + (compact ? 10 : 14), gap = compact ? 15 : 21;
        const centre = ds >= b.R, share = (ds / b.R) * 100, pct = share < 9.95 ? share.toFixed(1) : String(Math.round(share));
        const ly = clamp(ym + (compact ? 5 : 7), y0 + (compact ? 12 : 16), y1 - gap * (compact ? 4 : 3) - 2);
        label(ctx, `${Ps.toFixed(L.dec)} GPa`, lx, ly, { size: compact ? 14 : 20, weight: 700, color: ACCENT });
        label(ctx, centre ? 'centre of the body' : `≈ ${fmtKm(ds)} km deep`, lx, ly + gap, { size: compact ? 11.5 : 15 });
        label(ctx, layerAt(b, ds), lx, ly + gap * 2, { size: compact ? 10 : 13, color: MUTED });
        if (centre) label(ctx, compact ? 'all within reach' : 'the whole body is within reach', lx, ly + gap * 3, { size: compact ? 10 : 13, color: MUTED });
        else if (compact) { label(ctx, `${pct}% of the way`, lx, ly + gap * 3, { size: 10, color: MUTED }); label(ctx, 'to the centre', lx, ly + gap * 4 - 2, { size: 10, color: MUTED }); }
        else label(ctx, `${pct}% of the way to the centre`, lx, ly + gap * 3, { size: 13, color: MUTED });
      },
    };
  };

  /* ---------- 2. Rheometer: viscosity and lava flow ---------- */
  VIZ.rheometer = (bar, api) => {
    const G = {
      venus: { name: 'Venus', g: 8.87, sky: ['#2c1e0e', '#b07f35'], ground: ['#6a4526', '#24150a'] },
      earth: { name: 'Earth', g: 9.81, sky: ['#0a1730', '#44688f'], ground: ['#3c3b3a', '#141414'] },
      mars: { name: 'Mars', g: 3.72, sky: ['#2e1c14', '#b78a66'], ground: ['#7d3f23', '#32160b'] },
      moon: { name: 'Moon', on: 'the Moon', g: 1.62, sky: ['#02030a', '#070a12'], ground: ['#77777b', '#26262a'], stars: true },
      io: { name: 'Io', g: 1.80, sky: ['#02030a', '#0b0a12'], ground: ['#b89c3c', '#3f3210'], stars: true },
      psyche: { name: 'Psyche', g: 0.14, sky: ['#02030a', '#070a12'], ground: ['#858a92', '#272a31'], stars: true },
    };
    const order = ['venus', 'earth', 'mars', 'moon', 'io', 'psyche'];
    const cats = [
      [-3, -2, 'Molten metal and sulfide', 'about as thin as water. Relevant to planetary cores and to iron volcanism on metal-rich asteroids.'],
      [-2, 0, 'Salt, sulfate and carbonatite melts', 'as runny as water or light oil. Lavas this fluid are among the candidates for the long channels on Venus.'],
      [0, 1, 'Very hot, magnesium-rich lava', 'runny like syrup.'],
      [1, 3, 'Basaltic lava', 'the most common lava on the rocky planets, somewhere between honey and peanut butter.'],
      [3, 5, 'Andesitic lava', 'stiff and slow, like thick paste.'],
      [5, 10.01, 'Silica-rich lava', 'so stiff that it piles up into thick domes rather than flowing far.'],
    ];
    const everyday = [[-3, 'water'], [-1.1, 'olive oil'], [1, 'honey'], [2.4, 'peanut butter'], [8.3, 'pitch']];
    const presets = [['venus', 1.5], ['venus', -1], ['moon', 2], ['mars', 3.5], ['io', 0.5], ['psyche', -2.5], ['earth', 6.5]];
    const DIST = 100; // metres of slope that the picture shows
    let key = 'venus', L = 1.5, front = api.still ? 0.75 : 0, hold = 0, gauge = (L + 3) / 13;
    const calm = calmer();

    const fmtEta = (l) => {
      const eta = Math.pow(10, l);
      if (l >= 6) { const e = Math.floor(l), m = eta / Math.pow(10, e); return `${m < 1.5 ? '' : `${Math.round(m)} × `}10${sup(e)} Pa·s`; }
      return `${num(eta, 1)} Pa·s`;
    };
    // A sheet of melt 1 m thick on a slope of 1 degree. Stiff melts flow in layers (laminar). Thin melts cannot
    // go faster than turbulent friction allows, which sets the upper limit.
    function calc(k = key, l = L) {
      const eta = Math.pow(10, l), rho = l < -2 ? 7000 : l < 0 ? 2300 : 2700, drive = G[k].g * 0.01745;
      const lam = (rho * drive) / (3 * eta), turb = Math.sqrt(drive / 0.007);
      return { v: Math.min(lam, turb), turbulent: lam > turb };
    }
    // Seconds on screen for the flow to cross the picture: fast flows race, slow ones crawl.
    const screen = (v) => clamp(1.5 * Math.pow(5 / v, 0.3), 1.5, 80);
    function sentence(k, l) {
      const c = calc(k, l), cat = cats.find((x) => l >= x[0] && l < x[1]) || cats[cats.length - 1], time = fmtTime(DIST / c.v);
      const flow = c.turbulent
        ? `On ${G[k].on || G[k].name}, a sheet of it 1 m thick would rush down a 1° slope in turbulent flow and cover ${DIST} m in about ${time}.`
        : `On ${G[k].on || G[k].name}, a sheet of it 1 m thick on a 1° slope would need about ${time} to cover ${DIST} m.`;
      return `${cat[2]}: ${cat[3]} ${flow}`;
    }
    const caption = () => api.setCap(sentence(key, L));
    function again() { if (!api.still) { front = 0; hold = 0; } }
    function restart() { again(); caption(); api.kick(); }

    const bset = segmented(bar, order.map((k) => [k, G[k].name]), key, (k) => { key = k; restart(); }, 'Planetary body');
    const sset = slider(bar, { label: 'Viscosity', min: -3, max: 10, step: 0.5, value: L, chars: 12, fmt: fmtEta }, (v) => { L = v; restart(); });
    caption();

    // The tour: a few telling pairs of world and melt.
    let from = L, to = L;
    const tr = tour(presets.length, (k) => {
      const [body, l] = presets[k];
      key = body; bset.set(key); from = L; to = l; again();
      api.setCap(sentence(body, l));
      return { glide: from === to ? 0 : 1.2, hold: clamp(screen(calc(body, l).v) + 2.5, 5.5, 9) };
    }, (u) => { L = lerp(from, to, u); });

    return {
      play(first) { if (first) tr.from(0); },
      pause() { tr.stop(); L = sset.settle(L); caption(); },
      samples() {
        const list = [];
        for (const k of order) for (const l of [-2.5, -1, 0.5, 2, 4, 7, 10]) list.push(sentence(k, l));
        return list;
      },
      draw(ctx, w, h, t, dt) {
        if (api.live) tr.tick(dt);
        const Ls = calm(L, 0.5, api.auto && tr.moving, dt); // the viscosity as it is written
        if (api.auto) sset.glide(L, Ls);
        const S = G[key], c = calc(), compact = w < 560;
        const n = clamp((Math.log10(c.v) + 9.7) / 10.4, 0, 1); // 0 for the slowest flow, 1 for the fastest
        if (!api.still && dt) {
          if (hold > 0) { hold -= dt; if (hold <= 0) front = 0; } else { front += dt / screen(c.v); if (front >= 1) { front = 1; hold = 1.6; } }
        }
        const stress = (L + 3) / 13;
        gauge = api.still ? stress : gauge + (stress - gauge) * Math.min(1, dt * 6);

        // sky and ground
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.8);
        sky.addColorStop(0, S.sky[0]); sky.addColorStop(1, S.sky[1]);
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        if (S.stars) starfield(ctx, w, h, 8, compact ? 50 : 110, 0.6);
        const gy0 = h * 0.4, gy1 = h * 0.68;
        const ground = (x) => lerp(gy0, gy1, x / w);
        // distant ridge
        ctx.fillStyle = mix(S.ground[0].slice(1), S.ground[1].slice(1), 0.55);
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(0, gy0 - h * 0.02);
        const rr = rng(17);
        for (let x = 0; x <= w; x += w / 14) ctx.lineTo(x, ground(x) - h * (0.03 + rr() * 0.07));
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        const gg = ctx.createLinearGradient(0, gy0, 0, h);
        gg.addColorStop(0, S.ground[0]); gg.addColorStop(1, S.ground[1]);
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.moveTo(0, ground(0)); ctx.lineTo(w, ground(w)); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

        // vent
        const vx = w * 0.09, vh = compact ? 20 : 34, vw = compact ? 26 : 44;
        ctx.fillStyle = S.ground[1];
        ctx.beginPath(); ctx.moveTo(vx - vw, ground(vx - vw)); ctx.lineTo(vx - 6, ground(vx) - vh); ctx.lineTo(vx + 6, ground(vx) - vh); ctx.lineTo(vx + vw, ground(vx + vw)); ctx.closePath(); ctx.fill();

        // lava
        const hotA = L < 2 ? '#fff3b8' : '#ffb24d', hotB = L < 2 ? '#ff8a2a' : mix('ff7a2a', '7a1e0a', clamp((L - 2) / 8, 0, 1));
        const x0 = vx, x1 = w * 0.95, xf = lerp(x0 + 8, x1, front);
        const TH = (compact ? 6 : 9) + (compact ? 16 : 30) * clamp((L + 3) / 13, 0, 1);
        // the surface the lava rests on: the flank of the vent cone, then the plain
        const base = (x) => (x < vx + vw ? lerp(ground(vx) - vh, ground(vx + vw), clamp((x - vx - 6) / (vw - 6), 0, 1)) : ground(x));
        const top = (x) => {
          const taper = Math.min(1, Math.sqrt(Math.max(0, xf - x) / (TH * 1.4)));
          const wob = api.still ? 1 : 1 + 0.07 * Math.sin(x * 0.06 - t * (0.6 + 5 * n));
          const grow = clamp((x - vx) / (vw * 1.6), 0.25, 1); // thin stream on the cone, full thickness on the plain
          return base(x) - Math.max(2, TH * taper * wob * grow);
        };
        const lg = ctx.createLinearGradient(x0, 0, xf, 0);
        lg.addColorStop(0, hotA); lg.addColorStop(1, hotB);
        ctx.fillStyle = lg; ctx.shadowColor = 'rgba(255,120,30,.85)'; ctx.shadowBlur = 24;
        ctx.beginPath(); ctx.moveTo(x0 - 5, ground(x0) - vh - 1);
        ctx.lineTo(x0 + 5, ground(x0) - vh - 1);
        for (let x = x0 + 8; x <= xf; x += 4) ctx.lineTo(x, top(x));
        ctx.lineTo(xf, base(xf));
        for (let x = xf; x >= x0 + 6; x -= 4) ctx.lineTo(x, base(x) + 1);
        ctx.lineTo(x0 - 5, ground(x0) - vh + 3); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        // cooling crust: more of it on stiff, slow lava
        const flecks = Math.round(4 + 34 * clamp((L + 1) / 9, 0, 1));
        const fr = rng(23);
        for (let i = 0; i < flecks; i++) {
          const ph = (fr() + (api.still ? 0 : t * (0.02 + 0.25 * n))) % 1, off = 0.35 + fr() * 0.5, sz = 2 + fr() * (compact ? 4 : 7);
          const x = lerp(x0 + 14, xf - 4, ph);
          if (x >= xf - 6) continue;
          const yt = top(x), yg = base(x);
          ctx.fillStyle = 'rgba(46,14,6,.6)';
          ctx.beginPath(); ctx.ellipse(x, lerp(yg, yt, off), sz, sz * 0.45, 0.12, 0, TAU); ctx.fill();
        }
        // fountain at the vent
        if (!api.still) {
          for (let i = 0; i < 6; i++) {
            const ph = (t * (0.8 + n) + i / 6) % 1;
            ctx.fillStyle = `rgba(255,220,130,${(1 - ph).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(vx + Math.sin(i * 2.4) * 7 * ph, ground(vx) - vh - ph * (10 + 22 * n), 2.2 * (1 - ph) + 0.6, 0, TAU); ctx.fill();
          }
        }
        // the distance that the clock is about
        const xa = x0 + 8, drop = compact ? 13 : 19, tilt = Math.atan2(gy1 - gy0, w);
        for (const [col, lw] of [['rgba(0,0,0,.5)', 3], ['rgba(255,255,255,.8)', 1]]) {
          ctx.strokeStyle = col; ctx.lineWidth = lw;
          ctx.beginPath(); ctx.moveTo(xa, ground(xa) + drop); ctx.lineTo(x1, ground(x1) + drop);
          ctx.moveTo(xa, ground(xa) + drop - 4); ctx.lineTo(xa, ground(xa) + drop + 4);
          ctx.moveTo(x1, ground(x1) + drop - 4); ctx.lineTo(x1, ground(x1) + drop + 4); ctx.stroke();
        }
        ctx.save();
        ctx.translate((xa + x1) / 2, ground((xa + x1) / 2) + drop); ctx.rotate(tilt);
        ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 5;
        label(ctx, `${DIST} m`, 0, compact ? 13 : 16, { size: compact ? 10 : 12, color: 'rgba(255,255,255,.9)', align: 'center' });
        ctx.restore();

        // title
        label(ctx, S.name, 16, compact ? 24 : 30, { size: compact ? 16 : 20, weight: 700 });
        label(ctx, `Surface gravity ${S.g} m/s²`, 16, compact ? 40 : 50, { size: compact ? 10.5 : 12.5, color: 'rgba(232,236,243,.75)' });

        // clock: the hand goes round once while the flow covers the distance
        const need = `about ${fmtTime(DIST / calc(key, Ls).v)}`, head = `Time to cover ${DIST} m`;
        const kx = compact ? 12 : 16, ky = compact ? 50 : 64, kh = compact ? 38 : 48, kr = compact ? 11 : 14, f1 = compact ? 9.5 : 11.5, f2 = compact ? 12.5 : 16;
        const kw = kh + 4 + Math.max(measure(ctx, head, f1), measure(ctx, need, f2, 700)) + 12;
        ctx.fillStyle = 'rgba(7,10,16,.8)'; box(ctx, kx, ky, kw, kh, 10); ctx.fill();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1; box(ctx, kx, ky, kw, kh, 10); ctx.stroke();
        const dx = kx + kh / 2, dy = ky + kh / 2 + 1, ang = -Math.PI / 2 + front * TAU;
        ctx.fillStyle = '#c9ced8'; ctx.fillRect(dx - 2, dy - kr - 4, 4, 3); // the crown of the stopwatch
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dx, dy, kr, 0, TAU); ctx.stroke();
        ctx.strokeStyle = ACCENT; ctx.beginPath(); ctx.arc(dx, dy, kr, -Math.PI / 2, ang); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.cos(ang) * (kr - 3), dy + Math.sin(ang) * (kr - 3)); ctx.stroke(); ctx.lineCap = 'butt';
        label(ctx, head, kx + kh + 2, ky + kh * 0.4, { size: f1, color: MUTED });
        label(ctx, need, kx + kh + 2, ky + kh * 0.8, { size: f2, weight: 700 });

        // inset: in the rheometer the spindle turns at one speed, and the melt resists more or less
        const bw = compact ? 148 : 198, bh = compact ? 96 : 132, bx = w - bw - (compact ? 8 : 12), by = compact ? 8 : 12, fi = compact ? 9 : 11;
        ctx.fillStyle = 'rgba(7,10,16,.8)'; box(ctx, bx, by, bw, bh, 10); ctx.fill();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1; box(ctx, bx, by, bw, bh, 10); ctx.stroke();
        label(ctx, 'In the rheometer', bx + 10, by + (compact ? 14 : 18), { size: compact ? 9.5 : 11.5, weight: 600 });
        const ccx = bx + bw * 0.21, cupW = bw * 0.23, cupTop = by + bh * 0.3, cupBot = by + bh * 0.73;
        ctx.fillStyle = hotB;
        ctx.fillRect(ccx - cupW / 2 + 3, cupTop + 8, cupW - 6, cupBot - cupTop - 11);
        ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(ccx - cupW / 2, cupTop); ctx.lineTo(ccx - cupW / 2, cupBot); ctx.lineTo(ccx + cupW / 2, cupBot); ctx.lineTo(ccx + cupW / 2, cupTop); ctx.stroke();
        const bobW = cupW * 0.42, bobTop = cupTop + 14, bobH = cupBot - bobTop - 10;
        ctx.fillStyle = '#e9edf3'; ctx.fillRect(ccx - 2, cupTop - (compact ? 6 : 9), 4, bobTop - cupTop + (compact ? 6 : 9));
        ctx.fillRect(ccx - bobW / 2, bobTop, bobW, bobH);
        ctx.save(); ctx.beginPath(); ctx.rect(ccx - bobW / 2, bobTop, bobW, bobH); ctx.clip();
        const off = api.still ? 0 : (t * 22) % 8; // the same speed of rotation in every melt
        ctx.fillStyle = 'rgba(40,50,70,.45)';
        for (let x = ccx - bobW / 2 - 8 + off; x < ccx + bobW / 2; x += 8) ctx.fillRect(x, bobTop, 3, bobH);
        ctx.restore();
        label(ctx, 'fixed speed', ccx, by + bh - (compact ? 8 : 11), { size: fi, color: MUTED, align: 'center' });
        // gauge: the stress that the instrument measures, on a scale of powers of ten
        const gx = bx + bw * 0.71, gy = by + bh * 0.71, gr = bw * 0.2;
        const arc = ctx.createLinearGradient(gx - gr, 0, gx + gr, 0);
        arc.addColorStop(0, BLUE); arc.addColorStop(1, ACCENT);
        ctx.strokeStyle = arc; ctx.lineWidth = compact ? 4 : 6; ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(232,236,243,.6)'; ctx.lineWidth = 1;
        for (let i = 0; i <= 6; i++) {
          const a = Math.PI + (i / 6) * Math.PI;
          ctx.beginPath(); ctx.moveTo(gx + Math.cos(a) * (gr - 6), gy + Math.sin(a) * (gr - 6)); ctx.lineTo(gx + Math.cos(a) * (gr - 11), gy + Math.sin(a) * (gr - 11)); ctx.stroke();
        }
        const na = Math.PI + clamp(gauge, 0, 1) * Math.PI;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(na) * (gr - 4), gy + Math.sin(na) * (gr - 4)); ctx.stroke(); ctx.lineCap = 'butt';
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(gx, gy, 3, 0, TAU); ctx.fill();
        label(ctx, 'measured stress', gx, by + bh - (compact ? 8 : 11), { size: fi, color: MUTED, align: 'center' });

        // viscosity scale with everyday comparisons
        const sy = h - (compact ? 20 : 24), sx0 = w * 0.06, sx1 = w * 0.94, SX = (l) => lerp(sx0, sx1, (l + 3) / 13);
        ctx.fillStyle = 'rgba(7,10,16,.72)'; ctx.fillRect(0, sy - (compact ? 34 : 40), w, h);
        ctx.strokeStyle = MUTED; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx0, sy); ctx.lineTo(sx1, sy); ctx.stroke();
        for (let l = -2; l <= 10; l += 2) {
          ctx.beginPath(); ctx.moveTo(SX(l), sy - 3); ctx.lineTo(SX(l), sy + 3); ctx.stroke();
          label(ctx, l === 0 ? '1' : l === 10 ? `10${sup(l)} Pa·s` : `10${sup(l)}`, l === 10 ? SX(l) + 12 : SX(l), sy + 15, { size: compact ? 9.5 : 11, color: MUTED, align: l === 10 ? 'right' : 'center' });
        }
        for (const [l, name] of everyday) {
          if (compact && (name === 'olive oil' || name === 'peanut butter')) continue;
          ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(SX(l), sy, 2.5, 0, TAU); ctx.fill();
          label(ctx, name, SX(l), sy - 13, { size: compact ? 9.5 : 11, color: BLUE, align: l < -2.5 ? 'left' : 'center' });
        }
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 3; ctx.shadowColor = ACCENT; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(SX(L), sy, 7, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0;
      },
    };
  };

  /* ---------- 3. Venus Surface Simulator: pressure and temperature chart ---------- */
  const VIRA = [[0, 462, 92.1], [5, 424, 66.6], [10, 385, 47.4], [15, 348, 33.0], [20, 308, 22.5], [25, 266, 14.9], [30, 224, 9.85], [35, 182, 5.92], [40, 144, 3.5], [45, 112, 1.98], [50, 77, 1.07], [55, 29, 0.531], [60, -10, 0.236], [65, -30, 0.098], [70, -43, 0.037], [75, -58, 0.012]];
  const venusT = (z) => interp(VIRA, z, 1);
  const VIRA_LOG = VIRA.map((r) => [r[0], Math.log10(r[2])]);
  const venusP = (z) => Math.pow(10, interp(VIRA_LOG, z));
  const fmtP = (p) => (p >= 10 ? String(Math.round(p)) : p >= 1 ? p.toFixed(1) : num(p));

  VIZ.sta = (bar, api) => {
    let z = 0;
    const calm = calmer();
    const sset = slider(bar, { label: 'Altitude above the surface of Venus', min: 0, max: 70, step: 1, value: z, chars: 5, fmt: (v) => `${Math.round(v)} km` }, (v) => { z = v; caption(); api.kick(); });
    const inside = (T, P) => T >= 20 && T <= 1200 && P >= 1 && P <= 150;
    function sentence(zz) {
      const T = Math.round(venusT(zz)), P = venusP(zz);
      if (zz === 0) return 'The surface of Venus: about 460 °C and 92 bar, hot enough to melt lead and as heavy as the ocean 900 m down. This lies well inside the range of the instrument, which reaches 1200 °C and 150 bar (0.015 GPa).';
      if (inside(T, P)) return `Venus at ${zz} km altitude: about ${minus(T)} °C and ${fmtP(P)} bar. Still inside the range of the instrument, so this layer of the atmosphere can be reproduced directly.`;
      return `Venus at ${zz} km altitude: about ${minus(T)} °C and ${fmtP(P)} bar. This is the cloud region, cooler and thinner than the instrument is built for.`;
    }
    const caption = () => api.setCap(sentence(z));
    caption();
    const refs = [['Earth', 15, 1.013, '#5fa8ff'], ['Mars', -63, 0.006, '#d0683e'], ['Titan', -179, 1.47, '#e0a040']];

    // The tour: from the surface up through the atmosphere, with a rest at each stop.
    const stops = [0, 25, 50, 62];
    let from = z, to = z;
    const tr = tour(stops.length, (k) => {
      from = z; to = stops[k];
      api.setCap(sentence(to));
      return { glide: from === to ? 0 : 1.6 + Math.abs(to - from) * 0.045, hold: 4.6 };
    }, (u) => { z = lerp(from, to, u); });

    return {
      play(first) { if (first) tr.from(0); },
      pause() { tr.stop(); z = sset.settle(z); caption(); },
      samples() { return [0, 25, 40, 62, 70].map(sentence); },
      draw(ctx, w, h, t, dt) {
        if (api.live) tr.tick(dt);
        const zs = Math.round(calm(z, 5, api.auto && tr.moving, dt)); // the altitude as it is written
        if (api.auto) sset.glide(z, zs);
        const compact = w < 560;
        const L = compact ? 44 : 64, Rm = compact ? 46 : 74, T0 = compact ? 16 : 24, Bm = compact ? 36 : 46;
        const X = (T) => L + ((T + 200) / 1500) * (w - L - Rm);
        const Y = (p) => T0 + ((3 - Math.log10(p)) / 6) * (h - T0 - Bm);
        ctx.fillStyle = '#070a10'; ctx.fillRect(0, 0, w, h);
        // grid
        ctx.lineWidth = 1;
        const majors = compact ? [0, 400, 800, 1200] : [-200, 0, 200, 400, 600, 800, 1000, 1200];
        for (let T = -200; T <= 1300; T += 100) {
          const major = majors.includes(T);
          if (compact && !major) continue;
          ctx.strokeStyle = major ? 'rgba(47,59,85,.9)' : 'rgba(47,59,85,.4)';
          ctx.beginPath(); ctx.moveTo(X(T), T0); ctx.lineTo(X(T), h - Bm); ctx.stroke();
          if (major) label(ctx, minus(T), X(T), h - Bm + 16, { size: compact ? 10 : 12, color: MUTED, align: 'center' });
        }
        // pressure: bar on the left, and the same values in GPa (the unit used for the press) on the right
        const gpa = ['10⁻⁷', '10⁻⁶', '10⁻⁵', '10⁻⁴', '0.001', '0.01', '0.1'];
        for (let e = -3; e <= 3; e++) {
          const yy = Y(Math.pow(10, e));
          ctx.strokeStyle = 'rgba(47,59,85,.9)';
          ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(w - Rm, yy); ctx.stroke();
          label(ctx, e < 0 ? String(Math.pow(10, e)) : Math.pow(10, e).toLocaleString('en-US'), L - 6, yy, { size: compact ? 10 : 12, color: MUTED, align: 'right', base: 'middle' });
          label(ctx, gpa[e + 3], w - Rm + 6, yy, { size: compact ? 10 : 12, color: MUTED, base: 'middle' });
        }
        label(ctx, 'Temperature (°C)', (L + w - Rm) / 2, h - 8, { size: compact ? 10.5 : 12.5, color: MUTED, align: 'center' });
        ctx.save(); ctx.translate(compact ? 11 : 16, (T0 + h - Bm) / 2); ctx.rotate(-Math.PI / 2);
        label(ctx, 'Pressure (bar)', 0, 0, { size: compact ? 10.5 : 12.5, color: MUTED, align: 'center' }); ctx.restore();
        ctx.save(); ctx.translate(w - (compact ? 5 : 10), (T0 + h - Bm) / 2); ctx.rotate(-Math.PI / 2);
        label(ctx, 'Pressure (GPa)', 0, 0, { size: compact ? 10.5 : 12.5, color: MUTED, align: 'center' }); ctx.restore();

        // instrument range
        const ex0 = X(20), ex1 = X(1200), ey0 = Y(150), ey1 = Y(1);
        const pulse = api.still ? 0.14 : 0.12 + 0.04 * Math.sin(t * 1.5);
        ctx.fillStyle = `rgba(255,138,61,${pulse.toFixed(3)})`; ctx.fillRect(ex0, ey0, ex1 - ex0, ey1 - ey0);
        ctx.strokeStyle = ACCENT; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5; ctx.strokeRect(ex0, ey0, ex1 - ex0, ey1 - ey0); ctx.setLineDash([]);
        label(ctx, compact ? 'Instrument range' : 'Range of the Venus Surface Simulator', ex1 - 8, ey1 - (compact ? 32 : 26), { size: compact ? 10.5 : 13, weight: 600, color: ACCENT, align: 'right' });
        if (compact) { label(ctx, 'up to 1200 °C and 150 bar', ex1 - 8, ey1 - 19, { size: 9.5, color: ACCENT, align: 'right' }); label(ctx, '(0.015 GPa)', ex1 - 8, ey1 - 7, { size: 9.5, color: ACCENT, align: 'right' }); }
        else label(ctx, 'up to 1200 °C and 150 bar (0.015 GPa)', ex1 - 8, ey1 - 9, { size: 12, color: ACCENT, align: 'right' });

        // other surfaces for reference
        for (const [name, T, P, col] of refs) {
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(T), Y(P), compact ? 4 : 5.5, 0, TAU); ctx.fill();
          const left = name === 'Earth'; // Earth sits on the corner of the range box, so its name goes to the lower left
          label(ctx, compact ? name : `${name} surface`, X(T) + (left ? -9 : 9), Y(P) + (left ? 16 : 4), { size: compact ? 10 : 12, color: col, align: left ? 'right' : 'left' });
        }

        // the atmosphere of Venus from the surface to the clouds
        ctx.lineWidth = compact ? 2.5 : 3.5; ctx.lineCap = 'round';
        for (let i = 1; i < VIRA.length - 1; i++) {
          const a = VIRA[i - 1], b = VIRA[i];
          ctx.strokeStyle = mix('ffd27a', '7fd3ff', i / (VIRA.length - 2));
          ctx.beginPath(); ctx.moveTo(X(a[1]), Y(a[2])); ctx.lineTo(X(b[1]), Y(b[2])); ctx.stroke();
        }
        ctx.lineCap = 'butt';
        for (const zz of compact ? [0, 40, 60] : [0, 20, 40, 60]) {
          const xx = X(venusT(zz)), yy = Y(venusP(zz));
          ctx.fillStyle = '#0b0e14'; ctx.strokeStyle = '#ffe2a8'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(xx, yy, 3, 0, TAU); ctx.fill(); ctx.stroke();
          if (zz === 0) label(ctx, 'Venus surface', xx + 9, yy + 4, { size: compact ? 9.5 : 11.5, color: '#ffe2a8' });
          else if (Math.abs(zz - z) > 4) label(ctx, `${zz} km`, xx + 9, yy + 13, { size: compact ? 9.5 : 11.5, color: '#ffe2a8' });
        }
        // marker
        const mx = X(venusT(z)), my = Y(venusP(z)), pr = 8 + (api.still ? 0 : 2.5 * Math.sin(t * 3));
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(mx, my, pr, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, TAU); ctx.fill();
        const txt = `Venus, ${zs} km: ${minus(Math.round(venusT(zs)))} °C, ${fmtP(venusP(zs))} bar`;
        const fs = compact ? 11 : 13.5, tw = measure(ctx, txt, fs, 600) + 16;
        const tx = clamp(mx - tw / 2, L + 4, w - Rm - tw - 2), ty = my + 18 + fs + 10 > h - Bm ? my - 20 - fs - 8 : my + 18;
        ctx.fillStyle = 'rgba(7,10,16,.9)'; box(ctx, tx, ty, tw, fs + 12, 6); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1; box(ctx, tx, ty, tw, fs + 12, 6); ctx.stroke();
        label(ctx, txt, tx + 8, ty + fs + 4, { size: fs, weight: 600 });
      },
    };
  };

  /* ---------- 4. Gas-mixing furnace: gas mixture and oxygen fugacity ---------- */
  VIZ.furnace = (bar, api) => {
    let co = 5, T = 1200, pref = 0, so2 = false; // pref: pressure for the reference lines in GPa, where 0 stands for 1 bar
    const calmCo = calmer(), calmP = calmer();
    const r = rng(11);
    const parts = Array.from({ length: 110 }, () => ({ x: r(), y: r(), u: r(), s: 0.5 + r() * 0.9, p: r() * TAU }));
    function calc(c = co) {
      const Tk = T + 273.15, ratio = (100 - c) / c;
      const logf = 2 * Math.log10(ratio) - 29502 / Tk + 9.069; // CO + 1/2 O2 = CO2, ideal gas at 1 bar
      const iw = -27489 / Tk + 6.702, qfm = -25096.3 / Tk + 8.735;
      return { logf, dIW: logf - iw, qfmIW: qfm - iw };
    }
    // How far a reference line lies above its place at 1 bar when the pressure is p (in GPa).
    // After Frost (1991): the term C (P - 1) / T, with P in bar and T in kelvin. C is 0.055 for IW and 0.110 for QFM.
    const lift = (coef, p = pref) => (coef * p * 1e4) / (T + 273.15);
    const fmtRef = (v) => (v < 0.05 ? '1 bar' : `${v.toFixed(1)} GPa`);
    const signed = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;
    // The sentence under the picture names the kind of conditions, so it changes only when the result moves to another kind.
    function sentence(c, p) {
      const d = calc(c).dIW;
      const where = d < -3 ? 'Strongly reduced, approaching the conditions under which Mercury formed.'
        : d < -1 ? 'Reduced conditions where metallic iron is stable, as in the interiors of the Moon and the asteroid Vesta.'
        : d < 1.5 ? 'Close to the iron–wüstite buffer, like the more reduced magmas of Mars.'
        : d < 3.5 ? 'In the range shared by Martian magmas and the more reduced parts of the upper mantle of the Earth.'
        : d < 5 ? 'Like the upper mantle of the Earth, near the quartz–fayalite–magnetite buffer.'
        : 'More oxidised than most mantle rocks, towards the conditions of planetary surfaces.';
      const deep = p >= 0.05 ? ` Deeper inside a planet the reference lines lie at a higher oxygen fugacity: at ${p.toFixed(1)} GPa, iron–wüstite by ${lift(0.055, p).toFixed(1)} and QFM by ${lift(0.11, p).toFixed(1)} log units. The furnace itself works at 1 bar.` : '';
      const sulfur = so2 ? ' With SO₂ added, sulfur enters the gas as well, as in the atmosphere of Venus. The value shown is for the CO₂–CO part only.' : '';
      return where + deep + sulfur;
    }
    const caption = () => api.setCap(sentence(co, pref));

    const sco = slider(bar, { label: 'CO in the CO₂–CO mixture', min: 0.5, max: 99.5, step: 0.5, value: co, chars: 6, fmt: (v) => `${num(v, 3)}%` }, (v) => { co = v; caption(); api.kick(); });
    slider(bar, { label: 'Temperature', min: 900, max: 1500, step: 10, value: T, chars: 7, fmt: (v) => `${v} °C` }, (v) => { T = v; caption(); api.kick(); });
    const spr = slider(bar, { label: 'Pressure for the reference lines', min: 0, max: 3.5, step: 0.1, value: pref, chars: 7, fmt: fmtRef }, (v) => { pref = v; caption(); api.kick(); });
    toggle(bar, 'Add SO₂', (on) => { so2 = on; caption(); api.kick(); });
    caption();
    const hot = (Tc) => { const u = clamp((Tc - 900) / 600, 0, 1); return u < 0.5 ? mix('ff4a1a', 'ffa23a', u * 2) : mix('ffa23a', 'fff0b0', (u - 0.5) * 2); };
    const bodies = [['Upper mantle of the Earth', 1.5, 5, '#5fa8ff'], ['Mars', -1, 3.5, '#d0683e'], ['Moon', -2, 0, '#b9bcc4'], ['Vesta', -2.5, -1, '#9c948a'], ['Mercury', -7, -3, '#c9b79c']];

    // The tour: from an oxidising to a reducing mixture, with one stop that shows the reference lines under pressure.
    // The mixture glides evenly along the scale of the picture, which is the logarithm of the ratio of CO₂ to CO.
    const scenes = [[2, 0], [20, 0], [20, 3.5], [75, 0], [97, 0], [99.5, 0]];
    const logit = (c) => Math.log10((100 - c) / c), unlogit = (x) => 100 / (1 + Math.pow(10, x));
    let from = [logit(co), pref], to = from;
    const tr = tour(scenes.length, (k) => {
      from = [logit(co), pref]; to = [logit(scenes[k][0]), scenes[k][1]];
      api.setCap(sentence(scenes[k][0], scenes[k][1]));
      const far = Math.abs(to[0] - from[0]) * 1.1 + Math.abs(to[1] - from[1]) * 0.55;
      return { glide: far ? 1.4 + far : 0, hold: scenes[k][1] ? 6 : 4.6 };
    }, (u) => { co = unlogit(lerp(from[0], to[0], u)); pref = lerp(from[1], to[1], u); });
    const coarse = (c) => { const e = Math.min(c, 100 - c); return e < 3 ? 0.5 : e < 12 ? 1 : 5; };

    return {
      play(first) { if (first) tr.from(0); },
      pause() { tr.stop(); co = sco.settle(co); pref = spr.settle(pref); caption(); },
      samples() { return scenes.map((x) => sentence(x[0], x[1])); },
      draw(ctx, w, h, t, dt) {
        if (api.live) tr.tick(dt);
        const gliding = api.auto && tr.moving;
        const cs = calmCo(co, coarse(co), gliding, dt), ps = calmP(pref, 0.5, gliding, dt); // the values as they are written
        if (api.auto) { sco.glide(co, cs); spr.glide(pref, ps); }
        const compact = w < 560, c = calc(), shown = calc(cs);
        ctx.fillStyle = '#070a10'; ctx.fillRect(0, 0, w, h);

        /* left: the furnace tube */
        const px0 = compact ? w * 0.09 : w * 0.07, pw = compact ? w * 0.15 : w * 0.11, py0 = h * 0.08, py1 = h * 0.9;
        const fy0 = h * 0.26, fy1 = h * 0.72, cxm = px0 + pw / 2, cym = (fy0 + fy1) / 2, pad = compact ? 12 : 22;
        const glowC = hot(T);
        ctx.fillStyle = '#232a38'; box(ctx, px0 - pad, fy0, pw + 2 * pad, fy1 - fy0, 8); ctx.fill();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1; box(ctx, px0 - pad, fy0, pw + 2 * pad, fy1 - fy0, 8); ctx.stroke();
        for (let i = 0; i < 7; i++) { // heating elements
          const yy = lerp(fy0 + 12, fy1 - 12, i / 6);
          ctx.strokeStyle = glowC; ctx.globalAlpha = 0.55 + (api.still ? 0 : 0.2 * Math.sin(t * 2 + i)); ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(px0 - pad + 4, yy); ctx.lineTo(px0 - 3, yy); ctx.moveTo(px0 + pw + 3, yy); ctx.lineTo(px0 + pw + pad - 4, yy); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(18,24,36,.96)'; box(ctx, px0, py0, pw, py1 - py0, pw / 2); ctx.fill();
        ctx.save(); box(ctx, px0, py0, pw, py1 - py0, pw / 2); ctx.clip();
        const hz = ctx.createRadialGradient(cxm, cym, 2, cxm, cym, (fy1 - fy0) * 0.62);
        hz.addColorStop(0, glowC); hz.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.5; ctx.fillStyle = hz; ctx.fillRect(px0, py0, pw, py1 - py0); ctx.globalAlpha = 1;
        const nP = compact ? 60 : parts.length, fs = so2 ? 0.12 : 0;
        for (let i = 0; i < nP; i++) {
          const p = parts[i];
          const yy = lerp(py1 - 6, py0 + 6, (p.y + (api.still ? 0 : t * 0.07 * p.s)) % 1);
          const xx = px0 + pw * (0.16 + 0.68 * p.x) + (api.still ? 0 : Math.sin(t * 2 + p.p) * 2.5);
          let col = '#a9bde0';
          if (p.u < fs) col = '#f2e24a'; else if ((p.u - fs) / (1 - fs) < co / 100) col = ACCENT;
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(xx, yy, compact ? 2 : 2.6, 0, TAU); ctx.fill();
        }
        ctx.restore();
        ctx.strokeStyle = '#66728c'; ctx.lineWidth = 1.5; box(ctx, px0, py0, pw, py1 - py0, pw / 2); ctx.stroke();
        // sample bead hanging on a wire loop in the hot zone
        ctx.strokeStyle = '#cfd4dc'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cxm, py0 + 2); ctx.lineTo(cxm, cym - 9); ctx.stroke();
        ctx.beginPath(); ctx.arc(cxm, cym, 9, 0, TAU); ctx.stroke();
        ctx.fillStyle = glowC; ctx.shadowColor = glowC; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(cxm, cym, 6, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
        label(ctx, 'gas out', cxm, py0 - 4, { size: compact ? 9.5 : 11, color: MUTED, align: 'center' });
        label(ctx, 'gas in', cxm, py1 + 13, { size: compact ? 9.5 : 11, color: MUTED, align: 'center' });
        if (!compact) {
          label(ctx, `${T} °C`, px0 + pw + pad + 8, cym, { size: 13, weight: 600, color: glowC });
          label(ctx, '1 bar', px0 + pw + pad + 8, cym + 16, { size: 11, color: MUTED });
        }

        /* right: where this mixture sits on the redox scale */
        const ax0 = compact ? w * 0.36 : w * 0.3, ax1 = w - (compact ? 12 : 26), ay = h * (compact ? 0.84 : 0.82);
        const AX = (d) => lerp(ax0, ax1, (d + 8) / 16);
        const rowTop = h * 0.2, rh = (ay - rowTop - 22) / bodies.length;
        // legend
        const lg = [['CO₂', '#a9bde0'], ['CO', ACCENT]].concat(so2 ? [['SO₂', '#f2e24a']] : []);
        let lx = ax0;
        for (const [name, col] of lg) {
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx + 5, compact ? 16 : 24, 4.5, 0, TAU); ctx.fill();
          label(ctx, name, lx + 14, (compact ? 16 : 24) + 4, { size: compact ? 11 : 13 });
          lx += measure(ctx, name, compact ? 11 : 13) + 30;
        }
        // reference lines: the two buffers. Under pressure they move to the right, and a faint line stays where they were at 1 bar.
        const deep = pref >= 0.005, refCol = deep ? VIOLET : MUTED;
        for (const [name, at1, coef] of [['IW', 0, 0.055], ['QFM', c.qfmIW, 0.11]]) {
          const xa = AX(at1), xb = AX(at1 + lift(coef));
          ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
          if (deep) { ctx.strokeStyle = 'rgba(154,166,186,.28)'; ctx.beginPath(); ctx.moveTo(xa, rowTop - 6); ctx.lineTo(xa, ay); ctx.stroke(); }
          ctx.strokeStyle = deep ? 'rgba(201,184,255,.8)' : 'rgba(154,166,186,.55)';
          ctx.beginPath(); ctx.moveTo(xb, rowTop - 6); ctx.lineTo(xb, ay); ctx.stroke(); ctx.setLineDash([]);
          if (xb - xa > 7) { // arrow from the place at 1 bar to the place under pressure
            const yy = rowTop - 6;
            ctx.strokeStyle = VIOLET; ctx.beginPath(); ctx.moveTo(xa, yy); ctx.lineTo(xb - 1, yy); ctx.moveTo(xb - 5, yy - 3.5); ctx.lineTo(xb - 1, yy); ctx.lineTo(xb - 5, yy + 3.5); ctx.stroke();
          }
          label(ctx, name, xb, ay + (compact ? 26 : 30), { size: compact ? 9.5 : 11, color: refCol, align: 'center' });
        }
        if (ps >= 0.05) label(ctx, compact ? `lines at ${ps.toFixed(1)} GPa` : `Reference lines at ${ps.toFixed(1)} GPa`, ax1, (compact ? 16 : 24) + 4, { size: compact ? 10 : 12, color: VIOLET, align: 'right' });
        // planetary ranges
        bodies.forEach(([name, a, b, col], i) => {
          const yy = rowTop + rh * i + rh * 0.62, bh = Math.min(12, rh * 0.34);
          ctx.fillStyle = col; ctx.globalAlpha = 0.85; box(ctx, AX(a), yy - bh / 2, AX(b) - AX(a), bh, bh / 2); ctx.fill(); ctx.globalAlpha = 1;
          const fsz = compact ? 10 : 12.5, over = AX(a) + measure(ctx, name, fsz) > ax1;
          label(ctx, name, over ? AX(b) : AX(a), yy - bh / 2 - 5, { size: fsz, color: col, align: over ? 'right' : 'left' });
        });
        // axis
        ctx.strokeStyle = MUTED; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(ax1, ay); ctx.stroke();
        for (let d = -8; d <= 8; d += 2) {
          ctx.beginPath(); ctx.moveTo(AX(d), ay); ctx.lineTo(AX(d), ay + 4); ctx.stroke();
          label(ctx, d > 0 ? `+${d}` : minus(d), AX(d), ay + 15, { size: compact ? 9.5 : 11, color: MUTED, align: 'center' });
        }
        label(ctx, compact ? '← reduced      oxidised →' : '← more reduced      log fO₂ relative to the iron–wüstite buffer at 1 bar      more oxidised →', (ax0 + ax1) / 2, h - (compact ? 5 : 8), { size: compact ? 9.5 : 11.5, color: MUTED, align: 'center' });
        // range reachable with CO2-CO mixtures at this temperature
        const lo = calc(99.5).dIW, hi = calc(0.5).dIW;
        ctx.strokeStyle = BLUE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(AX(lo), ay - 8); ctx.lineTo(AX(hi), ay - 8); ctx.moveTo(AX(lo), ay - 12); ctx.lineTo(AX(lo), ay - 4); ctx.moveTo(AX(hi), ay - 12); ctx.lineTo(AX(hi), ay - 4); ctx.stroke();
        if (!compact) label(ctx, 'range of CO₂–CO mixtures', AX(lo) - 10, ay - 8, { size: 11, color: BLUE, align: 'right', base: 'middle' });
        // marker, with the result in numbers
        const mx = AX(clamp(c.dIW, -8, 8));
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.shadowColor = ACCENT; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(mx, rowTop - 14); ctx.lineTo(mx, ay); ctx.stroke(); ctx.shadowBlur = 0;
        const txt = `IW ${signed(shown.dIW)}`, fz = compact ? 12 : 15, tw = measure(ctx, txt, fz, 700) + 16;
        const more = `log fO₂ ≈ ${minus(shown.logf.toFixed(1))}`, fm = compact ? 10 : 12, mw = measure(ctx, more, fm);
        const tx = clamp(mx - tw / 2, ax0, ax1 - tw), ty = rowTop - 14 - fz - 12;
        ctx.fillStyle = ACCENT; box(ctx, tx, ty, tw, fz + 10, 6); ctx.fill();
        label(ctx, txt, tx + 8, ty + fz + 2, { size: fz, weight: 700, color: '#1a0f05' });
        const right = tx + tw + 8 + mw <= ax1;
        label(ctx, more, right ? tx + tw + 8 : tx - 8, ty + fz + 1, { size: fm, color: MUTED, align: right ? 'left' : 'right' });
      },
    };
  };

  /* ---------- 5. Venus clouds and ionic liquids ---------- */
  VIZ.clouds = (bar, api) => {
    let z = 55;
    const calm = calmer();
    const sset = slider(bar, { label: 'Altitude', min: 42, max: 73, step: 0.5, value: z, chars: 7, fmt: (v) => `${num(v, 3)} km` }, (v) => { z = v; caption(); api.kick(); });
    function sentence(zz) {
      const T = Math.round(venusT(zz)), P = fmtP(venusP(zz));
      const s = `At ${num(zz, 3)} km: about ${minus(T)} °C and ${P} bar. `;
      return s + (zz < 47.5 ? 'Below the clouds it is too hot for droplets of sulfuric acid, which evaporate into a thin haze.'
        : zz < 50.5 ? 'The lower cloud deck: the densest part of the clouds, with the largest droplets.'
        : zz < 56.5 ? 'The middle cloud deck: near 55 km the temperature is close to room temperature and the pressure about half that at sea level on Earth.'
        : zz <= 70 ? 'The upper cloud deck: below freezing, and swept around the planet by winds of roughly 100 m/s.'
        : 'Above the cloud tops: thin haze and the cold upper atmosphere.');
    }
    const caption = () => api.setCap(sentence(z));
    caption();
    const r = rng(29);
    const drops = Array.from({ length: 260 }, () => {
      const u = r(), a = r();
      if (u < 0.12) return { alt: 40 + 7.5 * a, x: r(), s: 0.8, al: 0.22 };
      if (u < 0.37) return { alt: 47.5 + 3 * a, x: r(), s: 1.6 + r() * 1.8, al: 0.6 };
      if (u < 0.67) return { alt: 50.5 + 6 * a, x: r(), s: 1.2 + r() * 1.2, al: 0.5 };
      if (u < 0.95) return { alt: 56.5 + 13.5 * a, x: r(), s: 0.8 + r() * 0.7, al: 0.42 };
      return { alt: 70 + 5 * a, x: r(), s: 0.7, al: 0.2 };
    });
    const decks = [[70, 75, 'Upper haze'], [56.5, 70, 'Upper cloud'], [50.5, 56.5, 'Middle cloud'], [47.5, 50.5, 'Lower cloud'], [40, 47.5, 'Haze below the clouds']];
    const steps = ['Sulfuric acid takes up nitrogen-bearing organic molecules', 'The excess acid evaporates', 'An ionic liquid remains'];

    // The tour: the balloon visits each cloud deck and rests there.
    const stops = [55, 63, 72, 49, 44.5];
    let from = z, to = z;
    const tr = tour(stops.length, (k) => {
      from = z; to = stops[k];
      api.setCap(sentence(to));
      return { glide: from === to ? 0 : 1.5 + Math.abs(to - from) * 0.12, hold: 4.6 };
    }, (u) => { z = lerp(from, to, u); });

    return {
      play(first) { if (first) tr.from(0); },
      pause() { tr.stop(); z = sset.settle(z); caption(); },
      samples() { return [44.5, 49, 55, 63, 72].map(sentence); },
      draw(ctx, w, h, t, dt) {
        if (api.live) tr.tick(dt);
        const zs = calm(z, 1, api.auto && tr.moving, dt); // the altitude as it is written
        if (api.auto) sset.glide(z, zs);
        const compact = w < 560;
        const YA = (alt) => lerp(h, 0, (alt - 40) / 35);
        const bg = ctx.createLinearGradient(0, YA(75), 0, YA(40));
        [[0, '#0b0d1a'], [5 / 35, '#3d3a52'], [13 / 35, '#d6c48f'], [20 / 35, '#e0b666'], [26 / 35, '#b97830'], [31 / 35, '#7a4318'], [1, '#48240e']].forEach(([s, c]) => bg.addColorStop(s, c));
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        const nD = compact ? 130 : drops.length;
        for (let i = 0; i < nD; i++) {
          const d = drops[i], sp = (10 + 30 * (d.alt - 40) / 35) / w;
          const x = ((d.x + (api.still ? 0 : t * sp)) % 1) * (w + 20) - 10;
          ctx.fillStyle = `rgba(255,251,230,${d.al})`;
          ctx.beginPath(); ctx.arc(x, YA(d.alt), d.s * (compact ? 0.85 : 1.25), 0, TAU); ctx.fill();
        }
        // cloud decks and altitude scale
        for (const [a, b, name] of decks) {
          if (a > 40) { ctx.strokeStyle = 'rgba(10,12,20,.35)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, YA(a)); ctx.lineTo(w, YA(a)); ctx.stroke(); ctx.setLineDash([]); }
          const dark = (a + b) / 2 > 50 && (a + b) / 2 < 66;
          label(ctx, name, compact ? 44 : 64, YA((a + b) / 2) + 4, { size: compact ? 10.5 : 13, weight: 600, color: dark ? 'rgba(20,16,10,.8)' : 'rgba(255,244,220,.85)' });
        }
        for (let a = 45; a <= 70; a += 5) {
          const dark = a > 50 && a < 66;
          label(ctx, `${a} km`, 8, YA(a) + 4, { size: compact ? 9.5 : 11.5, color: dark ? 'rgba(20,16,10,.75)' : 'rgba(255,244,220,.75)' });
        }

        // altitude marker line (drawn before the inset so the panel stays clean)
        const my = YA(z);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(0, my); ctx.lineTo(w, my); ctx.stroke(); ctx.setLineDash([]);

        // inset: how an ionic liquid forms. A result from the laboratory, which plays whatever the altitude of the balloon.
        const iw = compact ? w * 0.47 : w * 0.31, ih = compact ? h * 0.6 : h - 32, ix = w - iw - (compact ? 8 : 16), iy = compact ? 8 : 16;
        ctx.fillStyle = 'rgba(8,11,18,.86)'; box(ctx, ix, iy, iw, ih, 12); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; box(ctx, ix, iy, iw, ih, 12); ctx.stroke();
        label(ctx, compact ? 'In the laboratory' : 'Laboratory result', ix + 12, iy + (compact ? 17 : 22), { size: compact ? 9.5 : 11.5, color: MUTED });
        label(ctx, compact ? 'From acid to ionic liquid' : 'How an ionic liquid forms', ix + 12, iy + (compact ? 32 : 42), { size: compact ? 11 : 14, weight: 700 });
        const cyc = 12, ph = api.still ? 11 : t % cyc, stage = Math.min(2, Math.floor(ph / 4)), u = (ph % 4) / 4;
        const dcx = ix + iw / 2, dcy = iy + ih * (compact ? 0.5 : 0.44), R0 = Math.min(iw, ih) * 0.2;
        const R = stage === 0 ? R0 : stage === 1 ? lerp(R0, R0 * 0.62, ease(u)) : R0 * 0.62;
        const colU = stage === 0 ? 0 : stage === 1 ? ease(u) : 1;
        const dcol = mix('f2d94a', '3fd0c0', colU);
        if (stage === 1) { // acid vapour leaving the droplet
          for (let i = 0; i < 10; i++) {
            const pu = (u * 1.6 + i / 10) % 1;
            ctx.fillStyle = `rgba(242,217,74,${(0.7 * (1 - pu)).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(dcx + Math.sin(i * 1.9) * R * (0.6 + pu * 0.5), dcy - R - pu * ih * 0.17, 2.4, 0, TAU); ctx.fill();
          }
        }
        ctx.fillStyle = dcol; ctx.shadowColor = dcol; ctx.shadowBlur = stage === 2 ? 22 : 10;
        ctx.beginPath(); ctx.arc(dcx, dcy, R, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(dcx - R * 0.35, dcy - R * 0.4, R * 0.22, R * 0.13, -0.6, 0, TAU); ctx.fill();
        for (let i = 0; i < 6; i++) { // organic molecules
          const ang = (i / 6) * TAU + 0.4, dist = stage === 0 ? lerp(R0 * 2.3, R0 * 0.5, ease(Math.min(1, u * 1.4))) : R * 0.55;
          ctx.fillStyle = '#4a7dff'; ctx.strokeStyle = '#0b0e14'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(dcx + Math.cos(ang) * dist, dcy + Math.sin(ang) * dist * 0.9, compact ? 3 : 4, 0, TAU); ctx.fill(); ctx.stroke();
        }
        const ty = iy + ih * (compact ? 0.76 : 0.72);
        label(ctx, `${stage + 1}`, ix + 12, ty, { size: compact ? 18 : 26, weight: 700, color: dcol });
        wrap(ctx, steps[stage], ix + (compact ? 28 : 36), ty - (compact ? 7 : 10), iw - (compact ? 36 : 48), compact ? 13 : 17, { size: compact ? 10.5 : 13 });
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i === stage ? '#fff' : 'rgba(255,255,255,.3)';
          ctx.beginPath(); ctx.arc(dcx + (i - 1) * 14, iy + ih - 12, 3, 0, TAU); ctx.fill();
        }

        // balloon probe at the chosen altitude, with a read-out
        const bx = compact ? w * 0.3 : w * 0.34, bob = api.still ? 0 : Math.sin(t * 1.6) * 2.5, br = compact ? 8 : 11;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx, my + bob - br * 0.2); ctx.lineTo(bx, my + bob + br * 1.5); ctx.stroke();
        ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.arc(bx, my + bob - br, br, 0, TAU); ctx.fill();
        ctx.fillStyle = ACCENT; ctx.fillRect(bx - 3.5, my + bob + br * 1.5, 7, 6);
        const txt = `${num(zs, 3)} km · ${minus(Math.round(venusT(zs)))} °C · ${fmtP(venusP(zs))} bar`;
        const fz = compact ? 11 : 14, tw = measure(ctx, txt, fz, 600) + 16;
        const tx = compact ? w - tw - 8 : bx + br + 12, tyy = compact ? h - fz - 20 : clamp(my - fz - 20, 6, h - fz - 16);
        ctx.fillStyle = 'rgba(8,11,18,.88)'; box(ctx, tx, tyy, tw, fz + 12, 6); ctx.fill();
        label(ctx, txt, tx + 8, tyy + fz + 4, { size: fz, weight: 600 });
      },
    };
  };

  /* ---------- mounting ---------- */
  const ICON = { play: 'M3 1.5v11l9.5-5.5z', pause: 'M2.5 1.5h3.2v11H2.5zM8.3 1.5h3.2v11H8.3z' };
  function mount(el) {
    const def = VIZ[el.dataset.viz];
    const canvas = el.querySelector('canvas');
    if (!def || !canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const bar = el.querySelector('.bar'), cap = el.querySelector('.cap');
    // visible: near the screen, so the picture is drawn. inView: a good part is on screen, so the tour moves on.
    // frozen: stopped with the Pause button, until a control is touched or Play is pressed.
    let w = 0, h = 0, raf = 0, visible = false, inView = false, frozen = false, started = false, last = 0, room = 0;
    const t0 = performance.now();
    const tall = (node) => Math.ceil(node.getBoundingClientRect().height); // whole pixels, so that the height never flickers
    const api = {
      auto: false,   // the tour is playing
      live: false,   // the tour is playing and the picture is on screen
      still: reduce, // no motion at all: the visitor asked the system for reduced motion and has not pressed Play
      kick() { if (!raf) raf = requestAnimationFrame(frame); },
      setCap(s) {
        if (cap.textContent === s) return;
        cap.textContent = s;
        if (room && tall(cap) > room) { room = tall(cap); cap.style.minHeight = `${room}px`; }
      },
    };
    const inst = def(bar, api);

    // Room for the longest sentence, so that nothing below the picture moves when the sentence changes.
    const twin = cap.cloneNode(false);
    twin.removeAttribute('id');
    twin.setAttribute('aria-hidden', 'true');
    twin.style.cssText = 'position:absolute;left:0;right:0;top:0;min-height:0;visibility:hidden;pointer-events:none';
    el.appendChild(twin);
    function reserve() {
      const list = inst.samples().sort((a, b) => b.length - a.length).slice(0, 6);
      let most = 0;
      for (const s of list) { twin.textContent = s; most = Math.max(most, tall(twin)); }
      twin.textContent = '';
      room = most;
      cap.style.minHeight = most ? `${most}px` : '';
    }

    // Play and Pause
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'play';
    btn.innerHTML = '<svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true" focusable="false"><path/></svg><span></span>';
    const paint = () => {
      btn.querySelector('path').setAttribute('d', api.auto ? ICON.pause : ICON.play);
      btn.querySelector('span').textContent = api.auto ? 'Pause' : 'Play';
      btn.setAttribute('aria-label', api.auto ? 'Pause the animation' : 'Play the animation');
    };
    paint();
    el.insertBefore(btn, canvas);
    function setAuto(on, freeze, first) {
      frozen = !on && Boolean(freeze);
      if (on) api.still = false;
      if (api.auto !== on) {
        api.auto = on;
        if (on) inst.play(Boolean(first)); else inst.pause();
        paint();
      }
      api.kick();
    }
    btn.addEventListener('click', () => setAuto(!api.auto, true));
    canvas.addEventListener('click', () => setAuto(!api.auto, true));
    // A control in the bar under the picture takes over from the tour.
    const hands = (e) => {
      if (!e.target.closest('button,input')) return;
      if (e.type === 'keydown' && ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(e.key)) return;
      setAuto(false, false);
    };
    ['pointerdown', 'keydown', 'input'].forEach((ev) => bar.addEventListener(ev, hands));

    function frame(now) {
      raf = 0;
      if (!w || !h) return;
      const dt = last ? clamp((now - last) / 1000, 0, 0.1) : 0;
      last = now;
      api.live = api.auto && inView;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, w, h);
      inst.draw(ctx, w, h, Math.max(0, (now - t0) / 1000), frozen || api.still ? 0 : dt); // a frame timestamp can precede t0 slightly
      if (visible && !frozen && !api.still) raf = requestAnimationFrame(frame); else last = 0;
    }
    function resize() {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      const wider = r.width !== w;
      w = r.width; h = r.height;
      canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
      if (wider) reserve();
      api.kick();
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) api.kick(); }, { rootMargin: '120px' }).observe(canvas);
      // The tour starts by itself the first time a good part of the picture is on screen.
      new IntersectionObserver((es) => {
        inView = es[0].isIntersecting;
        if (inView && !started && !reduce) { started = true; setAuto(true, false, true); }
      }, { threshold: 0.35 }).observe(canvas);
    } else { visible = inView = true; if (!reduce) { started = true; setAuto(true, false, true); } }
    el.classList.add('ready');
    resize();
  }
  document.querySelectorAll('.viz[data-viz]').forEach(mount);
})();
