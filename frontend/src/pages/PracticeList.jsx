// The practice hub: /practice
// One tab per course; each topic is a card listing its practice sets in
// order (the concept sets, then the topic review), with "Solved 2 of 6"
// from the progress saved in this browser. Past questions are linked at the end.
//
// The data comes from /api/practice (backend/services/practice.py). The
// HTML matches backend/templates/practice-list.html (practice-list.css).

import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useApi } from '../api.js'
import { solvedCount } from '../progress.js'
import { usePageTitle } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'
import LoadError from '../components/LoadError.jsx'

// Where the chosen course tab is remembered (the same name as the old site)
const TAB_KEY = 'practice-hub:course'

export default function PracticeList() {
  const { data, error } = useApi('/api/practice')
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
            Every problem has a hint, a full solution and an answer check, and your progress is saved on this device.
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

// The course tabs and one panel per course
function CourseTabs({ courses }) {
  const location = useLocation()
  const folders = courses.map((c) => c.folder)

  // The tab open at the start: /practice#math-a opens Math A; otherwise the
  // one chosen last time; otherwise the first.
  const [open, setOpen] = useState(() => {
    const wanted = location.hash.slice(1) || localStorage.getItem(TAB_KEY)
    return folders.includes(wanted) ? wanted : folders[0]
  })

  function choose(folder) {
    setOpen(folder)
    localStorage.setItem(TAB_KEY, folder)
  }

  // ← / → move between tabs, as in other tab lists
  function onTabKey(event) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!step) return
    const next = folders[(folders.indexOf(open) + step + folders.length) % folders.length]
    choose(next)
    document.getElementById(`tab-${next}`).focus()
  }

  return (
    <>
      <div className="hub-tabs" role="tablist" aria-label="Courses">
        {courses.map((course) => (
          <button key={course.folder} className="hub-tab" role="tab" id={`tab-${course.folder}`}
                  aria-controls={`panel-${course.folder}`} aria-selected={course.folder === open}
                  tabIndex={course.folder === open ? 0 : -1}
                  onClick={() => choose(course.folder)} onKeyDown={onTabKey}>
            {course.name}
          </button>
        ))}
      </div>

      {/* ONE PANEL PER COURSE: a card per topic */}
      {courses.map((course) => (
        <section key={course.folder} className="hub-panel" role="tabpanel" id={`panel-${course.folder}`}
                 aria-labelledby={`tab-${course.folder}`} hidden={course.folder !== open}>
          {course.topics.map((topic, i) => <TopicCard key={topic.folder} topic={topic} number={i + 1} />)}
        </section>
      ))}
    </>
  )
}

// One topic: its sets, with the progress saved in this browser
function TopicCard({ topic, number }) {
  // Solved problems per set (null = not started), and the topic's total
  const solved = topic.sets.map((s) => solvedCount(s.path, s.moved_from))
  const topicSolved = solved.reduce((sum, n) => sum + (n || 0), 0)   // add them up
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

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

// "Solved 2 of 6", or "✓ Done", or nothing if not started
function SetProgress({ solved, count }) {
  if (!solved) return <span className="set-progress" hidden></span>
  const done = solved >= count
  return (
    <span className={'set-progress' + (done ? ' is-done' : '')}>
      {done ? <><i className="fas fa-check"></i> Done</> : `Solved ${solved} of ${count}`}
    </span>
  )
}
