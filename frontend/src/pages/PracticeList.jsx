// The practice hub: /practice
// One tab per course; each topic is a card listing its practice sets in
// order (the concept sets, then the topic review), with "Solved 2 of 6"
// from your saved progress (src/progress.js). Past questions are linked at the end.
//
// The data comes from /api/practice (backend/services/practice.py). The
// page is styled by src/styles/practice-list.css.

import { Link } from 'react-router'
import { useApi } from '../api.js'
import { useAuth } from '../auth.jsx'
import { solvedCount } from '../progress.js'
import { usePageTitle } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'
import LoadError from '../components/LoadError.jsx'
import { HubTabs, SetProgress, plural } from '../components/HubTabs.jsx'

// Where the chosen course tab is remembered (in localStorage)
const TAB_KEY = 'practice-hub:course'

export default function PracticeList() {
  const { data, error } = useApi('/api/practice')
  const { user } = useAuth()
  usePageTitle('Practice · Learn Solo')

  if (error) return <LoadError error={error} what="practice page" />
  if (!data) return <p className="section">Loading…</p>

  return (
    <>
      <FloatBar />

      <header className="note-header">
        <div className="note-header-inner">
          <p className="note-chips"><Link to="/"><i className="fas fa-house"></i> Home</Link></p>
          <h1>Practice</h1>
          <p className="hub-lead">
            Problem sets for every topic, from basic questions up to exam-style ones.
            Each topic has concept sets for a few notes at a time, then a topic review.
            Every problem has a hint, a full solution and an answer check, and your progress is saved{' '}
            {user ? 'to your account.' : <>on this device. <Link to="/login" state={{ from: '/practice' }}>Log in</Link> to keep it on every device.</>}
          </p>
        </div>
      </header>

      <main className="hub-content">
        <CourseTabs courses={data.courses} />

        {/* PAST QUESTIONS */}
        <Link className="hub-past" to="/past">
          <span className="hub-past-icon"><i className="fas fa-file-pen"></i></span>
          <span className="hub-past-text">
            <strong>Past questions</strong>
            <span>EJU-style and university exam problems, to test yourself across topics.</span>
          </span>
          <span className="hub-past-go">Open <i className="fas fa-arrow-right"></i></span>
        </Link>
      </main>
    </>
  )
}

// The course tabs (components/HubTabs.jsx), with a card per topic in each panel
function CourseTabs({ courses }) {
  return (
    <HubTabs
      tabs={courses.map((course) => ({ id: course.folder, name: course.name, topics: course.topics }))}
      rememberKey={TAB_KEY}
      label="Courses"
      renderPanel={(tab) => tab.topics.map((topic, i) => <TopicCard key={topic.folder} topic={topic} number={i + 1} />)}
    />
  )
}

// One topic: its sets, with your saved progress
function TopicCard({ topic, number }) {
  // Solved problems per set (null = not started), and the topic's total
  const solved = topic.sets.map((s) => solvedCount(s.path, s.moved_from))
  const topicSolved = solved.reduce((sum, n) => sum + (n || 0), 0)   // add them up

  return (
    <article className="topic-card">
      <header className="topic-head">
        <span className="topic-num">{number}</span>
        <div className="topic-text">
          <h2>{topic.name}</h2>
          <p className="topic-meta">
            {plural(topic.sets.length, 'set')} · {topic.count} problems{' '}
            <span className="topic-solved" hidden={!topicSolved}>Solved {topicSolved} of {topic.count}</span>
          </p>
        </div>
        <Link className="topic-notes" to={`/notes/${topic.notes_first}`}>
          <i className="fas fa-book-open"></i> Notes
        </Link>
      </header>

      <ol className="set-list">
        {topic.sets.map((s, i) => (
          <li key={s.path}>
            <Link className={'set-row' + (s.review ? ' is-review' : '')} to={`/practice/${s.path}`}>
              <span className="set-num">{s.review ? <i className="fas fa-layer-group"></i> : i + 1}</span>
              <span className="set-text">
                <strong>{s.title}</strong>
                <span>
                  {s.review ? <><em className="set-badge">Topic review</em> The whole topic</> : s.covers && `Covers notes ${s.covers}`}
                  {' '}· {plural(s.count, 'problem')}
                </span>
              </span>
              <SetProgress solved={solved[i]} count={s.count} />
            </Link>
          </li>
        ))}
      </ol>
    </article>
  )
}
