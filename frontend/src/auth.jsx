// Who is logged in, for the whole app.
//
// <AuthProvider> (main.jsx) wraps every page. When the site opens it asks
// the server "who is logged in?" (/api/auth/me) and, if someone is, loads
// their progress. Until that's known it shows "Loading…", so pages never
// show the wrong progress for a moment.
//
// Any component can then call useAuth() to get:
//   user     { email } or null
//   signup(email, password), login(email, password), logout()
//
// The login itself is a cookie the server sets (see backend/api/auth.py).
// JavaScript can't read it (HttpOnly); the browser just sends it along.

import { createContext, useContext, useEffect, useState } from 'react'
import { fetchJson, sendJson } from './api.js'
import { browserProgress, forgetBrowserProgress, setAccountProgress } from './progress.js'

// A "context" passes a value to every component inside the Provider,
// without handing it down through each component's props.
const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

// Load the account's progress and switch progress.js over to it.
// `fromBrowser` (on log in / sign up) is progress saved in this browser
// while logged out: the server adds it to the account first.
async function startAccount(fromBrowser) {
  const paths = Object.keys(fromBrowser || {})
  const { progress } = paths.length
    ? await sendJson('POST', '/api/progress/merge', { progress: fromBrowser })
    : await fetchJson('/api/progress')
  forgetBrowserProgress(paths)   // it's in the account now
  setAccountProgress(progress)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)   // false until we know who is logged in

  // Once, when the site opens: who is logged in?
  useEffect(() => {
    fetchJson('/api/auth/me')
      .then(async ({ user }) => {
        if (user) await startAccount(null)
        setUser(user)
      })
      // No answer (e.g. Flask isn't running): carry on logged out; the
      // pages will show their own "couldn't be loaded" message.
      .catch(() => {})
      .finally(() => setReady(true))
  }, [])

  // Sign up and log in work the same way: send the form, then start the
  // account with this browser's progress. Errors (wrong password, email
  // taken, ...) are thrown on for the form to show.
  async function enter(url, email, password) {
    const { user } = await sendJson('POST', url, { email, password })
    await startAccount(browserProgress())
    setUser(user)
  }

  const value = {
    user,
    signup: (email, password) => enter('/api/auth/signup', email, password),
    login: (email, password) => enter('/api/auth/login', email, password),
    logout: async () => {
      await sendJson('POST', '/api/auth/logout')
      setAccountProgress(null)   // back to this browser's progress
      setUser(null)
    },
  }

  if (!ready) return <p className="section">Loading…</p>
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
