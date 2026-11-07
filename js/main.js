(() => {
  'use strict';
  const root = document.documentElement;
  const toggle = document.querySelector('#theme-toggle');
  const system = matchMedia('(prefers-color-scheme: dark)');
  let manual = false;
  try { manual = ['light', 'dark'].includes(localStorage.getItem('theme')); } catch {}
  function sync() {
    const dark = root.dataset.theme === 'dark';
    toggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    toggle.title = toggle.getAttribute('aria-label');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#111111' : '#fafafa';
  }
  toggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    manual = true;
    try { localStorage.setItem('theme', root.dataset.theme); } catch {}
    sync();
  });
  system.addEventListener('change', () => { if (!manual) { root.dataset.theme = system.matches ? 'dark' : 'light'; sync(); } });
  sync();
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  const dialog = document.querySelector('#lightbox');
  let opener;
  document.querySelectorAll('[data-photo]').forEach(el => el.addEventListener('click', event => {
    if (!dialog.showModal) return;
    event.preventDefault(); opener = el;
    dialog.querySelector('img').src = el.href;
    dialog.querySelector('img').alt = el.querySelector('img').alt;
    dialog.querySelector('p').textContent = el.dataset.caption;
    dialog.showModal();
  }));
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus());
  const counter = document.querySelector('[data-counter]');
  if (!counter || !counter.dataset.counter || window.__krishCounterRequested) return;
  function increment() {
    if (window.__krishCounterRequested) return;
    window.__krishCounterRequested = true;
    counter.textContent = 'Counting this visit…';
    fetch(counter.dataset.counter, { method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(8000) })
      .then(response => { if (!response.ok) throw new Error('Counter unavailable'); return response.json(); })
      .then(data => { if (!Number.isSafeInteger(data.count) || data.count < 1) throw new Error('Invalid count'); counter.textContent = `${data.count.toLocaleString()} visits`; })
      .catch(() => { counter.textContent = 'Visit count temporarily unavailable.'; });
  }
  // Prerendering is not a visit. Normal loads and refreshes each send one POST.
  if (document.prerendering) document.addEventListener('prerenderingchange', increment, { once: true });
  else increment();
})();
