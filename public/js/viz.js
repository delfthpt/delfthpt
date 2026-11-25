/* Delft High PT Lab: interactive illustrations on the equipment page.
   Plain canvas, no dependencies. Each illustration is registered in VIZ and mounted on
   <figure class="viz" data-viz="name">. Numbers are approximations for outreach, see the notes on the page. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  const INK = '#e8ecf3', MUTED = '#9aa6ba', LINE = '#2f3b55', ACCENT = '#ff8a3d', BLUE = '#5fc8ff';
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
  function slider(bar, o, onInput) {
    const l = document.createElement('label');
    const s = document.createElement('span');
    s.textContent = o.label;
    const i = document.createElement('input');
    i.type = 'range'; i.min = o.min; i.max = o.max; i.step = o.step; i.value = o.value;
    const out = document.createElement('output');
    out.textContent = o.fmt(o.value);
    i.addEventListener('input', () => { const v = parseFloat(i.value); out.textContent = o.fmt(v); onInput(v); });
    l.append(s, i, out);
    bar.appendChild(l);
    let lastV = o.value;
    return { set(v) { if (v === lastV) return; lastV = v; i.value = v; out.textContent = o.fmt(v); } };
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
    } else if (b.feat === 'earth') {
      for (let i = 0; i < 7; i++) {
        const a = r() * TAU, rad = Math.sqrt(r()) * R * 0.8;
        ctx.fillStyle = 'rgba(92,150,84,.8)';
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, R * (0.12 + r() * 0.2), R * (0.07 + r() * 0.12), r() * 3, 0, TAU); ctx.fill();
      }
      for (let i = 0; i < 7; i++) {
        const yy = cy - R * 0.8 + r() * R * 1.6;
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = R * (0.03 + r() * 0.05); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - R + r() * R, yy); ctx.quadraticCurveTo(cx, yy + (r() - 0.5) * R * 0.3, cx + r() * R, yy + (r() - 0.5) * R * 0.2); ctx.stroke();
      }
    } else if (b.feat === 'mars') {
      for (let i = 0; i < 6; i++) {
        const a = r() * TAU, rad = Math.sqrt(r()) * R * 0.75;
        ctx.fillStyle = 'rgba(86,32,16,.35)';
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, R * (0.14 + r() * 0.2), R * (0.07 + r() * 0.1), r() * 3, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.95, R * 0.34, R * 0.12, 0, 0, TAU); ctx.fill();
    }
    const s = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    s.addColorStop(0.45, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = s; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    ctx.restore();
  }

  /* ---------- 1. Piston cylinder press: pressure to depth ---------- */
  VIZ.press = (bar, api) => {
    const PMAX = 3.5, PMIN = 0.02;
    const CRUST = '#8d8474', MANTLE = '#6f8f4a', CORE = '#e0a13a';
    // p: pressure in GPa as a function of depth in km (table or function). layers: [name, bottom depth in km, colour]
    const B = {
      earth: { name: 'Earth', R: 6371, g: 9.81, c: ['#9cc9ff', '#2f6fb5', '#0d2a55'], feat: 'earth', seed: 5, glow: 'rgba(120,180,255,.35)',
        p: [[0, 0], [35, 1.0], [80, 2.45], [115, 3.6], [150, 4.8], [220, 7.1]],
        layers: [['Crust', 35, CRUST], ['Upper mantle', 410, MANTLE], ['Transition zone', 660, '#4f7a52'], ['Lower mantle', 2891, '#b5653a'], ['Outer core', 5150, CORE], ['Inner core', 6371, '#f6dc8c']],
        note: 'Most basaltic magmas on Earth form within this depth range.' },
      venus: { name: 'Venus', R: 6052, g: 8.87, c: ['#fbe9bd', '#d9a85c', '#6b3d16'], feat: 'bands', seed: 9, glow: 'rgba(255,200,120,.4)',
        p: [[0, 0], [30, 0.77], [150, 4.29]],
        layers: [['Crust', 30, CRUST], ['Mantle', 2850, MANTLE], ['Core', 6052, CORE]],
        note: 'Gravity on Venus is close to that of the Earth, so pressure builds up with depth almost as quickly.' },
      mars: { name: 'Mars', R: 3390, g: 3.72, c: ['#f0b08a', '#c0562c', '#4a1a0c'], feat: 'mars', seed: 3, glow: 'rgba(255,150,110,.2)',
        p: [[0, 0], [50, 0.54], [400, 4.97]],
        layers: [['Crust', 50, CRUST], ['Mantle', 1600, MANTLE], ['Core', 3390, CORE]],
        note: 'Mars has little more than a third of the gravity of the Earth, so the same pressure lies much deeper.' },
      moon: { name: 'Moon', R: 1737, g: 1.62, c: ['#e6e6e6', '#9a9a9e', '#3a3a40'], feat: 'craters', seed: 12,
        p: (d) => 4.71 * (1 - Math.pow((1737 - d) / 1737, 2)),
        layers: [['Crust', 40, CRUST], ['Mantle', 1400, MANTLE], ['Core', 1737, CORE]],
        note: 'At full pressure the press reaches more than halfway to the centre of the Moon.' },
      mercury: { name: 'Mercury', R: 2440, g: 3.70, c: ['#d8cfc4', '#8f857b', '#35302c'], feat: 'craters', seed: 21,
        p: [[0, 0], [35, 0.36], [420, 5.06]],
        layers: [['Crust', 35, CRUST], ['Mantle', 420, MANTLE], ['Core', 2440, CORE]],
        note: 'The rocky mantle of Mercury is only about 400 km thick, above a very large metallic core.' },
      titan: { name: 'Titan', R: 2575, g: 1.35, c: ['#ffd98a', '#d99632', '#5e370c'], feat: 'bands', seed: 4, glow: 'rgba(255,170,70,.4)',
        p: (d) => (d <= 500 ? interp([[0, 0], [100, 0.126], [350, 0.51], [500, 0.77]], d) : 0.77 + 9.089e-7 * (2075 * 2075 - Math.pow(2575 - d, 2))),
        layers: [['Ice shell', 100, '#cfe8f5'], ['Ocean', 350, '#3f8fd0'], ['High-pressure ice', 500, '#8fb8d6'], ['Rocky interior', 2575, '#8a6a4a']],
        note: 'Below the ice shell and internal ocean of Titan, the press reaches conditions deep inside its rocky interior.' },
      vesta: { name: 'Vesta', R: 263, g: 0.25, c: ['#d9d4cc', '#8d8880', '#33302c'], feat: 'craters', seed: 31,
        p: (d) => 0.115 * (1 - Math.pow((263 - d) / 263, 2)),
        layers: [['Crust', 20, CRUST], ['Mantle', 150, MANTLE], ['Core', 263, CORE]],
        note: '' },
      psyche: { name: 'Psyche', R: 111, g: 0.14, c: ['#e2e6ea', '#8b939c', '#2c3138'], feat: 'craters', seed: 44,
        p: (d) => 0.026 * (1 - Math.pow((111 - d) / 111, 2)),
        layers: [['Metal-rich interior', 111, '#9aa3ad']],
        note: '' },
    };
    const order = ['earth', 'venus', 'mars', 'moon', 'mercury', 'titan', 'vesta', 'psyche'];
    let key = 'earth', P = PMAX;

    const pAt = (b, d) => (typeof b.p === 'function' ? b.p(d) : interp(b.p, d));
    function dAt(b, p) {
      if (p >= pAt(b, b.R)) return b.R;
      let lo = 0, hi = b.R;
      for (let i = 0; i < 44; i++) { const m = (lo + hi) / 2; if (pAt(b, m) < p) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    const layerAt = (b, d) => (b.layers.find((l) => d <= l[1]) || b.layers[b.layers.length - 1])[0];
    const fmtKm = (d) => (d < 20 ? Math.round(d) : d < 500 ? Math.round(d / 5) * 5 : Math.round(d / 10) * 10).toLocaleString('en-US');

    const bset = segmented(bar, order.map((k) => [k, B[k].name]), key, (k) => { key = k; caption(); api.kick(); }, 'Planetary body');
    const sset = slider(bar, { label: 'Pressure', min: PMIN, max: PMAX, step: 0.02, value: P, fmt: (v) => `${v.toFixed(2)} GPa` }, (v) => { P = v; caption(); api.kick(); });

    function caption() {
      const b = B[key], d = dAt(b, P), pc = pAt(b, b.R);
      if (d >= b.R) {
        api.setCap(`The pressure at the very centre of ${b.name} is only about ${num(pc)} GPa. The press exceeds that many times over, so the conditions of the entire body are within reach.`);
      } else {
        api.setCap(`${P.toFixed(2)} GPa is the pressure about ${fmtKm(d)} km below the surface of ${b.name}, in the ${layerAt(b, d).toLowerCase()}. ${b.note}`.trim());
      }
    }
    caption();

    return {
      draw(ctx, w, h, t) {
        if (api.auto) {
          const cyc = 8, k = Math.floor(t / cyc) % order.length, u = (t % cyc) / cyc;
          if (order[k] !== key) { key = order[k]; bset.set(key); }
          P = +(PMIN + (PMAX - PMIN) * ease(clamp(u / 0.7, 0, 1))).toFixed(2);
          sset.set(P); caption();
        }
        const b = B[key], d = dAt(b, P), compact = w < 560;
        starfield(ctx, w, h, 3, compact ? 40 : 90);

        // title
        label(ctx, b.name, 16, compact ? 24 : 30, { size: compact ? 16 : 20, weight: 700 });
        label(ctx, `Radius ${b.R.toLocaleString('en-US')} km · surface gravity ${b.g} m/s²`, 16, compact ? 40 : 50, { size: compact ? 10.5 : 12.5, color: MUTED });

        // planet with a cutaway wedge facing the depth column
        const R = Math.min(w * 0.19, h * 0.33), cx = compact ? w * 0.22 : w * 0.25, cy = h * 0.57;
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

        // depth column: a magnified view of the part of the body the press can reach
        const colX = compact ? w * 0.5 : w * 0.54, colW = compact ? w * 0.16 : w * 0.15, y0 = compact ? 58 : 76, y1 = h - 26;
        const Dmax = Math.min(b.R, dAt(b, PMAX) * 1.18);
        const Y = (dd) => y0 + (dd / Dmax) * (y1 - y0);
        const rOut = R * (1 - Dmax / b.R);
        ctx.strokeStyle = 'rgba(154,166,186,.45)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(cx + R * Math.cos(a0), cy + R * Math.sin(a0)); ctx.lineTo(colX, y0);
        ctx.moveTo(cx + rOut * Math.cos(a1), cy + rOut * Math.sin(a1)); ctx.lineTo(colX, y1); ctx.stroke(); ctx.setLineDash([]);

        ctx.save();
        box(ctx, colX, y0, colW, y1 - y0, 8); ctx.clip();
        prev = 0;
        const fs = compact ? 10 : 12;
        for (const [name, bot, col] of b.layers) {
          if (prev >= Dmax) break;
          const ya = Y(prev), yb = Y(Math.min(bot, Dmax));
          ctx.fillStyle = col; ctx.fillRect(colX, ya, colW, yb - ya + 1);
          if (yb - ya > fs + 8 && measure(ctx, name, fs, 600) < colW - 8) label(ctx, name, colX + colW / 2, (ya + yb) / 2, { size: fs, weight: 600, color: '#10141d', align: 'center', base: 'middle' });
          prev = bot;
        }
        const heat = ctx.createLinearGradient(0, y0, 0, y1);
        heat.addColorStop(0, 'rgba(0,0,0,.2)'); heat.addColorStop(1, 'rgba(255,110,30,.22)');
        ctx.fillStyle = heat; ctx.fillRect(colX, y0, colW, y1 - y0);
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(colX, y0, colW, Y(d) - y0);
        ctx.restore();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1; box(ctx, colX, y0, colW, y1 - y0, 8); ctx.stroke();

        const step = niceStep(Dmax / 5);
        for (let dd = 0; dd <= Dmax + 1e-6; dd += step) {
          const yy = Y(dd);
          ctx.strokeStyle = MUTED; ctx.beginPath(); ctx.moveTo(colX - 5, yy); ctx.lineTo(colX, yy); ctx.stroke();
          label(ctx, dd === 0 ? '0 km' : dd.toLocaleString('en-US'), colX - 8, yy, { size: compact ? 9.5 : 11, color: MUTED, align: 'right', base: 'middle' });
        }
        if (Dmax >= b.R) label(ctx, 'centre', colX + colW / 2, y1 + 14, { size: compact ? 9.5 : 11, color: MUTED, align: 'center' });

        // marker
        const ym = Y(d);
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.shadowColor = ACCENT; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(colX - 6, ym); ctx.lineTo(colX + colW + 6, ym); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.arc(colX + colW / 2, ym, 5 + (reduce ? 0 : 1.5 * Math.sin(t * 3)), 0, TAU); ctx.fill();
        const lx = colX + colW + 14, ly = clamp(ym, y0 + 14, y1 - 34);
        label(ctx, `${P.toFixed(2)} GPa`, lx, ly, { size: compact ? 14 : 20, weight: 700, color: ACCENT });
        label(ctx, d >= b.R ? 'centre of the body' : `≈ ${fmtKm(d)} km deep`, lx, ly + (compact ? 16 : 22), { size: compact ? 11.5 : 15 });
        label(ctx, layerAt(b, d), lx, ly + (compact ? 31 : 42), { size: compact ? 10.5 : 13, color: MUTED });
        if (!compact) label(ctx, 'Depth below the surface', colX, y0 - 12, { size: 11.5, color: MUTED });
      },
    };
  };

  /* ---------- 2. Rheometer: viscosity and lava flow ---------- */
  VIZ.rheometer = (bar, api) => {
    const G = {
      venus: { name: 'Venus', g: 8.87, sky: ['#2c1e0e', '#b07f35'], ground: ['#6a4526', '#24150a'] },
      earth: { name: 'Earth', g: 9.81, sky: ['#0a1730', '#44688f'], ground: ['#3c3b3a', '#141414'] },
      mars: { name: 'Mars', g: 3.72, sky: ['#2e1c14', '#b78a66'], ground: ['#7d3f23', '#32160b'] },
      moon: { name: 'Moon', g: 1.62, sky: ['#02030a', '#070a12'], ground: ['#77777b', '#26262a'], stars: true },
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
    let key = 'venus', L = 1.5, front = reduce ? 0.75 : 0, hold = 0, last = 0, preset = -1;

    const fmtEta = (l) => {
      const eta = Math.pow(10, l);
      if (l >= 6) { const e = Math.floor(l), m = eta / Math.pow(10, e); return `${m < 1.5 ? '' : `${Math.round(m)} × `}10${sup(e)} Pa·s`; }
      return `${num(eta, 1)} Pa·s`;
    };
    function calc() {
      const g = G[key].g, eta = Math.pow(10, L), rho = L < -2 ? 7000 : L < 0 ? 2300 : 2700;
      const v = (rho * g * 0.01745) / (3 * eta); // laminar sheet, 1 m thick, 1 degree slope
      return { v, Re: (rho * v) / eta };
    }
    function fmtSpeed(v) {
      if (v >= 1) return `${num(v)} m per second`;
      if (v >= 0.01) return `${num(v * 100)} cm per second`;
      if (v * 3600 >= 1) return `${num(v * 3600)} m per hour`;
      if (v * 86400 >= 1) return `${num(v * 86400)} m per day`;
      if (v * 31557600 >= 1) return `${num(v * 31557600)} m per year`;
      return `${num(v * 31557600 * 100)} cm per year`;
    }

    const bset = segmented(bar, order.map((k) => [k, G[k].name]), key, (k) => { key = k; restart(); }, 'Planetary body');
    const sset = slider(bar, { label: 'Viscosity', min: -3, max: 10, step: 0.5, value: L, fmt: fmtEta }, (v) => { L = v; restart(); });
    function restart() { if (!reduce) { front = 0; hold = 0; } caption(); api.kick(); }
    function caption() {
      const c = calc(), cat = cats.find((k) => L >= k[0] && L < k[1]) || cats[cats.length - 1], S = G[key];
      const speed = c.Re > 2000
        ? `On ${S.name} a sheet 1 m thick would rush down even a 1° slope in fast, turbulent flow.`
        : `On ${S.name} a sheet 1 m thick on a 1° slope would advance roughly ${fmtSpeed(c.v)}.`;
      api.setCap(`${cat[2]}: ${cat[3]} ${speed}`);
    }
    caption();

    return {
      draw(ctx, w, h, t) {
        const dt = Math.min(0.05, Math.max(0, t - last)); last = t;
        if (api.auto) {
          const k = Math.floor(t / 7) % presets.length;
          if (k !== preset) { preset = k; key = presets[k][0]; L = presets[k][1]; bset.set(key); sset.set(L); front = 0; hold = 0; caption(); }
        }
        const S = G[key], c = calc(), compact = w < 560;
        const n = clamp((Math.log10(Math.min(c.v, 10)) + 9.7) / 10.7, 0, 1);
        if (!reduce) {
          if (hold > 0) { hold -= dt; if (hold <= 0) front = 0; } else { front += (0.03 + 0.55 * Math.pow(n, 1.6)) * dt; if (front >= 1) { front = 1; hold = 1.3; } }
        }

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
          const wob = reduce ? 1 : 1 + 0.07 * Math.sin(x * 0.06 - t * (0.6 + 5 * n));
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
          const ph = (fr() + (reduce ? 0 : t * (0.02 + 0.25 * n))) % 1, off = 0.35 + fr() * 0.5, sz = 2 + fr() * (compact ? 4 : 7);
          const x = lerp(x0 + 14, xf - 4, ph);
          if (x >= xf - 6) continue;
          const yt = top(x), yg = base(x);
          ctx.fillStyle = 'rgba(46,14,6,.6)';
          ctx.beginPath(); ctx.ellipse(x, lerp(yg, yt, off), sz, sz * 0.45, 0.12, 0, TAU); ctx.fill();
        }
        // fountain at the vent
        if (!reduce) {
          for (let i = 0; i < 6; i++) {
            const ph = (t * (0.8 + n) + i / 6) % 1;
            ctx.fillStyle = `rgba(255,220,130,${(1 - ph).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(vx + Math.sin(i * 2.4) * 7 * ph, ground(vx) - vh - ph * (10 + 22 * n), 2.2 * (1 - ph) + 0.6, 0, TAU); ctx.fill();
          }
        }

        // title
        label(ctx, S.name, 16, compact ? 24 : 30, { size: compact ? 16 : 20, weight: 700 });
        label(ctx, `Surface gravity ${S.g} m/s²`, 16, compact ? 40 : 50, { size: compact ? 10.5 : 12.5, color: 'rgba(232,236,243,.75)' });

        // inset: the spindle of the rheometer turning in the melt
        const bw = compact ? 92 : 132, bh = compact ? 84 : 116, bx = w - bw - 12, by = 12;
        ctx.fillStyle = 'rgba(7,10,16,.78)'; box(ctx, bx, by, bw, bh, 10); ctx.fill();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1; box(ctx, bx, by, bw, bh, 10); ctx.stroke();
        const ccx = bx + bw / 2, cupW = bw * 0.46, cupTop = by + bh * 0.3, cupBot = by + bh * 0.74;
        ctx.fillStyle = hotB;
        ctx.fillRect(ccx - cupW / 2 + 3, cupTop + 8, cupW - 6, cupBot - cupTop - 11);
        ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(ccx - cupW / 2, cupTop); ctx.lineTo(ccx - cupW / 2, cupBot); ctx.lineTo(ccx + cupW / 2, cupBot); ctx.lineTo(ccx + cupW / 2, cupTop); ctx.stroke();
        const bobW = cupW * 0.42, bobTop = cupTop + 14, bobH = cupBot - bobTop - 10;
        ctx.fillStyle = '#e9edf3'; ctx.fillRect(ccx - 2, by + 8, 4, bobTop - by - 8);
        ctx.fillRect(ccx - bobW / 2, bobTop, bobW, bobH);
        ctx.save(); ctx.beginPath(); ctx.rect(ccx - bobW / 2, bobTop, bobW, bobH); ctx.clip();
        const off = reduce ? 0 : (t * (6 + 60 * n)) % 8;
        ctx.fillStyle = 'rgba(40,50,70,.45)';
        for (let x = ccx - bobW / 2 - 8 + off; x < ccx + bobW / 2; x += 8) ctx.fillRect(x, bobTop, 3, bobH);
        ctx.restore();
        label(ctx, 'Spindle in the melt', ccx, by + bh - 8, { size: compact ? 9.5 : 11, color: MUTED, align: 'center' });

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
  const minus = (v) => String(v).replace('-', '−'); // typographic minus sign for negative temperatures

  VIZ.sta = (bar, api) => {
    let z = 0;
    const sset = slider(bar, { label: 'Altitude above the surface of Venus', min: 0, max: 70, step: 1, value: z, fmt: (v) => `${v} km` }, (v) => { z = v; caption(); api.kick(); });
    const inside = (T, P) => T >= 20 && T <= 1200 && P >= 1 && P <= 150;
    function caption() {
      const T = Math.round(venusT(z)), P = venusP(z);
      if (z === 0) api.setCap('The surface of Venus: about 460 °C and 92 bar, hot enough to melt lead and as heavy as the ocean 900 m down. This lies well inside the range of the instrument.');
      else if (inside(T, P)) api.setCap(`Venus at ${z} km altitude: about ${minus(T)} °C and ${fmtP(P)} bar. Still inside the range of the instrument, so this layer of the atmosphere can be reproduced directly.`);
      else api.setCap(`Venus at ${z} km altitude: about ${minus(T)} °C and ${fmtP(P)} bar. This is the cloud region, cooler and thinner than the instrument is built for.`);
    }
    caption();
    const refs = [['Earth', 15, 1.013, '#5fa8ff'], ['Mars', -63, 0.006, '#d0683e'], ['Titan', -179, 1.47, '#e0a040']];

    return {
      draw(ctx, w, h, t) {
        if (api.auto) { z = Math.round(35 - 35 * Math.cos(t * 0.35)); sset.set(z); caption(); }
        const compact = w < 560;
        const L = compact ? 44 : 64, Rm = compact ? 12 : 24, T0 = compact ? 16 : 24, Bm = compact ? 36 : 46;
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
          if (major) label(ctx, String(T).replace('-', '−'), X(T), h - Bm + 16, { size: compact ? 10 : 12, color: MUTED, align: 'center' });
        }
        for (let e = -3; e <= 3; e++) {
          ctx.strokeStyle = 'rgba(47,59,85,.9)';
          ctx.beginPath(); ctx.moveTo(L, Y(Math.pow(10, e))); ctx.lineTo(w - Rm, Y(Math.pow(10, e))); ctx.stroke();
          label(ctx, e < 0 ? String(Math.pow(10, e)) : Math.pow(10, e).toLocaleString('en-US'), L - 6, Y(Math.pow(10, e)), { size: compact ? 10 : 12, color: MUTED, align: 'right', base: 'middle' });
        }
        label(ctx, 'Temperature (°C)', (L + w - Rm) / 2, h - 8, { size: compact ? 10.5 : 12.5, color: MUTED, align: 'center' });
        ctx.save(); ctx.translate(compact ? 11 : 16, (T0 + h - Bm) / 2); ctx.rotate(-Math.PI / 2);
        label(ctx, 'Pressure (bar)', 0, 0, { size: compact ? 10.5 : 12.5, color: MUTED, align: 'center' }); ctx.restore();

        // instrument range
        const ex0 = X(20), ex1 = X(1200), ey0 = Y(150), ey1 = Y(1);
        const pulse = reduce ? 0.14 : 0.12 + 0.04 * Math.sin(t * 1.5);
        ctx.fillStyle = `rgba(255,138,61,${pulse.toFixed(3)})`; ctx.fillRect(ex0, ey0, ex1 - ex0, ey1 - ey0);
        ctx.strokeStyle = ACCENT; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5; ctx.strokeRect(ex0, ey0, ex1 - ex0, ey1 - ey0); ctx.setLineDash([]);
        label(ctx, compact ? 'Instrument range' : 'Range of the Venus Surface Simulator', ex1 - 8, ey1 - (compact ? 20 : 26), { size: compact ? 10.5 : 13, weight: 600, color: ACCENT, align: 'right' });
        label(ctx, 'up to 1200 °C and 150 bar', ex1 - 8, ey1 - (compact ? 7 : 9), { size: compact ? 9.5 : 12, color: ACCENT, align: 'right' });

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
        for (const zz of compact ? [0, 40, 60] : [0, 20, 40, 60]) {
          const xx = X(venusT(zz)), yy = Y(venusP(zz));
          ctx.fillStyle = '#0b0e14'; ctx.strokeStyle = '#ffe2a8'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(xx, yy, 3, 0, TAU); ctx.fill(); ctx.stroke();
          if (zz === 0) label(ctx, 'Venus surface', xx + 9, yy + 4, { size: compact ? 9.5 : 11.5, color: '#ffe2a8' });
          else if (Math.abs(zz - z) > 4) label(ctx, `${zz} km`, xx + 9, yy + 13, { size: compact ? 9.5 : 11.5, color: '#ffe2a8' });
        }
        // marker
        const mx = X(venusT(z)), my = Y(venusP(z)), pr = 8 + (reduce ? 0 : 2.5 * Math.sin(t * 3));
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(mx, my, pr, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, TAU); ctx.fill();
        const txt = `Venus, ${z} km: ${minus(Math.round(venusT(z)))} °C, ${fmtP(venusP(z))} bar`;
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
    let co = 5, T = 1200, so2 = false;
    const r = rng(11);
    const parts = Array.from({ length: 110 }, () => ({ x: r(), y: r(), u: r(), s: 0.5 + r() * 0.9, p: r() * TAU }));
    function calc(c = co) {
      const Tk = T + 273.15, ratio = (100 - c) / c;
      const logf = 2 * Math.log10(ratio) - 29502 / Tk + 9.069; // CO + 1/2 O2 = CO2, ideal gas at 1 bar
      const iw = -27489 / Tk + 6.702, qfm = -25096.3 / Tk + 8.735;
      return { logf, dIW: logf - iw, qfmIW: qfm - iw };
    }
    const sco = slider(bar, { label: 'CO in the CO₂–CO mixture', min: 0.5, max: 99.5, step: 0.5, value: co, fmt: (v) => `${v}%` }, (v) => { co = v; caption(); api.kick(); });
    slider(bar, { label: 'Temperature', min: 900, max: 1500, step: 10, value: T, fmt: (v) => `${v} °C` }, (v) => { T = v; caption(); api.kick(); });
    toggle(bar, 'Add SO₂', (on) => { so2 = on; caption(); api.kick(); });
    const signed = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;
    function caption() {
      const c = calc(), d = c.dIW;
      const where = d < -3 ? 'Strongly reduced, approaching the conditions under which Mercury formed.'
        : d < -1 ? 'Reduced conditions where metallic iron is stable, as in the interiors of the Moon and the asteroid Vesta.'
        : d < 1.5 ? 'Close to the iron–wüstite buffer, like the more reduced magmas of Mars.'
        : d < 3.5 ? 'In the range shared by Martian magmas and the more reduced parts of the upper mantle of the Earth.'
        : d < 5 ? 'Like the upper mantle of the Earth, near the quartz–fayalite–magnetite buffer.'
        : 'More oxidised than most mantle rocks, towards the conditions of planetary surfaces.';
      api.setCap(`${num(100 - co, 3)}% CO₂ with ${num(co, 3)}% CO at ${T} °C gives log fO₂ ≈ ${c.logf.toFixed(1).replace('-', '−')}, or IW ${signed(d)}. ${where}${so2 ? ' With SO₂ added, sulfur enters the gas as well, as in the atmosphere of Venus. The value shown is for the CO₂–CO part only.' : ''}`);
    }
    caption();
    const hot = (Tc) => { const u = clamp((Tc - 900) / 600, 0, 1); return u < 0.5 ? mix('ff4a1a', 'ffa23a', u * 2) : mix('ffa23a', 'fff0b0', (u - 0.5) * 2); };
    const bodies = [['Upper mantle of the Earth', 1.5, 5, '#5fa8ff'], ['Mars', -1, 3.5, '#d0683e'], ['Moon', -2, 0, '#b9bcc4'], ['Vesta', -2.5, -1, '#9c948a'], ['Mercury', -7, -3, '#c9b79c']];

    return {
      draw(ctx, w, h, t) {
        if (api.auto) { co = Math.round(Math.exp(lerp(Math.log(1), Math.log(95), 0.5 - 0.5 * Math.cos(t * 0.4))) * 2) / 2; sco.set(co); caption(); }
        const compact = w < 560, c = calc();
        ctx.fillStyle = '#070a10'; ctx.fillRect(0, 0, w, h);

        /* left: the furnace tube */
        const px0 = compact ? w * 0.09 : w * 0.07, pw = compact ? w * 0.15 : w * 0.11, py0 = h * 0.08, py1 = h * 0.9;
        const fy0 = h * 0.26, fy1 = h * 0.72, cxm = px0 + pw / 2, cym = (fy0 + fy1) / 2, pad = compact ? 12 : 22;
        const glowC = hot(T);
        ctx.fillStyle = '#232a38'; box(ctx, px0 - pad, fy0, pw + 2 * pad, fy1 - fy0, 8); ctx.fill();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1; box(ctx, px0 - pad, fy0, pw + 2 * pad, fy1 - fy0, 8); ctx.stroke();
        for (let i = 0; i < 7; i++) { // heating elements
          const yy = lerp(fy0 + 12, fy1 - 12, i / 6);
          ctx.strokeStyle = glowC; ctx.globalAlpha = 0.55 + (reduce ? 0 : 0.2 * Math.sin(t * 2 + i)); ctx.lineWidth = 2.5;
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
          const yy = lerp(py1 - 6, py0 + 6, (p.y + (reduce ? 0 : t * 0.07 * p.s)) % 1);
          const xx = px0 + pw * (0.16 + 0.68 * p.x) + (reduce ? 0 : Math.sin(t * 2 + p.p) * 2.5);
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
        if (!compact) label(ctx, `${T} °C`, px0 + pw + pad + 8, cym + 4, { size: 13, weight: 600, color: glowC });

        /* right: where this mixture sits on the redox scale */
        const ax0 = compact ? w * 0.36 : w * 0.3, ax1 = w - (compact ? 12 : 26), ay = h * (compact ? 0.84 : 0.82);
        const AX = (d) => lerp(ax0, ax1, (d + 8) / 16);
        const rowTop = h * (compact ? 0.2 : 0.2), rh = (ay - rowTop - 22) / bodies.length;
        // legend
        const lg = [['CO₂', '#a9bde0'], ['CO', ACCENT]].concat(so2 ? [['SO₂', '#f2e24a']] : []);
        let lx = ax0;
        for (const [name, col] of lg) {
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx + 5, compact ? 16 : 24, 4.5, 0, TAU); ctx.fill();
          label(ctx, name, lx + 14, (compact ? 16 : 24) + 4, { size: compact ? 11 : 13 });
          lx += measure(ctx, name, compact ? 11 : 13) + 30;
        }
        // buffers
        for (const [name, d] of [['IW', 0], ['QFM', c.qfmIW]]) {
          ctx.strokeStyle = 'rgba(154,166,186,.55)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(AX(d), rowTop - 6); ctx.lineTo(AX(d), ay); ctx.stroke(); ctx.setLineDash([]);
          label(ctx, name, AX(d), ay + (compact ? 26 : 30), { size: compact ? 9.5 : 11, color: MUTED, align: 'center' });
        }
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
          label(ctx, d > 0 ? `+${d}` : String(d).replace('-', '−'), AX(d), ay + 15, { size: compact ? 9.5 : 11, color: MUTED, align: 'center' });
        }
        label(ctx, compact ? '← reduced      oxidised →' : '← more reduced          log fO₂ relative to the iron–wüstite buffer          more oxidised →', (ax0 + ax1) / 2, h - (compact ? 5 : 8), { size: compact ? 9.5 : 11.5, color: MUTED, align: 'center' });
        // range reachable with CO2-CO mixtures at this temperature
        const lo = calc(99.5).dIW, hi = calc(0.5).dIW;
        ctx.strokeStyle = BLUE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(AX(lo), ay - 8); ctx.lineTo(AX(hi), ay - 8); ctx.moveTo(AX(lo), ay - 12); ctx.lineTo(AX(lo), ay - 4); ctx.moveTo(AX(hi), ay - 12); ctx.lineTo(AX(hi), ay - 4); ctx.stroke();
        if (!compact) label(ctx, 'range of CO₂–CO mixtures at this temperature', AX(lo), ay - 14, { size: 11, color: BLUE });
        // marker
        const mx = AX(clamp(c.dIW, -8, 8));
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.shadowColor = ACCENT; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(mx, rowTop - 14); ctx.lineTo(mx, ay); ctx.stroke(); ctx.shadowBlur = 0;
        const txt = `IW ${signed(c.dIW)}`, fz = compact ? 12 : 15, tw = measure(ctx, txt, fz, 700) + 16;
        const tx = clamp(mx - tw / 2, ax0, ax1 - tw), ty = rowTop - 14 - fz - 12;
        ctx.fillStyle = ACCENT; box(ctx, tx, ty, tw, fz + 10, 6); ctx.fill();
        label(ctx, txt, tx + 8, ty + fz + 2, { size: fz, weight: 700, color: '#1a0f05' });
      },
    };
  };

  /* ---------- 5. Venus clouds and ionic liquids ---------- */
  VIZ.clouds = (bar, api) => {
    let z = 55;
    const sset = slider(bar, { label: 'Altitude', min: 42, max: 73, step: 0.5, value: z, fmt: (v) => `${v} km` }, (v) => { z = v; caption(); api.kick(); });
    function caption() {
      const T = Math.round(venusT(z)), P = fmtP(venusP(z));
      const s = `At ${z} km: about ${String(T).replace('-', '−')} °C and ${P} bar. `;
      api.setCap(s + (z < 47.5 ? 'Below the clouds it is too hot for droplets of sulfuric acid, which evaporate into a thin haze.'
        : z < 50.5 ? 'The lower cloud deck: the densest part of the clouds, with the largest droplets.'
        : z < 56.5 ? 'The middle cloud deck: near 55 km the temperature is close to room temperature and the pressure about half that at sea level on Earth.'
        : z <= 70 ? 'The upper cloud deck: below freezing, and swept around the planet by winds of roughly 100 m/s.'
        : 'Above the cloud tops: thin haze and the cold upper atmosphere.'));
    }
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

    return {
      draw(ctx, w, h, t) {
        if (api.auto) { z = Math.round((57.5 - 13.5 * Math.cos(t * 0.3)) * 2) / 2; sset.set(z); caption(); }
        const compact = w < 560;
        const YA = (alt) => lerp(h, 0, (alt - 40) / 35);
        const bg = ctx.createLinearGradient(0, YA(75), 0, YA(40));
        [[0, '#0b0d1a'], [5 / 35, '#3d3a52'], [13 / 35, '#d6c48f'], [20 / 35, '#e0b666'], [26 / 35, '#b97830'], [31 / 35, '#7a4318'], [1, '#48240e']].forEach(([s, c]) => bg.addColorStop(s, c));
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        const nD = compact ? 130 : drops.length;
        for (let i = 0; i < nD; i++) {
          const d = drops[i], sp = (10 + 30 * (d.alt - 40) / 35) / w;
          const x = ((d.x + (reduce ? 0 : t * sp)) % 1) * (w + 20) - 10;
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

        // inset: how an ionic liquid forms
        const iw = compact ? w * 0.47 : w * 0.31, ih = compact ? h * 0.6 : h - 32, ix = w - iw - (compact ? 8 : 16), iy = compact ? 8 : 16;
        ctx.fillStyle = 'rgba(8,11,18,.86)'; box(ctx, ix, iy, iw, ih, 12); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; box(ctx, ix, iy, iw, ih, 12); ctx.stroke();
        label(ctx, compact ? 'From acid to ionic liquid' : 'How an ionic liquid forms', ix + 12, iy + (compact ? 20 : 26), { size: compact ? 11 : 14, weight: 700 });
        const cyc = 9, ph = reduce ? 8 : t % cyc, stage = Math.min(2, Math.floor(ph / 3)), u = (ph % 3) / 3;
        const dcx = ix + iw / 2, dcy = iy + ih * (compact ? 0.47 : 0.42), R0 = Math.min(iw, ih) * (compact ? 0.2 : 0.2);
        const R = stage === 0 ? R0 : stage === 1 ? lerp(R0, R0 * 0.62, ease(u)) : R0 * 0.62;
        const colU = stage === 0 ? 0 : stage === 1 ? ease(u) : 1;
        const dcol = mix('f2d94a', '3fd0c0', colU);
        if (stage === 1) { // acid vapour leaving the droplet
          for (let i = 0; i < 10; i++) {
            const pu = (u * 1.6 + i / 10) % 1;
            ctx.fillStyle = `rgba(242,217,74,${(0.7 * (1 - pu)).toFixed(2)})`;
            ctx.beginPath(); ctx.arc(dcx + Math.sin(i * 1.9) * R * (0.6 + pu * 0.5), dcy - R - pu * ih * 0.2, 2.4, 0, TAU); ctx.fill();
          }
        }
        ctx.fillStyle = dcol; ctx.shadowColor = dcol; ctx.shadowBlur = stage === 2 ? 22 : 10;
        ctx.beginPath(); ctx.arc(dcx, dcy, R, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(dcx - R * 0.35, dcy - R * 0.4, R * 0.22, R * 0.13, -0.6, 0, TAU); ctx.fill();
        for (let i = 0; i < 6; i++) { // organic molecules
          const ang = (i / 6) * TAU + 0.4, dist = stage === 0 ? lerp(R0 * 2.3, R0 * 0.5, ease(u)) : R * 0.55;
          ctx.fillStyle = '#4a7dff'; ctx.strokeStyle = '#0b0e14'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(dcx + Math.cos(ang) * dist, dcy + Math.sin(ang) * dist * 0.9, compact ? 3 : 4, 0, TAU); ctx.fill(); ctx.stroke();
        }
        const ty = iy + ih * (compact ? 0.74 : 0.7);
        label(ctx, `${stage + 1}`, ix + 12, ty, { size: compact ? 18 : 26, weight: 700, color: dcol });
        wrap(ctx, steps[stage], ix + (compact ? 28 : 36), ty - (compact ? 7 : 10), iw - (compact ? 36 : 48), compact ? 13 : 17, { size: compact ? 10.5 : 13 });
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i === stage ? '#fff' : 'rgba(255,255,255,.3)';
          ctx.beginPath(); ctx.arc(dcx + (i - 1) * 14, iy + ih - 12, 3, 0, TAU); ctx.fill();
        }

        // balloon probe at the chosen altitude, with a read-out
        const bx = compact ? w * 0.3 : w * 0.34, bob = reduce ? 0 : Math.sin(t * 1.6) * 2.5, br = compact ? 8 : 11;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx, my + bob - br * 0.2); ctx.lineTo(bx, my + bob + br * 1.5); ctx.stroke();
        ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.arc(bx, my + bob - br, br, 0, TAU); ctx.fill();
        ctx.fillStyle = ACCENT; ctx.fillRect(bx - 3.5, my + bob + br * 1.5, 7, 6);
        const txt = `${z} km · ${String(Math.round(venusT(z))).replace('-', '−')} °C · ${fmtP(venusP(z))} bar`;
        const fz = compact ? 11 : 14, tw = measure(ctx, txt, fz, 600) + 16;
        const tx = compact ? w - tw - 8 : bx + br + 12, tyy = compact ? h - fz - 20 : clamp(my - fz - 20, 6, h - fz - 16);
        ctx.fillStyle = 'rgba(8,11,18,.88)'; box(ctx, tx, tyy, tw, fz + 12, 6); ctx.fill();
        label(ctx, txt, tx + 8, tyy + fz + 4, { size: fz, weight: 600 });
      },
    };
  };

  /* ---------- mounting ---------- */
  function mount(el) {
    const def = VIZ[el.dataset.viz];
    const canvas = el.querySelector('canvas');
    if (!def || !canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const bar = el.querySelector('.bar'), cap = el.querySelector('.cap');
    let w = 0, h = 0, raf = 0, visible = false;
    const t0 = performance.now();
    const api = {
      auto: !reduce,
      kick() { if (!raf) raf = requestAnimationFrame(frame); },
      setCap(s) { if (cap.textContent !== s) cap.textContent = s; },
    };
    const stop = () => { api.auto = false; };
    ['pointerdown', 'keydown', 'input'].forEach((ev) => bar.addEventListener(ev, stop));
    canvas.addEventListener('pointerdown', stop);
    const inst = def(bar, api);
    function frame(now) {
      raf = 0;
      if (!w || !h) return;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, w, h);
      inst.draw(ctx, w, h, Math.max(0, (now - t0) / 1000)); // a frame timestamp can precede t0 slightly
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }
    function resize() {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      w = r.width; h = r.height;
      canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
      api.kick();
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) api.kick(); }, { rootMargin: '120px' }).observe(canvas);
    } else visible = true;
    el.classList.add('ready');
    resize();
  }
  document.querySelectorAll('.viz[data-viz]').forEach(mount);
})();
