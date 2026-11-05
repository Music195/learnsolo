// Hooks shared by the pages that look like a note (notes, practice sets,
// past papers). A hook is a function starting with "use" that a component
// calls to get some behaviour; see src/api.js for the first one.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

// Text size: 70%–150% in steps of 5%, remembered in the browser (localStorage)
// under the same name the old site used, so a saved size carries over.
const SIZE_KEY = 'noteFontSize'
const clampSize = (size) => Math.min(Math.max(size, 70), 160)

// Font size hook: integer percentage (85, 100, 115, 130).
// Persisted in localStorage under 'noteFontSize'.
// Syncs CSS variable --content-font-size and broadcasts live changes.
export function useFontSize() {
  const [fontSize, setFontSizeState] = useState(() => {
    try {
      return clampSize(parseInt(localStorage.getItem(SIZE_KEY), 10) || 100)
    } catch {
      return 100
    }
  })

  useEffect(() => {
    document.documentElement.style.setProperty('--content-font-size', `${fontSize}%`)
    try {
      localStorage.setItem(SIZE_KEY, String(fontSize))
      localStorage.setItem('app_font_size', String(fontSize))
    } catch {}

    const onCustom = (e) => {
      if (e.detail?.fontSize) {
        setFontSizeState(e.detail.fontSize)
      }
    }
    window.addEventListener('app_font_size_change', onCustom)
    return () => window.removeEventListener('app_font_size_change', onCustom)
  }, [fontSize])

  function setFontSize(newSize) {
    const clamped = clampSize(Number(newSize) || 100)
    setFontSizeState(clamped)
    window.dispatchEvent(new CustomEvent('app_font_size_change', { detail: { fontSize: clamped } }))
  }

  function changeFontSize(delta) {
    setFontSize(fontSize + delta * 10)
  }

  return { fontSize, setFontSize, changeFontSize }
}

// const [textSize, changeTextSize, setTextSize] = useTextSize()
// Backwards compatible wrapper for Note.jsx, PracticeSet.jsx, PastPaper.jsx
export function useTextSize() {
  const { fontSize, setFontSize, changeFontSize } = useFontSize()
  return [fontSize, changeFontSize, setFontSize]
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

// Theme hook: 'light' or 'dark', saved in localStorage under 'theme'.
// Syncs document.documentElement's data-theme attribute.
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-bs-theme', theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return [theme, toggleTheme, setTheme]
}

// Font family hook: 'default', 'noto', 'serif'.
// Persisted in localStorage under 'app_font_family'.
export function useFontFamily() {
  const [fontFamily, setFontFamilyState] = useState(() => {
    try {
      return localStorage.getItem('app_font_family') || 'default'
    } catch {
      return 'default'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontFamily)
    try {
      localStorage.setItem('app_font_family', fontFamily)
    } catch {}
  }, [fontFamily])

  function setFontFamily(family) {
    setFontFamilyState(family)
  }

  return { fontFamily, setFontFamily }
}
