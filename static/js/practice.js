/* =====================================================================
   practice.js — practice set pages (templates/practice.html)
   ---------------------------------------------------------------------
   For every <section class="practice-problem"> in the page it adds:
     1. An answer box (only if the problem has data-answer) that checks
        typed answers such as 45, 2√7, sqrt(28), 5/2 or 2.5
     2. "I got it" / "Review later" buttons, shown once the student has
        checked an answer or opened the solution
   Progress is saved on this device (localStorage) and shown in the
   header as "Solved 2 of 5". When a set is renamed, its progress moves
   with it (see data-moved-from below).
   ===================================================================== */
(function () {
  const main = document.getElementById('noteContent');
  const problems = [...document.querySelectorAll('.practice-problem')];
  if (!main || !problems.length) return;

  const KEY = 'practice:' + main.dataset.practice;

  // A renamed set lists its earlier paths in data-moved-from="old|older":
  // carry any progress saved under them over to the new path, once.
  const article = main.querySelector('[data-moved-from]');
  if (article && localStorage.getItem(KEY) === null) {
    for (const old of article.dataset.movedFrom.split('|')) {
      const value = localStorage.getItem('practice:' + old);
      if (value !== null) {
        localStorage.setItem(KEY, value);
        localStorage.removeItem('practice:' + old);
        break;
      }
    }
  }

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }

  // ---------- Reading a typed answer ----------
  // Turns "2√7", "√3/2", "sqrt(28)", "5π/6", "1/e", "π²/2", "45°", "-1/2"
  // into a number, or null if it can't. Only digits, + − × ÷ ^ ( ), square
  // roots, π and e are allowed.
  function toNumber(text) {
    let s = String(text).trim().toLowerCase()
      .replace(/[°\s]/g, '')
      .replace(/[−–]/g, '-').replace(/×/g, '*').replace(/÷/g, '/')
      .replace(/\^/g, '**').replace(/²/g, '**2').replace(/³/g, '**3')
      .replace(/^[a-z]+=/, '');                                  // "k=6" → "6"
    if (!s) return null;
    s = s.replace(/π|pi/g, 'P').replace(/e/g, 'E');               // π → P, e → E
    s = s.replace(/(√|sqrt)(\d+(\.\d+)?|P|E)/g, 'R($2)')          // √7 → R(7)
         .replace(/(√|sqrt)\(/g, 'R(');                          // √(28) → R(28)
    s = s.replace(/(\d|\)|P|E)(?=[RPE(])/g, '$1*');              // 2R(7) → 2*R(7), 5P → 5*P
    if (!/^[0-9+\-*/().RPE]+$/.test(s)) return null;             // nothing else allowed
    try {
      const value = Function('R', 'P', 'E', '"use strict"; return (' + s + ');')(Math.sqrt, Math.PI, Math.E);
      return Number.isFinite(value) ? value : null;
    } catch (e) {
      return null;
    }
  }

  // ---------- Progress in the header ----------
  const progressText = document.getElementById('practiceProgress');
  const progressBar = document.getElementById('practiceBar');
  const resetBtn = document.getElementById('practiceReset');

  function save() {
    localStorage.setItem(KEY, JSON.stringify(saved));
    const solved = Object.values(saved).filter((v) => v === 'solved').length;
    const review = Object.values(saved).filter((v) => v === 'review').length;
    if (progressText) {
      progressText.textContent = `Solved ${solved} of ${problems.length}` + (review ? ` · ${review} to review` : '');
    }
    if (progressBar) progressBar.style.width = (100 * solved / problems.length) + '%';
    if (resetBtn) resetBtn.hidden = !Object.keys(saved).length;
  }

  function setState(i, state) {
    if (state) saved[i] = state; else delete saved[i];
    const card = problems[i];
    card.classList.toggle('is-solved', state === 'solved');
    card.classList.toggle('is-review', state === 'review');
    card.querySelectorAll('.mark-btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.state === state));
    save();
  }

  // ---------- Build the extra parts of each problem ----------
  problems.forEach((card, i) => {
    const solution = card.querySelector('details.solution');

    // 2. "How did it go?" row, hidden until it makes sense to ask
    const mark = document.createElement('div');
    mark.className = 'practice-mark';
    mark.hidden = true;
    mark.innerHTML =
      '<span>How did it go?</span>' +
      '<button type="button" class="mark-btn" data-state="solved"><i class="fas fa-check"></i> I got it</button>' +
      '<button type="button" class="mark-btn" data-state="review"><i class="fas fa-rotate-left"></i> Review later</button>';
    mark.querySelectorAll('.mark-btn').forEach((b) =>
      b.addEventListener('click', () => setState(i, saved[i] === b.dataset.state ? null : b.dataset.state)));
    card.appendChild(mark);
    const showMark = () => { mark.hidden = false; };
    if (solution) solution.addEventListener('toggle', () => { if (solution.open) showMark(); });

    // 1. Answer box, before the hint
    if (card.dataset.answer) {
      const target = toNumber(card.dataset.answer);
      const box = document.createElement('form');
      box.className = 'practice-check';
      box.innerHTML =
        `<label for="answer${i}">Your answer</label>` +
        `<input id="answer${i}" type="text" inputmode="text" autocomplete="off">` +
        '<button type="submit">Check</button>' +
        '<span class="check-result" role="status"></span>';
      const input = box.querySelector('input');
      const result = box.querySelector('.check-result');
      input.placeholder = card.dataset.placeholder || 'Type your answer';
      box.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = toNumber(input.value);
        box.classList.remove('right', 'wrong');
        if (value === null) {
          result.textContent = 'Type a number, e.g. 3, 1/2, 2√3, π/4 or 1.5';
          return;
        }
        if (Math.abs(value - target) < 0.01) {
          box.classList.add('right');
          result.textContent = 'Correct! Compare your working with the solution.';
          setState(i, 'solved');
        } else {
          box.classList.add('wrong');
          result.textContent = 'Not quite. Try again, or open the hint.';
        }
        showMark();
      });
      card.insertBefore(box, card.querySelector('details.hint') || solution);
    }

    if (saved[i]) { setState(i, saved[i]); showMark(); }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      problems.forEach((_, i) => setState(i, null));
      localStorage.removeItem(KEY);
      save();
    });
  }
  save();
})();
