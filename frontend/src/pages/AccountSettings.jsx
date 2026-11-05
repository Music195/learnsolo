// The unified Settings & Preferences page: /settings (and /account).
// Provides 3 tabs: Account & Security, Theme & Appearance, and Font & Typography.

import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth.jsx'
import { usePageTitle, useTheme, useFontSize, useFontFamily } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'
import Footer from '../components/Footer.jsx'
import '../styles/account.css'
import '../styles/settings.css'

export default function AccountSettings() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  usePageTitle('Settings & Preferences · Learn Solo')

  const [theme, toggleTheme, setTheme] = useTheme()
  const { fontSize, setFontSize, changeFontSize } = useFontSize()
  const { fontFamily, setFontFamily } = useFontFamily()

  // Tab state synced with URL hash (#account, #theme, #font)
  const [activeTab, setActiveTab] = useState(() => {
    if (location.hash === '#theme') return 'theme'
    if (location.hash === '#font') return 'font'
    return 'account'
  })

  useEffect(() => {
    if (location.hash === '#theme') setActiveTab('theme')
    else if (location.hash === '#font') setActiveTab('font')
    else if (location.hash === '#account') setActiveTab('account')
  }, [location.hash])

  function selectTab(tab) {
    setActiveTab(tab)
    window.location.hash = tab
  }

  // Account form states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(null)
  const [busyPassword, setBusyPassword] = useState(false)

  const [confirmReset, setConfirmReset] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(null)
  const [busyReset, setBusyReset] = useState(false)

  const initial = auth.user?.email ? auth.user.email.charAt(0).toUpperCase() : 'U'

  async function onPasswordSubmit(e) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword.length < 8) {
      setPasswordError('New password needs at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setBusyPassword(true)
    try {
      await auth.changePassword(currentPassword, newPassword)
      setPasswordSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.body?.error || 'Failed to update password. Please check your current password.')
    } finally {
      setBusyPassword(false)
    }
  }

  async function onResetProgress() {
    setBusyReset(true)
    setResetSuccess(null)
    try {
      await auth.resetAllProgress()
      setConfirmReset(false)
      setResetSuccess('All progress and test scores have been reset.')
    } catch {
      setPasswordError('Failed to reset progress. Please try again.')
    } finally {
      setBusyReset(false)
    }
  }

  const FONT_PRESETS = [
    { label: '85%', name: 'Compact', size: 85 },
    { label: '100%', name: 'Default', size: 100 },
    { label: '115%', name: 'Comfortable', size: 115 },
    { label: '130%', name: 'Large', size: 130 },
  ]

  const FONT_FAMILIES = [
    { id: 'default', label: 'Modern System Sans', sample: "system-ui, -apple-system, sans-serif" },
    { id: 'noto', label: 'Japanese Noto Sans', sample: "'Noto Sans JP', sans-serif" },
    { id: 'serif', label: 'Academic Serif', sample: "Georgia, 'Times New Roman', serif" },
  ]

  return (
    <>
      <FloatBar />

      <header className="note-header">
        <div className="note-header-inner">
          <p className="note-chips">
            <Link to="/"><i className="fas fa-house"></i> Home</Link>
            <span className="chip-practice"><i className="fas fa-gear"></i> Settings & Preferences</span>
          </p>
          <h1>Settings & Preferences</h1>
          <p className="hub-lead">Customize reading appearance, font scaling, account credentials, and study progress.</p>
        </div>
      </header>

      <main className="settings-page-card">
        {/* Horizontal Tab Navigation */}
        <div className="settings-page-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'account'}
            className={`settings-page-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => selectTab('account')}
          >
            <i className="fas fa-user-shield"></i>
            <span>Account & Security</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'theme'}
            className={`settings-page-tab ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => selectTab('theme')}
          >
            <i className="fas fa-palette"></i>
            <span>Theme & Appearance</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'font'}
            className={`settings-page-tab ${activeTab === 'font' ? 'active' : ''}`}
            onClick={() => selectTab('font')}
          >
            <i className="fas fa-font"></i>
            <span>Font & Typography</span>
          </button>
        </div>

        {/* ==================== TAB 1: ACCOUNT & SECURITY ==================== */}
        {activeTab === 'account' && (
          <div className="settings-tab-content">
            {auth.user ? (
              <>
                {/* User Identity Banner */}
                <div className="account-user-badge">
                  <div className="account-avatar">{initial}</div>
                  <div className="account-user-meta">
                    <strong className="account-user-email">{auth.user.email}</strong>
                    <span className="account-user-joined">
                      <i className="fas fa-calendar-check"></i> Member since {auth.user.created_at || 'Recently'}
                    </span>
                    <span className="account-user-status">
                      <i className="fas fa-cloud-arrow-up"></i> Cloud Progress Sync Active
                    </span>
                  </div>
                </div>

                {/* Change Password Section */}
                <section className="account-section">
                  <h2><i className="fas fa-key"></i> Change Password</h2>
                  <p className="section-desc">Update your password to keep your account and study progress secure.</p>

                  {passwordSuccess && <p className="account-success" role="status"><i className="fas fa-circle-check"></i> {passwordSuccess}</p>}
                  {passwordError && <p className="account-error" role="alert"><i className="fas fa-circle-exclamation"></i> {passwordError}</p>}

                  <form onSubmit={onPasswordSubmit}>
                    <label className="account-field">
                      <span>Current password</span>
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                      />
                    </label>

                    <label className="account-field">
                      <span>New password</span>
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                      />
                    </label>

                    <label className="account-field">
                      <span>Confirm new password</span>
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type your new password"
                      />
                    </label>

                    <button type="submit" className="account-submit" disabled={busyPassword}>
                      {busyPassword ? 'Updating…' : 'Update Password'}
                    </button>
                  </form>
                </section>

                {/* Reset Progress Section */}
                <section className="account-section">
                  <h2><i className="fas fa-triangle-exclamation"></i> Danger Zone</h2>
                  <p className="section-desc">
                    Resetting will clear all your solved checks, review bookmarks, and mock test scores. This action cannot be undone.
                  </p>

                  {resetSuccess && <p className="account-success" role="status"><i className="fas fa-circle-check"></i> {resetSuccess}</p>}

                  {!confirmReset ? (
                    <button
                      type="button"
                      className="account-btn-danger"
                      onClick={() => setConfirmReset(true)}
                    >
                      <i className="fas fa-rotate-left"></i> Reset All Progress Data
                    </button>
                  ) : (
                    <div className="account-confirm-box">
                      <p><strong>Are you completely sure?</strong> All saved marks and test scores will be permanently deleted.</p>
                      <div className="confirm-actions">
                        <button
                          type="button"
                          className="account-btn-danger"
                          onClick={onResetProgress}
                          disabled={busyReset}
                        >
                          {busyReset ? 'Resetting…' : 'Yes, Delete Everything'}
                        </button>
                        <button
                          type="button"
                          className="account-btn-secondary"
                          onClick={() => setConfirmReset(false)}
                          disabled={busyReset}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Session Logout */}
                <section className="account-section account-section-last">
                  <h2><i className="fas fa-arrow-right-from-bracket"></i> Session</h2>
                  <p className="section-desc">Sign out from this device whenever you are finished studying.</p>
                  <button
                    type="button"
                    className="account-btn-logout"
                    onClick={async () => {
                      await auth.logout()
                      navigate('/')
                    }}
                  >
                    <i className="fas fa-right-from-bracket"></i> Log out from LearnSolo
                  </button>
                </section>
              </>
            ) : (
              <div className="settings-guest-view" style={{ padding: '24px 0' }}>
                <div className="settings-guest-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <h3>Guest Account</h3>
                <p style={{ maxWidth: '440px', margin: '0 auto 20px' }}>
                  You are currently using LearnSolo as a guest. Your progress is saved only in this browser session.
                  Log in or create a free account to sync scores across your devices.
                </p>
                <div className="settings-account-actions" style={{ maxWidth: '300px', margin: '0 auto' }}>
                  <Link to="/login" className="settings-action-btn primary">
                    <i className="fas fa-right-to-bracket"></i> Log In
                  </Link>
                  <Link to="/signup" className="settings-action-btn secondary">
                    <i className="fas fa-user-plus"></i> Create Free Account
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: THEME & APPEARANCE ==================== */}
        {activeTab === 'theme' && (
          <div className="settings-tab-content">
            <section className="settings-page-section">
              <h2><i className="fas fa-palette"></i> Color Mode</h2>
              <p className="section-desc">Choose between daytime light theme or high-contrast night mode.</p>

              <div className="settings-theme-grid" style={{ marginBottom: '24px' }}>
                <button
                  type="button"
                  className={`theme-option-card ${theme === 'light' ? 'selected' : ''}`}
                  onClick={() => setTheme('light')}
                  style={{ padding: '24px 16px' }}
                >
                  <div className="theme-card-icon light" style={{ width: '56px', height: '56px', fontSize: '1.6rem' }}>
                    <i className="fas fa-sun"></i>
                  </div>
                  <div className="theme-card-info">
                    <strong style={{ fontSize: '1.1rem' }}>Light Mode</strong>
                    <span style={{ fontSize: '0.88rem' }}>Clean, paper-like reading experience</span>
                  </div>
                  {theme === 'light' ? (
                    <span className="theme-active-pill"><i className="fas fa-check"></i> Active</span>
                  ) : (
                    <span className="settings-action-btn secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', width: 'auto' }}>Select</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`theme-option-card ${theme === 'dark' ? 'selected' : ''}`}
                  onClick={() => setTheme('dark')}
                  style={{ padding: '24px 16px' }}
                >
                  <div className="theme-card-icon dark" style={{ width: '56px', height: '56px', fontSize: '1.6rem' }}>
                    <i className="fas fa-moon"></i>
                  </div>
                  <div className="theme-card-info">
                    <strong style={{ fontSize: '1.1rem' }}>Dark Mode</strong>
                    <span style={{ fontSize: '0.88rem' }}>High-contrast, easy on the eyes at night</span>
                  </div>
                  {theme === 'dark' ? (
                    <span className="theme-active-pill"><i className="fas fa-check"></i> Active</span>
                  ) : (
                    <span className="settings-action-btn secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', width: 'auto' }}>Select</span>
                  )}
                </button>
              </div>

              <div className="settings-preview-note" style={{ padding: '14px 18px', fontSize: '0.92rem' }}>
                <i className="fas fa-shield-halved" style={{ fontSize: '1.1rem' }}></i>
                <div>
                  <strong>Zero-Flash Instant Persistence:</strong> Your theme selection is written to local storage and initialized before HTML paints, preventing screen flash on page reload.
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================== TAB 3: FONT & TYPOGRAPHY ==================== */}
        {activeTab === 'font' && (
          <div className="settings-tab-content">
            <section className="settings-page-section">
              <h2><i className="fas fa-text-height"></i> Reading Text Size</h2>
              <p className="section-desc">Scale note descriptions, worked examples, and exam questions to your preferred comfort.</p>

              <div className="settings-field-group">
                <div className="settings-field-label">
                  <span>Current Font Scale</span>
                  <span className="settings-badge-value" style={{ fontSize: '0.95rem' }}>{fontSize}%</span>
                </div>

                <div className="font-presets-row" style={{ gap: '10px', marginBottom: '16px' }}>
                  {FONT_PRESETS.map((p) => (
                    <button
                      key={p.size}
                      type="button"
                      className={`font-preset-btn ${fontSize === p.size ? 'selected' : ''}`}
                      onClick={() => setFontSize(p.size)}
                      style={{ padding: '12px 6px' }}
                    >
                      <strong style={{ fontSize: '1.15rem' }}>{p.label}</strong>
                      <small style={{ fontSize: '0.82rem' }}>{p.name}</small>
                    </button>
                  ))}
                </div>

                <div className="font-stepper-row" style={{ gap: '12px' }}>
                  <button
                    type="button"
                    className="font-step-btn"
                    onClick={() => changeFontSize(-1)}
                    disabled={fontSize <= 70}
                    style={{ padding: '10px 16px', fontSize: '0.92rem' }}
                  >
                    <i className="fas fa-minus"></i> A− Smaller (10%)
                  </button>
                  <button
                    type="button"
                    className="font-step-btn font-reset-btn"
                    onClick={() => setFontSize(100)}
                    style={{ padding: '10px 16px', fontSize: '0.92rem' }}
                  >
                    Reset (100%)
                  </button>
                  <button
                    type="button"
                    className="font-step-btn"
                    onClick={() => changeFontSize(1)}
                    disabled={fontSize >= 160}
                    style={{ padding: '10px 16px', fontSize: '0.92rem' }}
                  >
                    A+ Larger (10%) <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </section>

            <section className="settings-page-section">
              <h2><i className="fas fa-font"></i> Font Style Family</h2>
              <p className="section-desc">Select the typeface family used across math notes and language practice sets.</p>

              <div className="font-family-row" style={{ gap: '10px', marginBottom: '20px' }}>
                {FONT_FAMILIES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`font-family-chip ${fontFamily === f.id ? 'selected' : ''}`}
                    style={{ fontFamily: f.sample, padding: '12px 14px', fontSize: '0.95rem' }}
                    onClick={() => setFontFamily(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Big Live Interactive Preview Box */}
            <section className="settings-page-section">
              <h2><i className="fas fa-eye"></i> Dynamic Reading Preview</h2>
              <div
                className="font-live-preview"
                style={{
                  fontSize: `${fontSize}%`,
                  fontFamily: FONT_FAMILIES.find((f) => f.id === fontFamily)?.sample,
                  padding: '24px 20px',
                  borderRadius: '16px',
                }}
              >
                <div className="preview-tag">Live Reading Scale: {fontSize}%</div>
                <h3 style={{ margin: '8px 0 10px', fontSize: '1.35em' }}>Quadratic Functions & Exam Reading</h3>
                <p className="preview-jp" style={{ fontSize: '1.05em', lineHeight: '1.7' }}>
                  日本語能力試験の読解問題：次の文章を読んで、それぞれの問いに対する答えとして最もよいものを一つ選びなさい。
                </p>
                <p className="preview-math" style={{ fontSize: '1em', margin: '8px 0' }}>
                  Standard Formula: <code>y = ax² + bx + c</code>, Vertex Form: <code>y = a(x - p)² + q</code>
                </p>
                <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: '0.92em' }}>
                  LearnSolo allows independent learners to master high school and university entrance curricula at their own pace.
                </p>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
