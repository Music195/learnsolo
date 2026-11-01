// The log in and sign up pages: /login and /signup.
// One component for both, because they are the same form:
//   <Account mode="login" />    email + password → log in
//   <Account mode="signup" />   email + password → make an account (and log in)
//
// After it works, you go back to the page you came from. Links to /login
// pass that page along as `state` (see FloatBar.jsx); with none, you go home.
// Progress saved in this browser is added to the account (auth.jsx).

import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth.jsx'
import { usePageTitle } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'

// The words that differ between the two pages
const TEXT = {
  login: {
    title: 'Log in',
    lead: 'Log in to keep your practice progress on every device.',
    button: 'Log in',
    switchText: 'No account yet?',
    switchLink: '/signup',
    switchLabel: 'Sign up',
  },
  signup: {
    title: 'Sign up',
    lead: 'Make a free account to keep your practice progress on every device. Progress you have saved in this browser is added to it.',
    button: 'Make my account',
    switchText: 'Already have an account?',
    switchLink: '/login',
    switchLabel: 'Log in',
  },
}

export default function Account({ mode }) {
  const text = TEXT[mode]
  const auth = useAuth()
  const from = useLocation().state?.from || '/'   // where to go afterwards
  usePageTitle(`${text.title} · Learn Solo`)

  // What is typed in the boxes. A "controlled" input: React keeps the value,
  // and onChange updates it on every key.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)        // the message to show, or null
  const [busy, setBusy] = useState(false)         // true while waiting for the server

  // Logged in: go back to where you came from. This happens right after the
  // form works (auth.user changes), or if you come back here while logged in.
  // replace: Back won't return to the form.
  if (auth.user) return <Navigate to={from} replace />

  async function onSubmit(event) {
    event.preventDefault()          // stop the browser's own form sending (it would reload the page)
    setBusy(true)
    setError(null)
    try {
      // On success auth.user is set, and the <Navigate> above takes you back
      await (mode === 'login' ? auth.login(email, password) : auth.signup(email, password))
    } catch (err) {
      // The server explains what's wrong in err.body.error (backend/api/auth.py)
      setError(err.body?.error || 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <>
      <FloatBar />

      <header className="note-header">
        <div className="note-header-inner">
          <p className="note-chips"><Link to="/"><i className="fas fa-house"></i> Home</Link></p>
          <h1>{text.title}</h1>
          <p className="hub-lead">{text.lead}</p>
        </div>
      </header>

      <main className="account-card">
        <form onSubmit={onSubmit}>
          {/* role="alert": screen readers read the message out when it appears */}
          {error && <p className="account-error" role="alert">{error}</p>}

          <label className="account-field">
            <span>Email</span>
            <input type="email" autoComplete="email" required value={email}
                   onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className="account-field">
            <span>Password</span>
            {/* autoComplete tells password managers whether to fill in a saved
                password (current-password) or offer a new one (new-password) */}
            <input type="password" required minLength={mode === 'signup' ? 8 : undefined}
                   autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                   value={password} onChange={(e) => setPassword(e.target.value)} />
            {mode === 'signup' && <small>At least 8 characters.</small>}
          </label>

          <button className="account-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : text.button}
          </button>
        </form>

        <p className="account-switch">
          {text.switchText}{' '}
          {/* state={{ from }}: still go back to the same page afterwards */}
          <Link to={text.switchLink} state={{ from }} replace>{text.switchLabel}</Link>
        </p>
      </main>
    </>
  )
}
