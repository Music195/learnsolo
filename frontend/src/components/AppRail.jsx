// AppRail.jsx — Slim Icon Rail Navigation (Left vertical rail on desktop, bottom bar on mobile)
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import NotificationBell from './NotificationBell.jsx'
import SettingsPopover from './SettingsPopover.jsx'
import FeedbackModal from './FeedbackModal.jsx'
import SearchModal from './SearchModal.jsx'

export default function AppRail({ location: noteLocation, nav, onTopics, topicsOpen }) {
  const currentLoc = useLocation()
  const pathname = currentLoc.pathname

  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  // Active path helpers
  const isHome = pathname === '/'
  const isNotes = pathname.startsWith('/notes')
  const isPractice = pathname.startsWith('/practice')
  const isPast = pathname.startsWith('/past')
  const isSettings = pathname.startsWith('/settings') || pathname.startsWith('/account')

  // Keyboard shortcut: Ctrl+K or Cmd+K to open Search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <aside className="app-rail" aria-label="Main Navigation">
        {/* TOP / PRIMARY SECTION */}
        <div className="rail-top">
          {/* Brand Mark */}
          <Link to="/" className="rail-brand" title="Learn Solo — Home" aria-label="Learn Solo Home">
            <img src="/static/logo.png" alt="Learn Solo" className="rail-brand-logo" />
            <span className="rail-brand-beta" title="Beta version">β</span>
          </Link>

          <div className="rail-divider" aria-hidden="true" />

          {/* Primary Navigation Buttons */}
          <nav className="rail-nav">
            {/* 1. Home */}
            <Link
              to="/"
              className={`rail-btn ${isHome ? 'active' : ''}`}
              title="Home (Catalog)"
              aria-label="Home"
            >
              <i className="fas fa-house"></i>
              <span className="rail-tooltip">Home</span>
            </Link>

            {/* 2. Topics / Notes */}
            {onTopics ? (
              <button
                type="button"
                className={`rail-btn bar-topics ${topicsOpen || isNotes ? 'active' : ''}`}
                onClick={onTopics}
                title="Curriculum Topics (Alt+T)"
                aria-label="Topics"
                aria-expanded={topicsOpen}
              >
                <i className="fas fa-book-open"></i>
                <span className="rail-tooltip">Topics</span>
              </button>
            ) : (
              <Link
                to="/notes/math-1/numbers-and-sets/01-natural-numbers-and-integers"
                className={`rail-btn ${isNotes ? 'active' : ''}`}
                title="Course Notes"
                aria-label="Notes"
              >
                <i className="fas fa-book-open"></i>
                <span className="rail-tooltip">Notes</span>
              </Link>
            )}

            {/* 3. Practice Sets */}
            <Link
              to="/practice"
              className={`rail-btn ${isPractice ? 'active' : ''}`}
              title="Practice Sets & Problems"
              aria-label="Practice"
            >
              <i className="fas fa-puzzle-piece"></i>
              <span className="rail-tooltip">Practice</span>
            </Link>

            {/* 4. Past Papers */}
            <Link
              to="/past"
              className={`rail-btn ${isPast ? 'active' : ''}`}
              title="Mock Exams & Past Papers"
              aria-label="Past Papers"
            >
              <i className="fas fa-file-pen"></i>
              <span className="rail-tooltip">Exams</span>
            </Link>

            {/* 5. Search Trigger */}
            <button
              type="button"
              className={`rail-btn ${searchOpen ? 'active' : ''}`}
              onClick={() => setSearchOpen(true)}
              title="Search notes (Ctrl + K)"
              aria-label="Search"
            >
              <i className="fas fa-search"></i>
              <span className="rail-tooltip">Search (Ctrl+K)</span>
            </button>
          </nav>
        </div>

        {/* MIDDLE SECTION: Note Progression (Desktop only) */}
        {nav && (
          <div className="rail-mid" aria-label="Note Progression">
            <div className="rail-divider" aria-hidden="true" />

            {/* Previous Note Stepper */}
            {nav.prev ? (
              <Link
                to={nav.prev.url}
                className="rail-btn rail-stepper"
                title={`Previous: ${nav.prev.title}`}
                aria-label={`Previous: ${nav.prev.title}`}
              >
                <i className="fas fa-chevron-up"></i>
                <span className="rail-tooltip">Prev: {nav.prev.title}</span>
              </Link>
            ) : (
              <button
                type="button"
                className="rail-btn rail-stepper disabled"
                disabled
                title="First note"
                aria-label="First note"
              >
                <i className="fas fa-chevron-up"></i>
              </button>
            )}

            {/* Note Index / Total Indicator */}
            {noteLocation?.index && noteLocation?.total && (
              <div
                className="rail-counter"
                title={`Note ${noteLocation.index} of ${noteLocation.total}${noteLocation.topic ? ` in ${noteLocation.topic}` : ''}`}
              >
                <span className="rail-counter-num">{noteLocation.index}</span>
                <span className="rail-counter-sep">/</span>
                <span className="rail-counter-tot">{noteLocation.total}</span>
              </div>
            )}

            {/* Next Note Stepper */}
            {nav.next ? (
              <Link
                to={nav.next.url}
                className="rail-btn rail-stepper"
                title={`Next: ${nav.next.title}`}
                aria-label={`Next: ${nav.next.title}`}
              >
                <i className="fas fa-chevron-down"></i>
                <span className="rail-tooltip">Next: {nav.next.title}</span>
              </Link>
            ) : (
              <button
                type="button"
                className="rail-btn rail-stepper disabled"
                disabled
                title="Last note"
                aria-label="Last note"
              >
                <i className="fas fa-chevron-down"></i>
              </button>
            )}
          </div>
        )}

        {/* BOTTOM SECTION: Notifications & Settings */}
        <div className="rail-bottom">
          <div className="rail-divider" aria-hidden="true" />

          {/* Announcements / Notifications */}
          <div className="rail-bell-wrapper">
            <NotificationBell buttonClass="rail-btn" />
            <span className="rail-tooltip">Announcements</span>
          </div>

          {/* Settings & Appearance Popover */}
          <div className="settings-wrapper">
            <button
              type="button"
              className={`rail-btn bar-settings ${settingsOpen || isSettings ? 'active' : ''}`}
              onClick={() => setSettingsOpen(!settingsOpen)}
              title="Settings & Appearance"
              aria-label="Settings"
              aria-expanded={settingsOpen}
            >
              <i className="fas fa-gear"></i>
              <span className="rail-tooltip">Settings</span>
            </button>

            <SettingsPopover
              isOpen={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              onOpenFeedback={() => {
                setSettingsOpen(false)
                setFeedbackOpen(true)
              }}
            />
          </div>
        </div>
      </aside>

      {/* Global Quick Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Global Feedback Modal */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
