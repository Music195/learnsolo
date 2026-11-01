// Getting data from the Flask API (/api/...).

import { useEffect, useState } from 'react'

// fetchJson('/api/home') → a Promise of the JSON, as JavaScript objects.
// fetch() only fails when there is no answer at all, so a 404 or 500 is
// turned into an error here by hand.
export async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    const error = new Error(`${url} answered ${response.status}`)
    error.status = response.status   // e.g. 404, so pages can say "not found"
    // The API explains errors in JSON, e.g. {"error": "moved", "moved_to": "/past/..."}
    error.body = await response.json().catch(() => null)
    throw error
  }
  return response.json()
}

// A "hook": a function components call to get something that changes over
// time. useApi('/api/home') returns { data, error }:
//   first     { data: null, error: null }   still loading
//   then      { data: {...}, error: null }  arrived
//   or        { data: null, error: Error }  failed
// Each change makes the component draw itself again with the new values.
export function useApi(url) {
  // useState keeps a value between draws; setResult changes it and redraws
  const [result, setResult] = useState({ data: null, error: null })

  // useEffect runs after the component is on screen, and again whenever
  // `url` changes (the [url] at the end).
  useEffect(() => {
    let current = true   // false once the page has moved on to another url
    setResult({ data: null, error: null })
    fetchJson(url)
      .then((data) => current && setResult({ data, error: null }))
      .catch((error) => current && setResult({ data: null, error }))
    // This "cleanup" runs before the next url is loaded, so a slow old
    // answer can't replace the new one.
    return () => { current = false }
  }, [url])

  return result
}
