/* =====================================================================
   note-page.js — the page around each note (templates/note.html)
   ---------------------------------------------------------------------
   1. Sidebar: the Topics button opens it; pick a course and a topic to
      list their notes. It starts on the course and topic being read.
   2. Text size: the A− / A+ buttons in the floating bar (saved for next time)
   3. ← / → keys: go to the previous / next note
   The floating bar's menu and search are in floatbar.js.
   Each part is wrapped in a function so names can't clash with the notes.
   ===================================================================== */

// 1. Sidebar
(function () {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const openBtn = document.getElementById('topicsBtn');
  const closeBtn = document.getElementById('sidebarClose');
  const courseSelect = document.getElementById('folderFilter');
  const topicSelect = document.getElementById('subfolderFilter');
  const list = document.getElementById('noteList');
  if (!sidebar || typeof NOTES_META === 'undefined') return;

  const names = typeof DISPLAY_NAMES !== 'undefined' ? DISPLAY_NAMES : { courses: {}, topics: {} };
  const current = decodeURIComponent(location.pathname).replace(/^\/notes\//, '');
  const noteUrl = (path) => '/notes/' + path;

  // Topic dropdown: the topics of the chosen course, in folder order
  function fillTopics(selected) {
    const course = courseSelect.value;
    const topics = [...new Set(NOTES_META
      .map((n) => n.path.split('/'))
      .filter((p) => p.length > 2 && p[0] === course)
      .map((p) => p[1]))];
    topicSelect.innerHTML = '';
    topics.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = names.topics[t] || t;
      topicSelect.appendChild(opt);
    });
    if (topics.includes(selected)) topicSelect.value = selected;
    fillList();
  }

  // Note list: every note in the chosen course and topic
  function fillList() {
    const folder = courseSelect.value + '/' + topicSelect.value + '/';
    list.innerHTML = '';
    NOTES_META.filter((n) => n.path.startsWith(folder)).forEach((n) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = noteUrl(n.path);
      a.textContent = n.title || n.path.split('/').pop();
      if (n.path === current) a.setAttribute('aria-current', 'page');
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  courseSelect.value = sidebar.dataset.course;
  fillTopics(sidebar.dataset.topic);
  courseSelect.addEventListener('change', () => fillTopics());
  topicSelect.addEventListener('change', fillList);

  function setOpen(open) {
    sidebar.classList.toggle('open', open);
    backdrop.hidden = !open;
    if (openBtn) openBtn.setAttribute('aria-expanded', open);
    if (open) {
      // Start the list at the note being read
      const here = list.querySelector('[aria-current]');
      if (here) here.scrollIntoView({ block: 'center' });
      closeBtn.focus();
    } else if (openBtn && sidebar.contains(document.activeElement)) {
      openBtn.focus();
    }
  }
  if (openBtn) openBtn.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));
  closeBtn.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) setOpen(false);
  });
})();

// 2. Text size: 70%–150% in steps of 5%, remembered in localStorage
(function () {
  const content = document.getElementById('noteContent');
  if (!content) return;
  let size = parseInt(localStorage.getItem('noteFontSize'), 10) || 100;
  function apply() {
    size = Math.min(Math.max(size, 70), 150);
    content.style.fontSize = size + '%';
    localStorage.setItem('noteFontSize', size);
  }
  apply();
  document.querySelectorAll('[data-text-size]').forEach((btn) =>
    btn.addEventListener('click', () => { size += 5 * Number(btn.dataset.textSize); apply(); }));
})();

// 3. ← / → keys go to the previous / next note.
// Ignored while typing or using a slider, so the demos' arrow keys still work.
(function () {
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const el = document.activeElement;
    if (el && (el.isContentEditable || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName))) return;
    if (document.getElementById('sidebar')?.classList.contains('open')) return;
    const link = document.getElementById(e.key === 'ArrowLeft' ? 'prevLink' : e.key === 'ArrowRight' ? 'nextLink' : '');
    if (link) location.href = link.href;
  });
})();
