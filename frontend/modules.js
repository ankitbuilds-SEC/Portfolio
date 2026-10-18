(function () {
  window.PortfolioUtils = {
    debounce(fn, wait = 100) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
      };
    },
    getTheme() {
      const saved = localStorage.getItem('portfolio-theme');
      return saved || 'light';
    },
    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.dataset.theme = theme;
      localStorage.setItem('portfolio-theme', theme);
    },
    formatCount(value) {
      return new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);
    }
  };
})();
