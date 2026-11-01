// Which page to show for which address.
//
// <Routes> looks at the address in the browser bar and shows the first
// <Route> whose "path" matches. "*" matches anything, so it must be last.

import { Routes, Route } from 'react-router'
import Home from './pages/Home.jsx'
import Note from './pages/Note.jsx'
import OldSitePage from './pages/OldSitePage.jsx'
import PracticeList from './pages/PracticeList.jsx'
import PracticeSet from './pages/PracticeSet.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* /notes/ followed by anything: Note.jsx reads the rest of the address */}
      <Route path="/notes/*" element={<Note />} />
      <Route path="/practice" element={<PracticeList />} />
      <Route path="/practice/*" element={<PracticeSet />} />

      {/* Pages not moved to React yet (past questions)
          open on the old Flask site. Each later step adds a <Route> above. */}
      <Route path="*" element={<OldSitePage />} />
    </Routes>
  )
}
