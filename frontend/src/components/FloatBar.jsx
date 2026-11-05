// The floating bar at the top of the page: logo, links and search.
// Styled by src/styles/floatbar.css. On phones, everything after the logo folds
// into the ☰ menu.

import { useState } from 'react'
import { Link } from 'react-router'
import SearchBox from './SearchBox.jsx'
import NotificationBell from './NotificationBell.jsx'
import FeedbackModal from './FeedbackModal.jsx'
import SettingsPopover from './SettingsPopover.jsx'

export default function FloatBar({ location, nav, onTopics, topicsOpen }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav className="floatbar" aria-label="Main">
        <div className="floatbar-inner">
          {/* Logo + Brand Name */}
          <Link className="brand" to="/">
            <img src="/static/logo.png" alt="Learn Solo Logo" className="brand-logo" />
            <span>Learn Solo</span>
          </Link>
          <span className="beta" title="New notes and features are still being added">Beta</span>

          {/* "a && b" in JSX: show b only when a is there */}
          {location && <Crumbs location={location} />}

          <button
            className="menu-btn"
            aria-expanded={menuOpen}
            aria-controls="floatMenu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i className={menuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
          </button>

          {/* The "open" class shows the menu on phones (floatbar.css) */}
          <div className={'float-menu' + (menuOpen ? ' open' : '')} id="floatMenu">
            {/* Search Box - untouched */}
            <SearchBox />

            {location && (
              <>
                {/* Previous / next note (also the ← / → keys) */}
                <div className="bar-group" role="group" aria-label="Previous and next note">
                  <PagerButton link={nav.prev} label="Previous" icon="fa-chevron-left" onClick={closeMenu} />
                  <PagerButton link={nav.next} label="Next" icon="fa-chevron-right" onClick={closeMenu} />
                </div>

                {/* Opens the Topics sidebar (TopicsSidebar.jsx) */}
                {onTopics && (
                  <button className="bar-btn bar-topics" aria-controls="sidebar" aria-expanded={topicsOpen}
                          onClick={() => { closeMenu(); onTopics() }}>
                    <i className="fas fa-list-ul"></i> Topics
                  </button>
                )}
              </>
            )}

            {/* Notifications from creator */}
            <NotificationBell />

            {/* Hybrid Quick Settings (Theme, Font, Account & Feedback) */}
            <div className="settings-wrapper">
              <button
                type="button"
                className={`bar-btn bar-settings ${settingsOpen ? 'active' : ''}`}
                aria-label="Settings and Preferences"
                aria-expanded={settingsOpen}
                title="Settings (Theme, Font & Account)"
                onClick={() => { closeMenu(); setSettingsOpen(!settingsOpen) }}
              >
                <i className="fas fa-gear"></i>
                <span className="bar-settings-text">Settings</span>
              </button>
              <SettingsPopover
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onOpenFeedback={() => { setSettingsOpen(false); setFeedbackOpen(true) }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Feedback modal popup */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}

// Where you are, e.g. "Math C › Plane Vectors · 17 of 17".
// Each part links to the first note of that course / topic.
function Crumbs({ location }) {
  return (
    <div className="crumbs">
      <Link to={location.course_url ?? `/notes/${location.course_first}`}>{location.course}</Link>
      {location.topic && (
        <>
          <i className="fas fa-chevron-right"></i>
          <Link to={location.topic_url ?? `/notes/${location.topic_first}`}>{location.topic}</Link>
        </>
      )}
      <span className="crumbs-count">
        {/* {' '} adds a space; JSX drops spaces at the start and end of lines */}
        · {location.kind_url ? <><Link to={location.kind_url}>{location.kind}</Link>{' '}</> : location.kind && `${location.kind} `}
        {location.index} of {location.total}
      </span>
    </div>
  )
}

// One previous/next button: a link, or a greyed-out icon at either end.
// `link` is nav.prev or nav.next from the API: { url, title, where } or null.
function PagerButton({ link, label, icon, onClick }) {
  if (!link) {
    return <span className="bar-btn disabled" aria-hidden="true"><i className={`fas ${icon}`}></i></span>
  }
  return (
    <Link className="bar-btn" to={link.url} onClick={onClick}
          title={`${label}: ${link.title}`} aria-label={`${label}: ${link.title}`}>
      <i className={`fas ${icon}`}></i>
    </Link>
  )
}
