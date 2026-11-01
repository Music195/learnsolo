// The floating bar at the top of the page: logo, links and search.
// The same HTML and class names as backend/templates/partials/floatbar.html,
// so floatbar.css styles it. On phones, everything after the logo folds
// into the ☰ menu.
//
// Two versions, chosen by the props (the inputs a page passes in):
//   <FloatBar />                    home page: Subjects, How it works, Practice, search
//   <FloatBar location={...} nav={...} onTextSize={...} onTopics={...} topicsOpen={...} />
//                                   note page: "where you are", search, text size,
//                                   previous/next and the Topics button

import { useState } from 'react'
import { Link } from 'react-router'
import SearchBox from './SearchBox.jsx'

export default function FloatBar({ location, nav, onTextSize, onTopics, topicsOpen }) {
  // Is the phone menu open? false at the start.
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="floatbar" aria-label="Main">
      {/* In JSX, class is written className (class is a JavaScript word) */}
      <div className="floatbar-inner">
        {/* <Link> changes page inside React, without reloading the whole site */}
        <Link className="brand" to="/"><i className="fas fa-book-open"></i> Learn Solo</Link>
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
          {!location && (
            <>
              {/* Plain <a> for #jump links: the browser scrolls to the section itself */}
              <a href="/#subjects" onClick={closeMenu}>Subjects</a>
              <a href="/#how" onClick={closeMenu}>How it works</a>
              <Link to="/practice" onClick={closeMenu}>Practice</Link>
            </>
          )}

          <SearchBox />

          {location && (
            <>
              {/* Text size for the note (saved for next time) */}
              <div className="bar-group" role="group" aria-label="Text size">
                <button className="bar-btn" title="Smaller text" aria-label="Smaller text" onClick={() => onTextSize(-1)}>A−</button>
                <button className="bar-btn" title="Bigger text" aria-label="Bigger text" onClick={() => onTextSize(1)}>A+</button>
              </div>

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
        </div>
      </div>
    </nav>
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
