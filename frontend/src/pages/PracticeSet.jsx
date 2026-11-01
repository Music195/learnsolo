// One practice set: /practice/<course>/<topic>/<set>
// The same layout as a note: purple header (with "Solved 2 of 5"), the
// problems in a white card, then "Review the notes" and the next set.
//
// The data comes from /api/practice/<path> (backend/services/practice.py).
// The HTML matches backend/templates/practice.html, so the same CSS styles it.
// The answer boxes and "I got it" buttons come from src/practice.js.

import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useApi } from '../api.js'
import { setUpProblems } from '../practice.js'
import { useArrowKeys, usePageTitle, useScrollToTop, useTextSize } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'
import LoadError from '../components/LoadError.jsx'
import NoteContent from '../components/NoteContent.jsx'

export default function PracticeSet() {
  const path = useParams()['*']        // e.g. "math-1/03-quadratic-functions/01-graphs-and-vertex-form"
  const { data, error } = useApi(`/api/practice/${path}`)
  const [textSize, changeTextSize] = useTextSize()

  // { solved, review, total, started } from src/practice.js; null until the set is set up
  const [progress, setProgress] = useState(null)
  // The set's { reset() }, for "Start again". A ref, not state: changing it
  // doesn't need to redraw anything.
  const problemsRef = useRef(null)

  useScrollToTop(path)
  useEffect(() => setProgress(null), [path])   // a new set starts with no progress shown
  usePageTitle(data && `Practice: ${data.title} · ${data.location.course} · Learn Solo`)
  useArrowKeys(data?.nav)

  if (error) return <LoadError error={error} what="practice set" />
  if (!data) return <p className="section">Loading…</p>

  const { title, content, count, review, location, nav, practice_path: progressKey } = data

  // Called by NoteContent once the problems are on the page
  function onReady(holder) {
    problemsRef.current = setUpProblems(holder, progressKey, setProgress)
  }

  return (
    <>
      <FloatBar location={location} nav={nav} onTextSize={changeTextSize} />

      {/* HEADER: course and topic, the title, and how many problems are done */}
      <header className="note-header practice-header">
        <div className="note-header-inner">
          <p className="note-chips">
            {location.course_first && <Link to={`/notes/${location.course_first}`}>{location.course}</Link>}
            {location.topic_first && <Link to={`/notes/${location.topic_first}`}>{location.topic}</Link>}
            <span className="chip-practice"><i className="fas fa-puzzle-piece"></i> {review ? 'Topic review' : 'Practice'}</span>
          </p>
          <h1>{title}</h1>
          <ProgressLine progress={progress} count={count} onReset={() => problemsRef.current?.reset()} />
        </div>
      </header>

      {/* THE PROBLEMS: the set's HTML, with answer boxes added by src/practice.js */}
      <NoteContent html={content} style={{ fontSize: `${textSize}%` }} onReady={onReady} />

      {/* AFTER THE PROBLEMS: back to the notes, then the next set (in this
          topic, else the next topic's first set, else the next course's) */}
      <nav className="note-pager" aria-label="More">
        {location.topic_first ? (
          <Link className="pager-card pager-prev" to={`/notes/${location.topic_first}`}>
            <span className="pager-label"><i className="fas fa-book-open"></i> Review the notes</span>
            <strong>{location.topic}</strong>
            <span className="pager-where">{location.course} · from note 1</span>
          </Link>
        ) : (
          <span className="pager-card pager-prev pager-empty" aria-hidden="true"></span>
        )}
        {nav.next ? (
          <Link className="pager-card pager-next" to={nav.next.url}>
            <span className="pager-label">
              {nav.next.review ? 'Topic review' : nav.next.new_topic ? 'Next topic' : 'Next practice'} <i className="fas fa-arrow-right"></i>
            </span>
            <strong>{nav.next.title}</strong>
            <span className="pager-where">{nav.next.where}</span>
          </Link>
        ) : (
          // The very last set: point on to the past questions
          <Link className="pager-card pager-next" to="/past">
            <span className="pager-label">More practice <i className="fas fa-arrow-right"></i></span>
            <strong>Past questions</strong>
            <span className="pager-where">EJU and university exams</span>
          </Link>
        )}
      </nav>
    </>
  )
}

// "Solved 2 of 5 · 1 to review", a bar, and "Start again" once anything is marked.
// Before the set is set up it just says "5 problems".
// (Exported so the past paper page can use it too.)
export function ProgressLine({ progress, count, onReset }) {
  const solved = progress?.solved ?? 0
  const total = progress?.total ?? count
  return (
    <p className="note-progress">
      <span>
        {progress
          ? `Solved ${solved} of ${total}` + (progress.review ? ` · ${progress.review} to review` : '')
          : `${count} problems`}
      </span>
      <span className="progress-bar" aria-hidden="true"><span style={{ width: `${(100 * solved) / total}%` }}></span></span>
      <button className="progress-reset" hidden={!progress?.started} onClick={onReset}>Start again</button>
    </p>
  )
}
