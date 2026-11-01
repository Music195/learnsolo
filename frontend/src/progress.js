// Practice progress: where it is kept.
//
// Each practice set (or past paper) has one entry:
//   path   e.g. "math-1/03-quadratic-functions/01-graphs-and-vertex-form"
//          (past papers: "past/eju/course-1/03-mock-paper")
//   value  problem number (from 0) → "solved" or "review", e.g. {"0": "solved", "2": "review"}
//
// It is kept in one of two places:
//   - Not logged in: this browser (localStorage), under "practice:<path>",
//     the same keys as the old site, so progress saved there still shows.
//   - Logged in: your account, through the API (backend/api/progress.py).
//     When you log in, everything is loaded once into `account` below, so
//     reading is instant. Each change is kept there and sent to the server.
//
// Every read and write of progress goes through this file, so the pages
// don't need to know which of the two is used.

import { sendJson } from './api.js'

const PREFIX = 'practice:'

// null = not logged in. Otherwise all of the account's progress: { path: value }.
let account = null

// Called by auth.js on log in (with the progress from the API) and on log out (null)
export function setAccountProgress(progress) {
  account = progress
}

// The saved progress of one set: an object, or null if there's none
export function readProgress(path) {
  // A copy ({ ...x }): the page changes what it gets, and writeProgress
  // must still be able to tell the old progress from the new.
  if (account) return account[path] ? { ...account[path] } : null
  try {
    return JSON.parse(localStorage.getItem(PREFIX + path)) || null
  } catch {
    return null   // an unreadable entry counts as no progress
  }
}

export function writeProgress(path, saved) {
  if (!account) {
    localStorage.setItem(PREFIX + path, JSON.stringify(saved))
    return
  }
  // Nothing changed (e.g. opening a set saves what it loaded): don't send it
  if (JSON.stringify(account[path]) === JSON.stringify(saved)) return
  account[path] = { ...saved }   // a copy, so later changes to `saved` don't sneak in
  sendToAccount('PUT', path, account[path])
}

// A renamed set lists its earlier paths in data-moved-from="old|older".
// Move any progress saved under them to the new path, once.
export function moveOldProgress(path, movedFrom) {
  if (!movedFrom || readProgress(path) !== null) return
  for (const old of movedFrom.split('|')) {
    const value = readProgress(old)
    if (value === null) continue
    if (account) {
      account[path] = value
      delete account[old]
      sendToAccount('PUT', path, value)
      sendToAccount('DELETE', old)
    } else {
      localStorage.setItem(PREFIX + path, JSON.stringify(value))
      localStorage.removeItem(PREFIX + old)
    }
    return
  }
}

// How many problems of a set are solved, or null if it has no progress.
// Until a renamed set is opened, its progress may still be under an old
// path, so look there too.
export function solvedCount(path, movedFrom) {
  const paths = [path, ...(movedFrom || '').split('|').filter(Boolean)]
  for (const p of paths) {
    const saved = readProgress(p)
    if (saved) return Object.values(saved).filter((v) => v === 'solved').length
  }
  return null
}

// Sending changes to the account.
// Clicking quickly can make several saves of one set at once. If they
// overtook each other, an older one could arrive last and win. So the
// saves of each set wait in line: each starts when the one before it ends.
const queues = {}   // path → the Promise of its last save

function sendToAccount(method, path, body) {
  const previous = queues[path] || Promise.resolve()
  queues[path] = previous
    .then(() => sendJson(method, `/api/progress/${path}`, body))
    // A failed save (e.g. no internet) is only logged: the page keeps
    // working, and the next change sends the whole set again anyway.
    .catch((error) => console.warn('Progress not saved:', error))
}

// Everything saved in this browser while logged out: { path: value }.
// Used once on log in, to add it to the account (auth.js).
export function browserProgress() {
  const all = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key.startsWith(PREFIX)) continue
    try {
      const value = JSON.parse(localStorage.getItem(key))
      if (value && typeof value === 'object') all[key.slice(PREFIX.length)] = value
    } catch {
      // skip an unreadable entry
    }
  }
  return all
}

// After it's in the account, remove it from this browser, so logging out
// starts empty and it isn't added again next time.
export function forgetBrowserProgress(paths) {
  for (const path of paths) localStorage.removeItem(PREFIX + path)
}
