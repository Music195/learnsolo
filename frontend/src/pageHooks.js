// Hooks shared by the pages that look like a note (notes, practice sets,
// past papers). A hook is a function starting with "use" that a component
// calls to get some behaviour; see src/api.js for the first one.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

// Text size: 70%–150% in steps of 5%, remembered in the browser (localStorage)
// under the same name the old site used, so a saved size carries over.
const SIZE_KEY = 'noteFontSize'
const clampSize = (size) => Math.min(Math.max(size, 70), 150)

// const [textSize, changeTextSize] = useTextSize()
//   textSize           e.g. 100 (percent)
//   changeTextSize(1)  5% bigger; changeTextSize(-1) 5% smaller
export function useTextSize() {
  // useState(() => ...) runs the function only once, for the first value
  const [size, setSize] = useState(() => clampSize(parseInt(localStorage.getItem(SIZE_KEY), 10) || 100))
  function change(step) {
    const next = clampSize(size + 5 * step)
    setSize(next)
    localStorage.setItem(SIZE_KEY, next)
  }
  return [size, change]
}

// ← / → keys go to nav.prev / nav.next ({ url } or null).
// Ignored while typing or using a slider, so the demos' arrow keys still
// work, and while `paused` is true (e.g. the Topics sidebar is open).
export function useArrowKeys(nav, paused = false) {
  const navigate = useNavigate()
  useEffect(() => {
    if (!nav) return
    function onKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      const el = document.activeElement
      if (el && (el.isContentEditable || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName))) return
      if (paused) return
      const link = { ArrowLeft: nav.prev, ArrowRight: nav.next }[event.key]
      if (link) navigate(link.url)
    }
    document.addEventListener('keydown', onKey)
    // Remove the listener when the page changes or closes
    return () => document.removeEventListener('keydown', onKey)
  }, [nav, paused, navigate])
}

// The browser tab's title, e.g. "Law of Sines · Math I · Learn Solo"
// (nothing while `title` is still null, i.e. loading)
export function usePageTitle(title) {
  useEffect(() => {
    if (title) document.title = title
  }, [title])
}

// When `path` changes (a new note or set opens without reloading the page),
// start at the top, as a newly loaded page would.
export function useScrollToTop(path) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])
}
