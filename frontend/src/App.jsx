// Which page to show for which address.
//
// <Routes> looks at the address in the browser bar and shows the first
// <Route> whose "path" matches. "*" matches anything, so it must be last.

import { Routes, Route } from 'react-router'
import Home from './pages/Home.jsx'
import OldSitePage from './pages/OldSitePage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Pages not moved to React yet (notes, practice, past questions)
          open on the old Flask site. Each later step adds a <Route> above. */}
      <Route path="*" element={<OldSitePage />} />
    </Routes>
  )
}
