// TopicsFlyout.jsx — State B: Flyout curriculum drawer docked beside the Slim Icon Rail
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { fetchJson } from '../api.js'

let notesCache = null
function loadNotes() {
  notesCache = notesCache || fetchJson('/api/notes').catch(() => null)
  return notesCache
}

export default function TopicsFlyout({ isOpen, onClose, currentPath }) {
  const [data, setData] = useState(null)
  const [course, setCourse] = useState('')
  const [topic, setTopic] = useState('')
  const [filterText, setFilterText] = useState('')
  const listRef = useRef(null)
  const navigate = useNavigate()

  // Load /api/notes once
  useEffect(() => {
    loadNotes().then((res) => {
      if (res) setData(res)
    })
  }, [])

  // Sync course and topic when opened or path changes
  useEffect(() => {
    if (!data) return

    if (currentPath && currentPath.includes('/')) {
      const [c, t] = currentPath.split('/')
      if (c) setCourse(c)
      if (t) setTopic(t)
    } else if (!course && data.folders?.length) {
      const defaultCourse = data.folders[0]
      setCourse(defaultCourse)
    }
  }, [isOpen, currentPath, data])

  // Esc key listener
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

  // Auto-scroll to currently reading note on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        listRef.current?.querySelector('.flyout-note-item.current')?.scrollIntoView({ block: 'center' })
      }, 80)
    }
  }, [isOpen, course, topic])

  if (!isOpen) return null

  const names = data?.display_names || { courses: {}, topics: {} }
  const folders = data?.folders || []

  // Get available topics for selected course
  const availableTopics = data?.notes_meta
    ? [...new Set(
        data.notes_meta
          .map((n) => n.path.split('/'))
          .filter((parts) => parts.length > 2 && parts[0] === course)
          .map((parts) => parts[1])
      )]
    : []

  const activeTopic = availableTopics.includes(topic) ? topic : availableTopics[0] || ''

  // Filter notes in chosen course & topic
  const notes = (data?.notes_meta || [])
    .filter((n) => n.path.startsWith(`${course}/${activeTopic}/`))
    .filter((n) => {
      if (!filterText.trim()) return true
      return n.title.toLowerCase().includes(filterText.toLowerCase())
    })

  const currentCourseName = names.courses?.[course] || course || 'Select Course'
  const currentTopicName = names.topics?.[activeTopic] || activeTopic || 'Select Topic'

  return (
    <>
      {/* Backdrop */}
      <div className="flyout-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Flyout Drawer Panel */}
      <aside className="topics-flyout" aria-label="Course Curriculum" role="dialog">
        {/* Header */}
        <div className="flyout-header">
          <div className="flyout-header-info">
            <span className="flyout-badge">Curriculum</span>
            <h3 className="flyout-title">{currentCourseName}</h3>
          </div>
          <button
            type="button"
            className="flyout-close-btn"
            onClick={onClose}
            title="Close drawer (Esc)"
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Controls: Course & Topic Selectors */}
        <div className="flyout-controls">
          <div className="flyout-field">
            <label htmlFor="flyoutCourseSelect">Course</label>
            <div className="flyout-select-wrapper">
              <select
                id="flyoutCourseSelect"
                value={course}
                onChange={(e) => {
                  setCourse(e.target.value)
                  setTopic('')
                }}
              >
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {names.courses?.[f] || f}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down flyout-select-chevron"></i>
            </div>
          </div>

          <div className="flyout-field">
            <label htmlFor="flyoutTopicSelect">Topic</label>
            <div className="flyout-select-wrapper">
              <select
                id="flyoutTopicSelect"
                value={activeTopic}
                onChange={(e) => setTopic(e.target.value)}
              >
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {names.topics?.[t] || t}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down flyout-select-chevron"></i>
            </div>
          </div>

          {/* Quick Filter */}
          <div className="flyout-search-wrap">
            <i className="fas fa-filter"></i>
            <input
              type="text"
              placeholder={`Filter notes in ${currentTopicName}...`}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            {filterText && (
              <button
                type="button"
                className="flyout-clear-filter"
                onClick={() => setFilterText('')}
                aria-label="Clear filter"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Notes List */}
        <div className="flyout-list-container" ref={listRef}>
          <div className="flyout-list-header">
            <span>Lessons ({notes.length})</span>
            {currentPath && (
              <span className="flyout-hint">Click note to jump</span>
            )}
          </div>

          <ol className="flyout-note-list">
            {notes.map((note, index) => {
              const isCurrent = currentPath && note.path === currentPath
              return (
                <li key={note.path}>
                  <Link
                    to={`/notes/${note.path}`}
                    className={`flyout-note-item ${isCurrent ? 'current' : ''}`}
                    onClick={onClose}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    <span className="flyout-note-num">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flyout-note-text">{note.title}</span>
                    {isCurrent && (
                      <span className="flyout-now-badge">
                        <i className="fas fa-play"></i> Now
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ol>

          {notes.length === 0 && (
            <div className="flyout-empty">
              <i className="fas fa-inbox"></i>
              <p>No notes matched &ldquo;{filterText}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Footer Shortcut to Practice */}
        <div className="flyout-footer">
          <Link
            to="/practice"
            className="flyout-practice-link"
            onClick={onClose}
          >
            <i className="fas fa-puzzle-piece"></i>
            <span>Practice sets for this course</span>
            <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
      </aside>
    </>
  )
}
