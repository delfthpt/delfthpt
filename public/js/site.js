/* Delft High PT Lab: navigation, home page animation, counters and scroll reveals. No dependencies. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- mobile navigation ---- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---- keep review mode while moving between pages ---- */
  if (document.documentElement.classList.contains('review')) {
    document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (/^https?:/.test(href) || href.includes('review=')) return;
      const [path, hash] = href.split('#');
      a.setAttribute('href', `${path}?review=1${hash ? `#${hash}` : ''}`);
    });
  }

  /* ---- scroll reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---- animated counters ---- */
  const counters = document.querySelectorAll('[data-count]');
  const fmt = (v, dec) => (dec ? v.toFixed(dec) : String(Math.round(v)));
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target;
        const end = parseFloat(el.dataset.count);
        const dec = parseInt(el.dataset.dec || '0', 10);
        const t0 = performance.now();
        const dur = 1400;
        const step = (now) => {
          const u = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - u, 3);
          el.textContent = fmt(end * eased, dec);
          if (u < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.4 });
    counters.forEach((el) => io.observe(el));
  }

  /* ---- rotating questions with a typing effect ---- */
  const q = document.getElementById('q');
  if (q) {
    let list = [];
    try { list = JSON.parse(q.dataset.questions || '[]'); } catch (e) { list = []; }
    if (list.length > 1) {
      let i = 0;
      if (reduce) {
        setInterval(() => { i = (i + 1) % list.length; q.textContent = list[i]; }, 7000);
      } else {
        q.classList.add('typing');
        const type = (text, n, done) => {
          q.textContent = text.slice(0, n);
          if (n < text.length) setTimeout(() => type(text, n + 1, done), 28 + Math.random() * 30);
          else setTimeout(done, 3800);
        };
        const erase = (done) => {
          const text = q.textContent;
          if (text.length === 0) { done(); return; }
          q.textContent = text.slice(0, -2);
          setTimeout(() => erase(done), 12);
        };
        const next = () => erase(() => { i = (i + 1) % list.length; type(list[i], 1, next); });
        setTimeout(next, 4200);
      }
    }
  }

  /* ---- hero canvas: a slowly turning planet under a field of stars ---- */
  const canvas = document.getElementById('hero-canvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0, visible = true;
    // small deterministic random generator so the sky looks the same on every visit
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const stars = Array.from({ length: 170 }, () => ({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 1.1, p: rnd() * 6.28, s: 0.4 + rnd() * 1.2 }));
    // latitude of each cloud band in radians, from near the limb (low) to near the pole of view (high)
    const bands = Array.from({ length: 18 }, (_, k) => ({ lat: 0.3 + k * 0.066 + (rnd() - 0.5) * 0.03, a: 0.05 + rnd() * 0.09, wd: 5 + rnd() * 16, sp: 5 + rnd() * 9, dash: 60 + rnd() * 180, tone: rnd() }));

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
      kick();
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

    function draw(now) {
      raf = 0;
      if (!w || !h) return;
      const t = Math.max(0, now / 1000);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#04060b'); sky.addColorStop(1, '#0b0e14');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(s.p + t * s.s));
        ctx.fillStyle = `rgba(226,232,245,${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h * 0.9, s.r, 0, 6.2832); ctx.fill();
      }

      // planet: only its upper limb is in view
      const narrow = w < 760;
      const R = narrow ? Math.max(w * 0.95, h * 0.7) : Math.max(h * 1.05, w * 0.42);
      const cx = narrow ? w * 0.62 : w * 0.76;
      const cy = (narrow ? h * 0.5 : h * 0.34) + R;

      // atmosphere glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.985, cx, cy, R * 1.09);
      glow.addColorStop(0, 'rgba(255,190,110,.55)');
      glow.addColorStop(0.35, 'rgba(255,150,70,.16)');
      glow.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.09, 0, 6.2832); ctx.fill();

      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.clip();
      const body = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.75, R * 0.05, cx, cy, R * 1.02);
      body.addColorStop(0, '#f6e2b4'); body.addColorStop(0.35, '#dba95f'); body.addColorStop(0.7, '#9a5a26'); body.addColorStop(1, '#3a1c0c');
      ctx.fillStyle = body; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      // drifting cloud bands, drawn as latitude circles seen from slightly above
      const tilt = 0.2;
      for (const b of bands) {
        const lat = Math.min(b.lat, 1.5);
        const rx = Math.max(1, R * Math.cos(lat)), ry = rx * tilt, yy = cy - R * Math.sin(lat);
        const col = b.tone > 0.5 ? '255,244,214' : '120,62,22';
        ctx.lineCap = 'round'; ctx.shadowColor = `rgba(${col},.5)`; ctx.shadowBlur = 14;
        // a faint continuous band, plus long streaks that drift with the wind
        ctx.setLineDash([]); ctx.lineWidth = b.wd * 1.6; ctx.strokeStyle = `rgba(${col},${(b.a * 0.45).toFixed(3)})`;
        ctx.beginPath(); ctx.ellipse(cx, yy, rx, ry, 0, 0, Math.PI); ctx.stroke();
        ctx.lineWidth = b.wd * 0.7; ctx.strokeStyle = `rgba(${col},${(b.a * 0.8).toFixed(3)})`;
        ctx.setLineDash([b.dash * 3, b.dash * 2.2]);
        ctx.lineDashOffset = reduce ? 0 : -t * b.sp;
        ctx.beginPath(); ctx.ellipse(cx, yy, rx, ry, 0, 0, Math.PI); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
      // night side
      const shade = ctx.createLinearGradient(cx - R, cy - R, cx + R * 0.9, cy - R * 0.2);
      shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(0.55, 'rgba(0,0,0,.08)'); shade.addColorStop(1, 'rgba(4,6,11,.78)');
      ctx.fillStyle = shade; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();

      if (visible && !reduce) raf = requestAnimationFrame(draw);
    }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(canvas);
    }
    resize();
  }
})();
