// Shown for any address that matches no page (the "*" route in App.jsx).

import { Link } from 'react-router'
import { usePageTitle } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'

export default function NotFound() {
  usePageTitle('Page not found · Learn Solo')
  return (
    <>
      <FloatBar />
      <header className="note-header">
        <div className="note-header-inner">
          <h1>Page not found</h1>
          <p className="past-lead">This address doesn't match any page. Try the search above, or start from the home page.</p>
        </div>
      </header>
      <main className="past-content">
        <p><Link to="/"><i className="fas fa-house"></i> Home</Link> · <Link to="/practice">Practice</Link> · <Link to="/past">Past questions</Link></p>
      </main>
    </>
  )
}
