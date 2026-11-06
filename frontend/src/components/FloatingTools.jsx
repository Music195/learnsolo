import { useState, useRef, useEffect } from 'react'
import FloatingDictionary from './FloatingDictionary.jsx'
import FloatingCalculator from './FloatingCalculator.jsx'
import '../styles/floating-tools.css'

export default function FloatingTools() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dictOpen, setDictOpen] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const containerRef = useRef(null)

  // Close speed dial menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [menuOpen])

  const toggleDictionary = () => {
    setDictOpen((prev) => !prev)
    setMenuOpen(false)
  }

  const toggleCalculator = () => {
    setCalcOpen((prev) => !prev)
    setMenuOpen(false)
  }

  const isAnyToolOpen = dictOpen || calcOpen

  return (
    <>
      {/* Floating Speed-Dial Launcher */}
      <div className="floating-tools-container" ref={containerRef}>
        {menuOpen && (
          <div className="speed-dial-menu">
            {/* Dictionary Option */}
            <button
              type="button"
              className={`speed-dial-item dict ${dictOpen ? 'is-open' : ''}`}
              onClick={toggleDictionary}
              title="Open 3-Way Dictionary (Burmese / English / Japanese)"
            >
              <span className="speed-dial-icon">
                <i className="fas fa-language"></i>
              </span>
              <span>3-Way Dictionary</span>
              {dictOpen && <span className="speed-dial-active-tag">Open</span>}
            </button>

            {/* Calculator Option */}
            <button
              type="button"
              className={`speed-dial-item calc ${calcOpen ? 'is-open' : ''}`}
              onClick={toggleCalculator}
              title="Open Scientific Calculator (Math & Physics)"
            >
              <span className="speed-dial-icon">
                <i className="fas fa-calculator"></i>
              </span>
              <span>Scientific Calculator</span>
              {calcOpen && <span className="speed-dial-active-tag">Open</span>}
            </button>
          </div>
        )}

        {/* Main Floating Launcher Button */}
        <button
          type="button"
          className={`floating-tools-btn ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close Tools Menu' : 'Open Tools Menu'}
          title="Study Tools (Dictionary & Calculator)"
        >
          <i className={menuOpen ? 'fas fa-plus' : 'fas fa-shapes'}></i>
          {isAnyToolOpen && !menuOpen && <span className="floating-tools-indicator" />}
        </button>
      </div>

      {/* Floating Drawers */}
      <FloatingDictionary
        isOpen={dictOpen}
        onClose={() => setDictOpen(false)}
        isEmbedded={true}
      />

      <FloatingCalculator
        isOpen={calcOpen}
        onClose={() => setCalcOpen(false)}
      />
    </>
  )
}
