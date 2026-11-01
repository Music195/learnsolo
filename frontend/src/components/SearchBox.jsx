// The search box in the floating bar.
// Shows up to 8 notes, sets or papers whose title or place ("Math I · Vector")
// contains every word typed. ↑/↓ choose a result, Enter opens it, Esc closes.
// The list of pages (/api/search-index) is loaded the first time it's needed.

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { fetchJson } from '../api.js'

// Kept outside the component, so the list is loaded once per visit,
// not once per page.
let indexPromise = null
function loadIndex() {
  indexPromise = indexPromise || fetchJson('/api/search-index').catch(() => [])
  return indexPromise
}

// The matching pages for what was typed (at most 8)
function findPages(index, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  return index
    .filter((page) => words.every((w) => `${page.title} ${page.where}`.toLowerCase().includes(w)))
    .slice(0, 8)
}

export default function SearchBox() {
  const [query, setQuery] = useState('')      // the text in the box
  const [index, setIndex] = useState(null)    // the list of pages, null until loaded
  const [open, setOpen] = useState(false)     // is the results list showing?
  const [active, setActive] = useState(0)     // which result ↑/↓ has chosen
  const boxRef = useRef(null)                 // the box's HTML element (see the click effect)
  const navigate = useNavigate()              // navigate(url) changes page from code

  // Nothing is stored for the results: they are worked out again from
  // `index` and `query` every time the component draws.
  const results = index ? findPages(index, query) : []

  function load() {
    loadIndex().then(setIndex)
  }

  function onChange(event) {
    load()
    setQuery(event.target.value)
    setActive(0)
    setOpen(event.target.value.trim() !== '')
  }

  function onKeyDown(event) {
    if (!open) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()             // don't move the cursor in the box
      if (!results.length) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((active + step + results.length) % results.length)   // % wraps round
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault()
      openPage(results[active].url)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  function openPage(url) {
    setOpen(false)
    setQuery('')
    navigate(url)
  }

  // Close the list when clicking anywhere outside the search box.
  // The effect adds a listener to the whole page, and its cleanup removes it
  // again when the search box leaves the screen.
  useEffect(() => {
    function onClick(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <div className="search-box" ref={boxRef}>
      <i className="fas fa-search"></i>
      <input
        type="search" placeholder="Search notes…" autoComplete="off"
        aria-label="Search notes" aria-controls="searchResults" aria-expanded={open}
        value={query} onChange={onChange} onFocus={load} onKeyDown={onKeyDown}
      />
      <ul id="searchResults" className="search-results" role="listbox" hidden={!open}>
        {/* When React shows a list, each item needs a "key" that is
            different from its neighbours, so React can tell them apart. */}
        {results.map((page, i) => (
          <li key={page.url} role="option" aria-selected={i === active}>
            {/* React shows titles as text, never as HTML, so they're safe */}
            <Link to={page.url} onClick={() => openPage(page.url)}>
              <strong>{page.title}</strong><span>{page.where}</span>
            </Link>
          </li>
        ))}
        {results.length === 0 && <li className="empty">{index ? 'No notes found' : 'Loading…'}</li>}
      </ul>
    </div>
  )
}
