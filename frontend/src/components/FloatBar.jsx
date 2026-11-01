// The floating bar at the top of the page: logo, links and search.
// The same HTML and class names as backend/templates/partials/floatbar.html,
// so floatbar.css styles it. On phones, everything after the logo folds
// into the ☰ menu.
//
// This is the home page version. The note pages add "where you are",
// text size and previous/next buttons in the next step (4b).

import { useState } from 'react'
import { Link } from 'react-router'
import SearchBox from './SearchBox.jsx'

export default function FloatBar() {
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
          {/* Plain <a> for #jump links: the browser scrolls to the section itself */}
          <a href="/#subjects" onClick={closeMenu}>Subjects</a>
          <a href="/#how" onClick={closeMenu}>How it works</a>
          <Link to="/practice" onClick={closeMenu}>Practice</Link>
          <SearchBox />
        </div>
      </div>
    </nav>
  )
}
