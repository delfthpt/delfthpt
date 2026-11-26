/* Delft High PT Lab: navigation, home page animation, counters, scroll reveals, photos that open large
   and the frames around long publication lists. No dependencies. */
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
    document.querySelectorAll('a[href^="/"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (/^\/(img|css|js)\//.test(href) || href.includes('review=')) return; // pages only, not files
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
  // Before a question is typed, the browser lays out the whole sentence once and the line breaks are read off.
  // Each line then keeps its words, and the letters are only revealed one by one, so a written word never moves.
  const q = document.getElementById('q');
  if (q) {
    let list = [];
    try { list = JSON.parse(q.dataset.questions || '[]'); } catch (e) { list = []; }
    if (list.length > 1) {
      let i = 0;
      if (reduce) {
        setInterval(() => { i = (i + 1) % list.length; q.textContent = list[i]; }, 7000);
      } else {
        const el = (tag, cls) => { const e = document.createElement(tag); e.className = cls; return e; };
        const spoken = el('span', 'sr');          // the whole question, for screen readers
        const stage = el('span', 'stage');        // the animated letters
        stage.setAttribute('aria-hidden', 'true');
        let lines = [], shown = 0;                // the lines of the current question, and how many letters show

        // Where does the browser break this sentence at the present width?
        const breakLines = (text) => {
          const probe = q.cloneNode(false);
          probe.removeAttribute('id');
          probe.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;min-height:0;margin:0;width:${q.clientWidth}px`;
          const words = text.split(' ').map((w, k, all) => {
            const s = document.createElement('span');
            s.textContent = k < all.length - 1 ? `${w} ` : w;
            probe.appendChild(s);
            return s;
          });
          q.parentNode.appendChild(probe);
          const out = [];
          let top = null;
          for (const s of words) {
            if (s.offsetTop !== top) { out.push(''); top = s.offsetTop; }
            out[out.length - 1] += s.textContent;
          }
          probe.remove();
          return out;
        };
        const lay = (text) => {
          lines = breakLines(text).map((t) => {
            const ln = el('span', 'ln'), on = el('span', 'on'), off = el('span', 'off');
            ln.append(on, off);
            return { t, ln, on, off };
          });
          stage.textContent = '';
          stage.append(...lines.map((l) => l.ln));
        };
        const show = (n) => {
          shown = n;
          let left = n, cur = -1;                 // `cur` is the line that holds the cursor
          lines.forEach((l, k) => {
            const take = Math.max(0, Math.min(l.t.length, left));
            l.on.textContent = l.t.slice(0, take);
            l.off.textContent = l.t.slice(take);
            if (cur < 0 && (left < l.t.length || k === lines.length - 1)) cur = k;
            left -= l.t.length;
          });
          lines.forEach((l, k) => l.on.classList.toggle('cur', k === cur));
        };

        // Room for the longest question, so that nothing around it moves when the question changes.
        const reserve = () => {
          const most = Math.max(...list.map((t) => breakLines(t).length));
          const line = parseFloat(getComputedStyle(q).lineHeight);
          if (most && line) q.style.minHeight = `${Math.ceil(most * line)}px`;
        };

        spoken.textContent = list[0];
        q.textContent = '';
        q.append(spoken, stage);
        reserve();
        lay(list[0]);
        show(list[0].length);

        const type = (text, n, done) => {
          show(n);
          if (n < text.length) setTimeout(() => type(text, n + 1, done), 28 + Math.random() * 30);
          else setTimeout(done, 3800);
        };
        const erase = (n, done) => {
          show(n);
          if (n <= 0) { done(); return; }
          setTimeout(() => erase(Math.max(0, n - 2), done), 12);
        };
        const next = () => erase(shown, () => {
          i = (i + 1) % list.length;
          spoken.textContent = list[i];
          lay(list[i]);
          type(list[i], 1, next);
        });
        setTimeout(next, 4200);

        // a new window width means new line breaks
        let wide = q.clientWidth, wait = 0;
        window.addEventListener('resize', () => {
          clearTimeout(wait);
          wait = setTimeout(() => { if (q.clientWidth !== wide) { wide = q.clientWidth; reserve(); lay(list[i]); show(shown); } }, 150);
        });
      }
    }
  }

  /* ---- photos open large ---- */
  // Every link with class "zoom" opens its photo in a large view with the caption. The arrow keys and the
  // arrows on screen step through the photos of the same group (the nearest element with data-gallery).
  const zooms = Array.from(document.querySelectorAll('a.zoom'));
  if (zooms.length) {
    let box = null, img, cap, count, prev, next, close, group = [], at = 0, opener = null;
    const make = (tag, cls, label, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (label) e.setAttribute('aria-label', label);
      if (text) e.textContent = text;
      if (tag === 'button') e.type = 'button';
      return e;
    };
    const show = () => {
      const a = group[at], thumb = a.querySelector('img');
      img.src = a.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      cap.textContent = a.dataset.cap || '';
      prev.hidden = next.hidden = group.length < 2;
      count.textContent = group.length > 1 ? `${at + 1} / ${group.length}` : '';
    };
    const step = (d) => { if (group.length > 1) { at = (at + d + group.length) % group.length; show(); } };
    const shut = () => {
      box.hidden = true;
      document.documentElement.classList.remove('lb-open');
      img.removeAttribute('src');
      if (opener) opener.focus();
    };
    const build = () => {
      box = make('div', 'lightbox', 'Photo, enlarged');
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.hidden = true;
      close = make('button', 'lb-close', 'Close', '×');
      prev = make('button', 'lb-prev', 'Previous photo', '‹');
      next = make('button', 'lb-next', 'Next photo', '›');
      const fig = make('figure');
      img = make('img');
      cap = make('figcaption');
      count = make('span', 'lb-count');
      fig.append(img, cap);
      box.append(close, prev, fig, next, count);
      document.body.appendChild(box);
      close.addEventListener('click', shut);
      prev.addEventListener('click', () => step(-1));
      next.addEventListener('click', () => step(1));
      box.addEventListener('click', (e) => { if (e.target === box || e.target === fig) shut(); });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') shut();
        else if (e.key === 'ArrowLeft') step(-1);
        else if (e.key === 'ArrowRight') step(1);
        else if (e.key === 'Tab') { // the focus stays inside the large view
          const f = [close, prev, next].filter((b) => !b.hidden);
          const k = f.indexOf(document.activeElement);
          e.preventDefault();
          f[(k + (e.shiftKey ? f.length - 1 : 1) + f.length) % f.length].focus();
        }
      });
    };
    zooms.forEach((a) => a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; // the browser opens the file itself
      e.preventDefault();
      if (!box) build();
      const scope = a.closest('[data-gallery]');
      group = scope ? Array.from(scope.querySelectorAll('a.zoom')) : [a];
      at = Math.max(0, group.indexOf(a));
      opener = a;
      show();
      box.hidden = false;
      document.documentElement.classList.add('lb-open');
      close.focus();
    }));
  }

  /* ---- long publication lists: a frame that scrolls, and a button that opens the whole list ---- */
  document.querySelectorAll('.pubmore button').forEach((b) => {
    const frame = b.parentElement.previousElementSibling;
    if (!frame || !frame.classList.contains('pubframe')) return;
    b.addEventListener('click', () => {
      const open = frame.classList.toggle('open');
      b.setAttribute('aria-expanded', String(open));
      b.textContent = open ? b.dataset.few : b.dataset.all;
      if (open) frame.removeAttribute('tabindex');
      else { frame.setAttribute('tabindex', '0'); frame.scrollTop = 0; frame.scrollIntoView({ block: 'nearest' }); }
    });
  });

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
