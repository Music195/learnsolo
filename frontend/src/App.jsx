// Which page to show for which address.
//
// <Routes> looks at the address in the browser bar and shows the <Route>
// whose "path" matches it best. In a path:
//   :category   a named part of the address, read with useParams()
//   *           the rest of the address, slashes included (useParams()['*'])

import { Routes, Route } from 'react-router'
import Home from './pages/Home.jsx'
import Note from './pages/Note.jsx'
import PracticeList from './pages/PracticeList.jsx'
import PracticeSet from './pages/PracticeSet.jsx'
import PastList from './pages/PastList.jsx'
import PastPaper from './pages/PastPaper.jsx'
import Account from './pages/Account.jsx'
import NotFound from './pages/NotFound.jsx'
import { useAuth } from './auth.jsx'

export default function App() {
  const { user } = useAuth()

  // key: when it changes, React throws the page away and builds it again.
  // It changes when you log in or out, so the open page loads again and
  // shows the progress of whoever is logged in now.
  return (
    <Routes key={user ? user.email : 'logged-out'}>
      <Route path="/" element={<Home />} />
      <Route path="/notes/*" element={<Note />} />
      <Route path="/practice" element={<PracticeList />} />
      <Route path="/practice/*" element={<PracticeSet />} />
      {/* /past lists every exam; /past/eju lists one exam's papers */}
      <Route path="/past" element={<PastList />} />
      <Route path="/past/:category" element={<PastList />} />
      {/* /past/eju/course-1/03-mock-paper: one paper */}
      <Route path="/past/:category/*" element={<PastPaper />} />
      {/* Accounts: the same page, as a log in or a sign up form */}
      <Route path="/login" element={<Account mode="login" />} />
      <Route path="/signup" element={<Account mode="signup" />} />
      {/* Anything else */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
