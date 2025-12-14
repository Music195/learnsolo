// Common helpers used by many notes pages

window.toggleSolution = function (num) {
  const el = document.getElementById('solution' + num);
  if (!el) return;

  const isHidden = (el.style.display === '' || el.style.display === 'none');
  el.style.display = isHidden ? 'block' : 'none';
};

// Small helper used by some pages: safe MathJax rerender on a DOM node
window.rerenderMathJax = function (rootEl) {
  if (!window.MathJax || !rootEl) return;
  try {
    MathJax.typesetPromise([rootEl]);
  } catch (e) {
    console.warn('MathJax rerender error:', e);
  }
};
