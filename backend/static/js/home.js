/* =====================================================================
   home.js — scripts for the home page (templates/home.html)
   ---------------------------------------------------------------------
   1. Hero demo: drag P along y = x²/2 (uses demos/plot.js)
   2. Subject tabs: show one subject's courses at a time
   The floating bar (menu + search) is in floatbar.js.
   Each part is wrapped in a function so names can't clash.
   ===================================================================== */

// 1. Hero demo: P slides along y = x²/2 (x snaps to steps of 0.1).
// The orange line is the tangent at P; its slope equals the x-coordinate of P.
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || !window.NotePlot) return;
  const output = document.getElementById('heroOutput');
  const f = (x) => x * x / 2;
  const onCurve = ([x]) => {
    const t = Math.min(Math.max(Math.round(x * 10) / 10, -3), 3);
    return [t, f(t)];
  };

  NotePlot.graph(canvas, {
    x: [-4.65, 4.65], y: [-1, 5],
    points: { P: [1.5, f(1.5)] },
    constrain: { P: onCurve },
    draw(g, P) {
      const [a, b] = P.P;
      g.fn(f, '#2563eb', { width: 3 });
      g.fn((x) => a * (x - a) + b, '#ea580c', { width: 2 }); // tangent: y = a(x − a) + a²/2
      output.textContent = `P = (${+a.toFixed(1)}, ${+b.toFixed(3)})   slope of tangent = ${+a.toFixed(1)}`;
    },
  });
})();

// 2. Subject tabs: clicking a tab shows its panel and hides the others.
// Left/right arrow keys move between tabs, as screen-reader users expect.
(function () {
  const tabs = [...document.querySelectorAll('.subject-tab')];
  function select(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach((tab, i) => {
    tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });
})();
