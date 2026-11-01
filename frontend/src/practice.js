// The interactive parts of a practice set (or past paper), moved over from
// the old site's backend/static/js/practice.js.
//
// For every <section class="practice-problem"> in the set it adds:
//   1. An answer box (only if the problem has data-answer) that checks
//      typed answers such as 45, 2√7, sqrt(28), 5/2 or 2.5
//   2. "I got it" / "Review later" buttons, shown once the student has
//      checked an answer or opened the solution
// Progress is saved in this browser (src/progress.js).
//
// This code changes the set's HTML directly with DOM functions
// (createElement, addEventListener...), the way the old page did, rather
// than with React: the set's HTML comes from a content file, so React
// doesn't know what's inside it. PracticeSet.jsx calls setUpProblems()
// once NoteContent has put the set on the page.

import { moveOldProgress, readProgress, writeProgress } from './progress.js'

// ---------- Reading a typed answer ----------
// Turns "2√7", "√3/2", "sqrt(28)", "5π/6", "1/e", "π²/2", "45°", "-1/2"
// into a number, or null if it can't. Only digits, + − × ÷ ^ ( ), square
// roots, π and e are allowed.
export function toNumber(text) {
  let s = String(text).trim().toLowerCase()
    .replace(/[°\s]/g, '')
    .replace(/[−–]/g, '-').replace(/×/g, '*').replace(/÷/g, '/')
    .replace(/\^/g, '**').replace(/²/g, '**2').replace(/³/g, '**3')
    .replace(/^[a-z]+=/, '')                                  // "k=6" → "6"
  if (!s) return null
  s = s.replace(/π|pi/g, 'P').replace(/e/g, 'E')               // π → P, e → E
  s = s.replace(/(√|sqrt)(\d+(\.\d+)?|P|E)/g, 'R($2)')          // √7 → R(7)
       .replace(/(√|sqrt)\(/g, 'R(')                           // √(28) → R(28)
  s = s.replace(/(\d|\)|P|E)(?=[RPE(])/g, '$1*')               // 2R(7) → 2*R(7), 5P → 5*P
  if (!/^[0-9+\-*/().RPE]+$/.test(s)) return null              // nothing else allowed
  try {
    // Work out the sum. The check above means only numbers and maths can get here.
    const value = Function('R', 'P', 'E', '"use strict"; return (' + s + ');')(Math.sqrt, Math.PI, Math.E)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

// setUpProblems(holder, path, onChange)
//   holder    the element with the set's HTML in it
//   path      the progress key, e.g. "math-1/03-.../01-..." or "past/eju/..."
//   onChange  called with { solved, review, total, started } after every
//             change, so the page header can show "Solved 2 of 5"
// Returns { reset() } for the "Start again" button.
export function setUpProblems(holder, path, onChange) {
  const problems = [...holder.querySelectorAll('.practice-problem')]
  if (!problems.length) return { reset() {} }

  moveOldProgress(path, holder.querySelector('[data-moved-from]')?.dataset.movedFrom)
  let saved = readProgress(path) || {}

  // Save, then tell the page
  function save() {
    writeProgress(path, saved)
    const states = Object.values(saved)
    onChange({
      solved: states.filter((v) => v === 'solved').length,
      review: states.filter((v) => v === 'review').length,
      total: problems.length,
      started: states.length > 0,
    })
  }

  // Mark problem i as "solved", "review" or nothing (null)
  function setState(i, state) {
    if (state) saved[i] = state; else delete saved[i]
    const card = problems[i]
    card.classList.toggle('is-solved', state === 'solved')
    card.classList.toggle('is-review', state === 'review')
    card.querySelectorAll('.mark-btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.state === state))
    save()
  }

  // ---------- Build the extra parts of each problem ----------
  problems.forEach((card, i) => {
    const solution = card.querySelector('details.solution')

    // 2. "How did it go?" row, hidden until it makes sense to ask
    const mark = document.createElement('div')
    mark.className = 'practice-mark'
    mark.hidden = true
    mark.innerHTML =
      '<span>How did it go?</span>' +
      '<button type="button" class="mark-btn" data-state="solved"><i class="fas fa-check"></i> I got it</button>' +
      '<button type="button" class="mark-btn" data-state="review"><i class="fas fa-rotate-left"></i> Review later</button>'
    // Clicking the pressed button again un-marks the problem
    mark.querySelectorAll('.mark-btn').forEach((b) =>
      b.addEventListener('click', () => setState(i, saved[i] === b.dataset.state ? null : b.dataset.state)))
    card.appendChild(mark)
    const showMark = () => { mark.hidden = false }
    // "toggle" fires when a <details> opens or closes
    if (solution) solution.addEventListener('toggle', () => { if (solution.open) showMark() })

    // 1. Answer box, before the hint
    if (card.dataset.answer) {
      const target = toNumber(card.dataset.answer)
      const box = document.createElement('form')
      box.className = 'practice-check'
      box.innerHTML =
        `<label for="answer${i}">Your answer</label>` +
        `<input id="answer${i}" type="text" inputmode="text" autocomplete="off">` +
        '<button type="submit">Check</button>' +
        '<span class="check-result" role="status"></span>'
      const input = box.querySelector('input')
      const result = box.querySelector('.check-result')
      input.placeholder = card.dataset.placeholder || 'Type your answer'
      box.addEventListener('submit', (event) => {
        event.preventDefault()   // a form would otherwise reload the page
        const value = toNumber(input.value)
        box.classList.remove('right', 'wrong')
        if (value === null) {
          result.textContent = 'Type a number, e.g. 3, 1/2, 2√3, π/4 or 1.5'
          return
        }
        if (Math.abs(value - target) < 0.01) {   // close enough counts, for decimals like 1.41
          box.classList.add('right')
          result.textContent = 'Correct! Compare your working with the solution.'
          setState(i, 'solved')
        } else {
          box.classList.add('wrong')
          result.textContent = 'Not quite. Try again, or open the hint.'
        }
        showMark()
      })
      card.insertBefore(box, card.querySelector('details.hint') || solution)
    }

    // Show what was saved last time
    if (saved[i]) { setState(i, saved[i]); showMark() }
  })

  save()

  return {
    // "Start again": forget every problem's mark
    reset() {
      problems.forEach((_, i) => setState(i, null))
      saved = {}
      save()
    },
  }
}
