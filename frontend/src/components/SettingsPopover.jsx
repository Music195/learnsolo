import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth.jsx'
import { useTheme, useFontSize, useFontFamily } from '../pageHooks.js'

export default function SettingsPopover({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('theme')
  const [theme, toggleTheme, setTheme] = useTheme()
  const { fontSize, setFontSize, changeFontSize } = useFontSize()
  const { fontFamily, setFontFamily } = useFontFamily()
  const auth = useAuth()
  const navigate = useNavigate()
  const popoverRef = useRef(null)

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function onMouseDown(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose()
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', onMouseDown)
      document.addEventListener('keydown', onKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const initial = auth.user?.email ? auth.user.email.charAt(0).toUpperCase() : '?'

  const FONT_PRESETS = [
    { label: '85%', name: 'Compact', size: 85 },
    { label: '100%', name: 'Default', size: 100 },
    { label: '115%', name: 'Comfortable', size: 115 },
    { label: '130%', name: 'Large', size: 130 },
  ]

  const FONT_FAMILIES = [
    { id: 'default', label: 'System Sans', sample: 'system-ui' },
    { id: 'noto', label: 'Noto Sans JP', sample: "'Noto Sans JP', sans-serif" },
    { id: 'serif', label: 'Academic Serif', sample: "Georgia, 'Times New Roman', serif" },
  ]

  return (
    <div className="settings-popover" ref={popoverRef} role="dialog" aria-modal="true" aria-label="Quick Settings">
      {/* Popover Header */}
      <div className="settings-popover-header">
        <div className="settings-header-title">
          <i className="fas fa-gear"></i>
          <span>Preferences & Settings</span>
        </div>
        <button
          type="button"
          className="settings-popover-close"
          aria-label="Close settings"
          onClick={onClose}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Segmented Tab Controls */}
      <div className="settings-tab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'theme'}
          className={`settings-tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
          onClick={() => setActiveTab('theme')}
        >
          <i className="fas fa-palette"></i>
          <span>Theme</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'font'}
          className={`settings-tab-btn ${activeTab === 'font' ? 'active' : ''}`}
          onClick={() => setActiveTab('font')}
        >
          <i className="fas fa-font"></i>
          <span>Font</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'account'}
          className={`settings-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <i className="fas fa-user"></i>
          <span>Account</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="settings-popover-body">
        {/* ===================== THEME TAB ===================== */}
        {activeTab === 'theme' && (
          <div className="settings-tab-panel" role="tabpanel">
            <p className="settings-section-hint">Select your preferred viewing theme:</p>
            <div className="settings-theme-grid">
              <button
                type="button"
                className={`theme-option-card ${theme === 'light' ? 'selected' : ''}`}
                onClick={() => setTheme('light')}
              >
                <div className="theme-card-icon light">
                  <i className="fas fa-sun"></i>
                </div>
                <div className="theme-card-info">
                  <strong>Light Mode</strong>
                  <span>Crisp & paper-like</span>
                </div>
                {theme === 'light' && <span className="theme-active-pill"><i className="fas fa-check"></i> Active</span>}
              </button>

              <button
                type="button"
                className={`theme-option-card ${theme === 'dark' ? 'selected' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <div className="theme-card-icon dark">
                  <i className="fas fa-moon"></i>
                </div>
                <div className="theme-card-info">
                  <strong>Dark Mode</strong>
                  <span>Easy on the eyes</span>
                </div>
                {theme === 'dark' && <span className="theme-active-pill"><i className="fas fa-check"></i> Active</span>}
              </button>
            </div>

            <div className="settings-preview-note">
              <i className="fas fa-circle-info"></i>
              <span>Theme changes persist automatically and apply instantly to all study pages.</span>
            </div>
          </div>
        )}

        {/* ===================== FONT TAB ===================== */}
        {activeTab === 'font' && (
          <div className="settings-tab-panel" role="tabpanel">
            <div className="settings-field-group">
              <div className="settings-field-label">
                <span>Reading Text Size</span>
                <span className="settings-badge-value">{fontSize}%</span>
              </div>

              {/* Presets */}
              <div className="font-presets-row">
                {FONT_PRESETS.map((p) => (
                  <button
                    key={p.size}
                    type="button"
                    className={`font-preset-btn ${fontSize === p.size ? 'selected' : ''}`}
                    onClick={() => setFontSize(p.size)}
                  >
                    <strong>{p.label}</strong>
                    <small>{p.name}</small>
                  </button>
                ))}
              </div>

              {/* Stepper */}
              <div className="font-stepper-row">
                <button
                  type="button"
                  className="font-step-btn"
                  onClick={() => changeFontSize(-1)}
                  disabled={fontSize <= 70}
                  title="Smaller text (10%)"
                >
                  <i className="fas fa-minus"></i> A− Smaller
                </button>
                <button
                  type="button"
                  className="font-step-btn font-reset-btn"
                  onClick={() => setFontSize(100)}
                  title="Reset to 100%"
                >
                  Reset (100%)
                </button>
                <button
                  type="button"
                  className="font-step-btn"
                  onClick={() => changeFontSize(1)}
                  disabled={fontSize >= 160}
                  title="Larger text (10%)"
                >
                  A+ Larger <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>

            {/* Font Family */}
            <div className="settings-field-group">
              <div className="settings-field-label">
                <span>Font Style</span>
              </div>
              <div className="font-family-row">
                {FONT_FAMILIES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`font-family-chip ${fontFamily === f.id ? 'selected' : ''}`}
                    style={{ fontFamily: f.sample }}
                    onClick={() => setFontFamily(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div
              className="font-live-preview"
              style={{
                fontSize: `${fontSize}%`,
                fontFamily: FONT_FAMILIES.find((f) => f.id === fontFamily)?.sample,
              }}
            >
              <div className="preview-tag">Live Preview</div>
              <p className="preview-jp">本日は晴天なり。日本語能力試験の勉強を進めましょう。</p>
              <p className="preview-math">Quadratic Formula: <code>x = (-b ± √(b² - 4ac)) / (2a)</code></p>
            </div>
          </div>
        )}

        {/* ===================== ACCOUNT TAB ===================== */}
        {activeTab === 'account' && (
          <div className="settings-tab-panel" role="tabpanel">
            {auth.user ? (
              <div className="settings-account-view">
                <div className="settings-account-badge">
                  <div className="settings-avatar">{initial}</div>
                  <div className="settings-account-details">
                    <strong className="settings-user-email">{auth.user.email}</strong>
                    <span className="settings-user-status">
                      <i className="fas fa-circle-check"></i> Active Session · Logged in
                    </span>
                  </div>
                </div>

                <div className="settings-account-actions">
                  <Link
                    to="/settings"
                    onClick={onClose}
                    className="settings-action-btn primary"
                  >
                    <i className="fas fa-key"></i>
                    <span>Manage Password & Security</span>
                  </Link>

                  <button
                    type="button"
                    className="settings-action-btn logout"
                    onClick={async () => {
                      onClose()
                      await auth.logout()
                      navigate('/')
                    }}
                  >
                    <i className="fas fa-right-from-bracket"></i>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="settings-guest-view">
                <div className="settings-guest-icon">
                  <i className="fas fa-user-circle"></i>
                </div>
                <h4>Guest Session</h4>
                <p>Log in to save test scores, sync learning progress, and track your JLPT readiness across devices.</p>
                <div className="settings-account-actions">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="settings-action-btn primary"
                  >
                    <i className="fas fa-right-to-bracket"></i>
                    <span>Log In to LearnSolo</span>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={onClose}
                    className="settings-action-btn secondary"
                  >
                    <i className="fas fa-user-plus"></i>
                    <span>Create an Account</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer shortcut to full page */}
      <div className="settings-popover-footer">
        <Link to="/settings" onClick={onClose} className="settings-popover-full-link">
          <span><i className="fas fa-sliders"></i> Open Full Settings & Preferences Page</span>
          <i className="fas fa-arrow-right"></i>
        </Link>
      </div>
    </div>
  )
}
