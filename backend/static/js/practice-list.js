/* =====================================================================
   practice-list.js — the practice hub (templates/practice-list.html),
   also used by past-question lists with tabs (templates/past-list.html)
   ---------------------------------------------------------------------
   1. Course tabs: shows one course at a time. The choice is remembered
      on this device, and /practice#math-a opens Math A.
   2. Progress: reads what practice.js saved for each set
      ("practice:<path>" in localStorage) and shows "Solved 2 of 6" on the
      set, and the total for each topic.
   ===================================================================== */
(function () {
  // ---------- 1. Course tabs ----------
  const tabs = [...document.querySelectorAll('.hub-tab')];
  // Where the chosen tab is remembered (the EJU list page uses its own key)
  const TAB_KEY = document.querySelector('.hub-tabs')?.dataset.remember || 'practice-hub:course';

  function show(course) {
    const tab = tabs.find((t) => t.dataset.course === course) || tabs[0];
    if (!tab) return;
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    }
    localStorage.setItem(TAB_KEY, tab.dataset.course);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(tab.dataset.course));
    // ← / → move between tabs, as in other tab lists
    tab.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      show(next.dataset.course);
      next.focus();
    });
  });

  show(location.hash.slice(1) || localStorage.getItem(TAB_KEY));

  // ---------- 2. Progress ----------
  // A renamed set may still have its progress under an earlier path until
  // the set is opened (practice.js moves it then), so look there too.
  function solvedIn(row) {
    const paths = [row.dataset.practice, ...row.dataset.movedFrom.split('|').filter(Boolean)];
    for (const path of paths) {
      try {
        const saved = JSON.parse(localStorage.getItem('practice:' + path));
        if (saved) return Object.values(saved).filter((v) => v === 'solved').length;
      } catch (e) { /* ignore unreadable entries */ }
    }
    return null;
  }

  for (const card of document.querySelectorAll('.topic-card')) {
    let solved = 0;
    let total = 0;
    for (const row of card.querySelectorAll('.set-row')) {
      const count = Number(row.dataset.count);
      const n = solvedIn(row);
      total += count;
      if (!n) continue;   // not started, or opened without solving anything yet
      solved += n;
      const badge = row.querySelector('.set-progress');
      badge.hidden = false;
      badge.classList.toggle('is-done', n >= count);
      badge.innerHTML = n >= count ? '<i class="fas fa-check"></i> Done' : `Solved ${n} of ${count}`;
    }
    const topicSolved = card.querySelector('.topic-solved');
    if (solved) {
      topicSolved.hidden = false;
      topicSolved.textContent = `Solved ${solved} of ${total}`;
    }
  }
})();
