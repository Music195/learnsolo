// Stand-in for pages that aren't in React yet: sends the browser to the
// same address on the old Flask site (:5000).
//
// Only needed while we move pages over; Step 6 deletes it.

import { useEffect } from 'react'
import { useLocation } from 'react-router'

const OLD_SITE = 'http://localhost:5000'

export default function OldSitePage() {
  // useLocation(): the current address, e.g. { pathname: "/notes/math-1/...", hash: "" }
  const location = useLocation()
  const url = OLD_SITE + location.pathname + location.search + location.hash

  useEffect(() => {
    // replace(): go there without leaving this stand-in in the Back history
    window.location.replace(url)
  }, [url])

  return <p style={{ padding: 20 }}>Opening <a href={url}>{url}</a> on the old site…</p>
}
