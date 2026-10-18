(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const saved = localStorage.getItem('portfolio-theme');
  const setTheme = night => { root.classList.toggle('dark-mode', night); toggle?.setAttribute('aria-pressed', String(night)); toggle?.setAttribute('aria-label', night ? 'Switch to day mode' : 'Switch to night mode'); localStorage.setItem('portfolio-theme', night ? 'night' : 'day'); };
  setTheme(saved === 'night');
  toggle?.addEventListener('click', () => setTheme(!root.classList.contains('dark-mode')));
})();
