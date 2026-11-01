// Practice progress, saved in this browser (localStorage).
//
// Each practice set (or past paper) has one entry:
//   key    "practice:<path>", e.g. "practice:math-1/03-quadratic-functions/01-graphs-and-vertex-form"
//          (past papers: "practice:past/eju/course-1/03-mock-paper")
//   value  JSON: problem number (from 0) → "solved" or "review", e.g. {"0": "solved", "2": "review"}
// The same keys as the old site, so progress saved there still shows.
//
// Every read and write of progress goes through this file, so Step 5 can
// change where it's kept (your account in the database) in one place.

const PREFIX = 'practice:'

// The saved progress of one set: an object, or null if there's none
export function readProgress(path) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + path)) || null
  } catch {
    return null   // an unreadable entry counts as no progress
  }
}

export function writeProgress(path, saved) {
  localStorage.setItem(PREFIX + path, JSON.stringify(saved))
}

// A renamed set lists its earlier paths in data-moved-from="old|older".
// Move any progress saved under them to the new path, once.
export function moveOldProgress(path, movedFrom) {
  if (!movedFrom || localStorage.getItem(PREFIX + path) !== null) return
  for (const old of movedFrom.split('|')) {
    const value = localStorage.getItem(PREFIX + old)
    if (value !== null) {
      localStorage.setItem(PREFIX + path, value)
      localStorage.removeItem(PREFIX + old)
      return
    }
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
