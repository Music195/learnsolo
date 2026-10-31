/* =====================================================================
   floatbar.js — the floating bar on the home and note pages
   (templates/_floatbar.html)
   ---------------------------------------------------------------------
   1. Phone menu: the ☰ button opens the bar's links and search
   2. Note search: finds notes by title or by course/topic
   Each part is wrapped in a function so names can't clash.
   ===================================================================== */

// 1. Phone menu: ☰ toggles the menu; picking a link closes it again.
(function () {
  const button = document.getElementById('menuBtn');
  const menu = document.getElementById('floatMenu');
  if (!button || !menu) return;
  function setOpen(open) {
    menu.classList.toggle('open', open);
    button.setAttribute('aria-expanded', open);
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    button.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  }
  button.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
})();

// 2. Note search: shows up to 8 notes whose title or place ("Math I · Vector")
// contains every word typed. ↑/↓ choose a result, Enter opens it, Esc closes.
// The list of notes (/search-index.json) is loaded the first time it's needed.
(function () {
  const input = document.getElementById('noteSearch');
  const list = document.getElementById('searchResults');
  if (!input || !list) return;
  let index = null, loading = null, results = [], active = -1;

  function load() {
    loading = loading || fetch('/search-index.json')
      .then((r) => r.json())
      .then((data) => { index = data; })
      .catch(() => { index = []; });
    return loading;
  }

  function show(open) {
    list.hidden = !open;
    input.setAttribute('aria-expanded', open);
  }

  function render() {
    list.innerHTML = '';
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = index ? 'No notes found' : 'Loading…';
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

  function search() {
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { show(false); return; }
    results = (index || [])
      .filter((n) => words.every((w) => `${n.title} ${n.where}`.toLowerCase().includes(w)))
      .slice(0, 8);
    active = results.length ? 0 : -1;
    render();
    show(true);
  }

  input.addEventListener('focus', load);
  input.addEventListener('input', () => {
    search();                         // shows "Loading…" if the list isn't here yet
    if (!index) load().then(search);  // then searches again once it arrives
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
