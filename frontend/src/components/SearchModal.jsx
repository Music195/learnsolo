import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { fetchJson } from '../api.js'

// Cached across sessions
let indexPromise = null
function loadIndex() {
  indexPromise = indexPromise || fetchJson('/api/search-index').catch(() => [])
  return indexPromise
}

function findPages(index, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  return index
    .filter((page) => words.every((w) => `${page.title} ${page.where}`.toLowerCase().includes(w)))
    .slice(0, 8)
}

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(null)
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      loadIndex().then(setIndex)
      setQuery('')
      setActive(0)
      // Focus after render
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Global Esc key listener
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const results = index ? findPages(index, query) : []

  function handleSelect(url) {
    onClose()
    navigate(url)
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!results.length) return
      setActive((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!results.length) return
      setActive((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[active]) {
        handleSelect(results[active].url)
      }
    }
  }

  return (
    <div className="search-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search Notes">
      <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <i className="fas fa-search search-modal-icon"></i>
          <input
            ref={inputRef}
            type="search"
            className="search-modal-input"
            placeholder="Search notes, formulas, topics (e.g. Vectors, Kinematics)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              className="search-modal-clear"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear input"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
          <button type="button" className="search-modal-esc" onClick={onClose} title="Close search (Esc)">
            <kbd>ESC</kbd>
          </button>
        </div>

        <div className="search-modal-body" ref={resultsRef}>
          {query.trim() === '' ? (
            <div className="search-modal-empty-hint">
              <i className="fas fa-compass"></i>
              <p>Type keywords to search through all interactive notes, practice sets, and mock papers.</p>
            </div>
          ) : results.length > 0 ? (
            <ul className="search-modal-results" role="listbox">
              {results.map((page, i) => (
                <li
                  key={page.url}
                  className={`search-modal-item ${i === active ? 'active' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => handleSelect(page.url)}
                  role="option"
                  aria-selected={i === active}
                >
                  <div className="search-item-info">
                    <strong className="search-item-title">{page.title}</strong>
                    <span className="search-item-where">{page.where}</span>
                  </div>
                  <i className="fas fa-arrow-right search-item-arrow"></i>
                </li>
              ))}
            </ul>
          ) : (
            <div className="search-modal-empty-hint">
              <i className="fas fa-file-circle-question"></i>
              <p>{index ? 'No matching notes found.' : 'Loading course index...'}</p>
            </div>
          )}
        </div>

        <div className="search-modal-footer">
          <div className="search-shortcuts">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <span className="search-brand-tag">LearnSolo Quick Find</span>
        </div>
      </div>
    </div>
  )
}
