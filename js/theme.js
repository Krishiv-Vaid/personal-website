// Blocking, tiny, and before the stylesheet: choose the theme before first paint.
(() => {
  const system = matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem('theme'); } catch {}
  document.documentElement.dataset.theme = ['light', 'dark'].includes(saved) ? saved : system.matches ? 'dark' : 'light';
})();
