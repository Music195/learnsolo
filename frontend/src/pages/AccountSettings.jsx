// The logged-in user's account and security settings page: /account.
// Allows managing password, reviewing account info, and controlling progress data.

import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth.jsx'
import { usePageTitle } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'
import Footer from '../components/Footer.jsx'
import '../styles/account.css'

export default function AccountSettings() {
  const auth = useAuth()
  usePageTitle('My Account & Security · Learn Solo')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(null)
  const [busyPassword, setBusyPassword] = useState(false)

  const [confirmReset, setConfirmReset] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(null)
  const [busyReset, setBusyReset] = useState(false)

  // If not logged in, redirect to /login
  if (!auth.user) {
    return <Navigate to="/login" state={{ from: '/account' }} replace />
  }

  const initial = auth.user.email ? auth.user.email.charAt(0).toUpperCase() : 'U'

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

  return (
    <>
      <FloatBar />

      <header className="note-header">
        <div className="note-header-inner">
          <p className="note-chips">
            <Link to="/"><i className="fas fa-house"></i> Home</Link>
            <span className="chip-practice"><i className="fas fa-user-gear"></i> Account Settings</span>
          </p>
          <h1>My Account</h1>
          <p className="hub-lead">Manage your credentials, view account status, and control your study progress.</p>
        </div>
      </header>

      <main className="account-settings-card">
        {/* User Identity Banner */}
        <div className="account-user-badge">
          <div className="account-avatar">
            {initial}
          </div>
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
              />
            </label>

            <label className="account-field">
              <span>New password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <small>At least 8 characters.</small>
            </label>

            <label className="account-field">
              <span>Confirm new password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            <button className="account-submit" type="submit" disabled={busyPassword}>
              {busyPassword ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Study Progress & Data Management */}
        <section className="account-section">
          <h2><i className="fas fa-database"></i> Study Progress & Data</h2>
          <p className="section-desc">
            Your problem marks, JLPT mock scores, and review flags are safely synced to the cloud.
          </p>

          {resetSuccess && <p className="account-success" role="status"><i className="fas fa-circle-check"></i> {resetSuccess}</p>}

          {!confirmReset ? (
            <button
              type="button"
              className="account-btn-danger"
              onClick={() => setConfirmReset(true)}
            >
              <i className="fas fa-trash-can"></i> Reset All Saved Progress
            </button>
          ) : (
            <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
              <p style={{ margin: '0 0 12px', color: '#991b1b', fontSize: '0.95rem', fontWeight: 600 }}>
                Are you sure? This will permanently clear all your saved test scores and solved marks from your account.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="account-btn-danger"
                  style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                  disabled={busyReset}
                  onClick={onResetProgress}
                >
                  {busyReset ? 'Resetting…' : 'Yes, Reset Everything'}
                </button>
                <button
                  type="button"
                  className="account-btn-secondary"
                  disabled={busyReset}
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Log Out Action */}
        <section className="account-section">
          <h2><i className="fas fa-arrow-right-from-bracket"></i> Session</h2>
          <button
            type="button"
            className="account-btn-logout"
            onClick={() => auth.logout()}
          >
            <i className="fas fa-right-from-bracket"></i> Log out from LearnSolo
          </button>
        </section>
      </main>

      <Footer />
    </>
  )
}
