(() => {
  'use strict';
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */
  const toggle = document.getElementById('theme-toggle');
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const themeListeners = [];

  function setTheme(next, persist) {
    const apply = () => {
      root.dataset.theme = next;
      toggle.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`);
      themeListeners.forEach(fn => fn());
    };
    if (persist) { try { localStorage.setItem('theme', next); } catch (e) {} }
    if (document.startViewTransition && !reduceMotion && persist) document.startViewTransition(apply);
    else apply();
  }
  setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light', false);
  toggle.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  systemDark.addEventListener('change', e => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) {}
    if (!saved) setTheme(e.matches ? 'dark' : 'light', false);
  });

  /* ---------- header + nav ---------- */
  const header = document.querySelector('.top');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = [...document.querySelectorAll('.nav a')];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));

    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); reveal.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    // Only animate sections that start below the fold; never hide what's already on screen.
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('pending');
      reveal.observe(el);
    });
  }

  /* ---------- small details ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
  const clock = document.getElementById('local-time');
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit' });
  const tick = () => { clock.textContent = fmt.format(new Date()).toLowerCase(); };
  tick();
  setInterval(tick, 15000);

  /* ---------- visitor counter ----------
     Every page load (including a reload) adds one visit. Off the real domain we
     count into a separate key so local testing doesn't inflate the number. */
  const COUNTER_BASE = 'https://abacus.jasoncameron.dev';
  const COUNTER_NS = 'krishvaid.me';
  const isProd = /(^|\.)krishvaid\.me$/.test(location.hostname);
  const COUNTER_KEY = isProd ? 'visits' : 'visits-dev';

  const visits = document.getElementById('visits');
  const odo = visits.querySelector('.odo');
  const visitsSr = document.getElementById('visits-sr');

  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function readCount(path) {
    const res = await fetch(`${COUNTER_BASE}/${path}/${COUNTER_NS}/${COUNTER_KEY}`, { cache: 'no-store', credentials: 'omit' });
    const data = await res.json();
    if (!Number.isSafeInteger(data.value) || data.value < 0) throw new Error('bad count');
    return data.value;
  }
  async function countVisit() {
    // The hit endpoint occasionally errors after it has already incremented,
    // so retry with read-only calls instead of hitting twice.
    try { return await readCount('hit'); } catch (e) {}
    for (let i = 0; i < 4; i++) {
      await wait(400 * 2 ** i);
      try { return await readCount('get'); } catch (e) {}
    }
    throw new Error('counter unavailable');
  }

  function renderOdometer(n) {
    const text = n.toLocaleString('en-US');
    odo.classList.remove('loading');
    odo.innerHTML = '<span class="hash">#</span>';
    const reels = [];
    for (const ch of text) {
      if (ch === ',') { const c = document.createElement('span'); c.className = 'comma'; c.textContent = ','; odo.append(c); continue; }
      const d = document.createElement('span');
      d.className = 'd';
      const reel = document.createElement('span');
      reel.innerHTML = '0123456789'.split('').map(x => `<span>${x}</span>`).join('');
      d.append(reel);
      odo.append(d);
      reels.push([reel, Number(ch)]);
    }
    visitsSr.textContent = `You are visitor number ${text}.`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      reels.forEach(([reel, digit], i) => {
        reel.style.transitionDelay = `${i * 70}ms`;
        reel.style.transform = `translateY(-${digit}em)`;
      });
    }));
  }

  function startCounter() {
    odo.classList.add('loading');
    odo.textContent = '#···';
    countVisit().then(renderOdometer).catch(() => {
      visits.classList.add('hidden');
    });
  }
  // A prerendered page hasn't been visited yet; count it once it's shown.
  if (document.prerendering) document.addEventListener('prerenderingchange', startCounter, { once: true });
  else startCounter();

  /* ---------- double pendulum ---------- */
  const canvas = document.getElementById('pendulum');
  if (canvas) pendulum(canvas);

  function pendulum(cv) {
    const ctx = cv.getContext('2d');
    const g = 9.81, L1 = 1, L2 = 1, M1 = 1, M2 = 1;
    let s = [2.2 + Math.random() * 0.4, 0, 2.7 + Math.random() * 0.4, 0]; // θ1, ω1, θ2, ω2
    const trail = [];
    const MAX_TRAIL = 520;
    let colors = {};
    let size = 0, dpr = 1;

    function readColors() {
      const cs = getComputedStyle(root);
      colors = { fg: cs.getPropertyValue('--fg').trim(), accent: cs.getPropertyValue('--accent').trim(), faint: cs.getPropertyValue('--faint').trim() };
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = cv.clientWidth || 168;
      cv.width = size * dpr;
      cv.height = size * dpr;
    }
    function deriv([t1, w1, t2, w2]) {
      const d = t1 - t2;
      const den = 2 * M1 + M2 - M2 * Math.cos(2 * t1 - 2 * t2);
      const a1 = (-g * (2 * M1 + M2) * Math.sin(t1) - M2 * g * Math.sin(t1 - 2 * t2)
        - 2 * Math.sin(d) * M2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(d))) / (L1 * den);
      const a2 = (2 * Math.sin(d) * (w1 * w1 * L1 * (M1 + M2) + g * (M1 + M2) * Math.cos(t1)
        + w2 * w2 * L2 * M2 * Math.cos(d))) / (L2 * den);
      return [w1, a1, w2, a2];
    }
    function rk4(h) {
      const add = (a, b, k) => a.map((v, i) => v + b[i] * k);
      const k1 = deriv(s);
      const k2 = deriv(add(s, k1, h / 2));
      const k3 = deriv(add(s, k2, h / 2));
      const k4 = deriv(add(s, k3, h));
      s = s.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    }
    function positions() {
      const r = size * 0.22;
      const cx = size / 2, cy = size / 2;
      const x1 = cx + r * Math.sin(s[0]), y1 = cy + r * Math.cos(s[0]);
      const x2 = x1 + r * Math.sin(s[2]), y2 = y1 + r * Math.cos(s[2]);
      return { cx, cy, x1, y1, x2, y2 };
    }
    function step() {
      for (let i = 0; i < 6; i++) rk4(1 / 360);
      const p = positions();
      trail.push([p.x2, p.y2]);
      if (trail.length > MAX_TRAIL) trail.shift();
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Fading trail: older segments are fainter.
      const chunks = 26;
      const per = Math.ceil(trail.length / chunks);
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1.1;
      for (let c = 0; c < chunks; c++) {
        const start = c * per, end = Math.min(trail.length, start + per + 1);
        if (end - start < 2) continue;
        ctx.globalAlpha = Math.pow((c + 1) / chunks, 1.6) * 0.85;
        ctx.beginPath();
        ctx.moveTo(trail[start][0], trail[start][1]);
        for (let i = start + 1; i < end; i++) ctx.lineTo(trail[i][0], trail[i][1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const p = positions();
      ctx.strokeStyle = colors.fg;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.cx, p.cy); ctx.lineTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
      ctx.fillStyle = colors.fg;
      ctx.beginPath(); ctx.arc(p.cx, p.cy, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x1, p.y1, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = colors.accent;
      ctx.beginPath(); ctx.arc(p.x2, p.y2, 3.6, 0, Math.PI * 2); ctx.fill();
    }

    readColors();
    resize();
    themeListeners.push(() => { readColors(); draw(); });
    addEventListener('resize', () => { resize(); draw(); });

    if (reduceMotion) {
      for (let i = 0; i < MAX_TRAIL; i++) step();
      draw();
      return;
    }
    let visible = false, raf = 0;
    const loop = () => { step(); draw(); raf = requestAnimationFrame(loop); };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    }).observe(cv);
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    });
    draw();
  }
})();
