/* =====================================================================
   home.js — scripts for the home page (templates/index.html)
   ---------------------------------------------------------------------
   1. Hero demo: drag P along y = x²/2 (uses note_plot.js)
   2. Subject tabs: show one subject's courses at a time
   3. Phone menu: the ☰ button opens the floating bar's links
   4. Note search: type in the floating bar to find notes by title
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

// 3. Phone menu: ☰ toggles the links; picking a link closes the menu again.
(function () {
  const button = document.getElementById('menuBtn');
  const menu = document.getElementById('floatMenu');
  if (!button || !menu) return;
  function setOpen(open) {
    menu.classList.toggle('open', open);
    button.setAttribute('aria-expanded', open);
    button.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  }
  button.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
})();

// 4. Note search: shows up to 8 notes whose title or place ("Math I · Vector")
// contains every word typed. ↑/↓ choose a result, Enter opens it, Esc closes.
(function () {
  const input = document.getElementById('noteSearch');
  const list = document.getElementById('searchResults');
  if (!input || !list || typeof SEARCH_INDEX === 'undefined') return;
  let results = [], active = -1;

  function show(open) {
    list.hidden = !open;
    input.setAttribute('aria-expanded', open);
  }

  function render() {
    list.innerHTML = '';
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No notes found';
      list.appendChild(li);
      return;
    }
    results.forEach((note, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === active);
      const a = document.createElement('a');
      a.href = note.url;
      a.innerHTML = '<strong></strong><span></span>';
      a.querySelector('strong').textContent = note.title; // textContent: titles are never run as HTML
      a.querySelector('span').textContent = note.where;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  input.addEventListener('input', () => {
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { show(false); return; }
    results = SEARCH_INDEX
      .filter((n) => words.every((w) => `${n.title} ${n.where}`.toLowerCase().includes(w)))
      .slice(0, 8);
    active = results.length ? 0 : -1;
    render();
    show(true);
  });

  input.addEventListener('keydown', (e) => {
    if (list.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      render();
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      location.href = results[active].url;
    } else if (e.key === 'Escape') {
      show(false);
    }
  });

  // Close the list when clicking anywhere else
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) show(false);
  });
})();
