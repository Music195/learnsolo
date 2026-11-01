// One past paper: /past/<exam>/[<course>/]<paper>, e.g. /past/eju/course-1/03-mock-paper
// It works like a practice set (PracticeSet.jsx): answer boxes, "I got it",
// "Solved 2 of 6", then "All papers" and "Next paper" cards.
//
// The data comes from /api/past/<exam>/<paper> (backend/services/past.py).
// The HTML matches backend/templates/practice.html with `paper` given.

import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { useApi } from '../api.js'
import { setUpProblems } from '../practice.js'
import { useArrowKeys, usePageTitle, useScrollToTop, useTextSize } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'
import LoadError from '../components/LoadError.jsx'
import NoteContent from '../components/NoteContent.jsx'
import { plural } from '../components/HubTabs.jsx'
import { ProgressLine } from './PracticeSet.jsx'

export default function PastPaper() {
  // Route "/past/:category/*": category = "eju", '*' = "course-1/03-mock-paper"
  const params = useParams()
  const path = `${params.category}/${params['*']}`
  const { data, error } = useApi(`/api/past/${path}`)
  const [textSize, changeTextSize] = useTextSize()

  const [progress, setProgress] = useState(null)   // { solved, review, total, started }
  const problemsRef = useRef(null)                 // { reset() } for "Start again"

  useScrollToTop(path)
  useEffect(() => setProgress(null), [path])
  usePageTitle(data && `Past question: ${data.title} · ${data.location.course} · Learn Solo`)
  useArrowKeys(data?.nav)

  // An old address of a renamed paper: the API says where it is now
  // ({"moved_to": "/past/..."}), and <Navigate> sends the browser there.
  // "replace" swaps the old address out of the Back history.
  if (error?.body?.moved_to) return <Navigate to={error.body.moved_to} replace />
  if (error) return <LoadError error={error} what="paper" />
  if (!data) return <p className="section">Loading…</p>

  const { title, content, count, location, nav, paper, practice_path: progressKey } = data

  // Called by NoteContent once the problems are on the page.
  // progressKey is "past/<path>", so papers never share progress with a set.
  function onReady(holder) {
    problemsRef.current = setUpProblems(holder, progressKey, setProgress)
  }

  return (
    <>
      <FloatBar location={location} nav={nav} onTextSize={changeTextSize} />

      {/* HEADER: the exam (and course), the title, and how many problems are done */}
      <header className="note-header practice-header">
        <div className="note-header-inner">
          <p className="note-chips">
            <Link to={paper.category_url}>{paper.category}</Link>
            <span className="chip-practice chip-past"><i className="fas fa-file-pen"></i> Past question</span>
          </p>
          <h1>{title}</h1>
          <ProgressLine progress={progress} count={count} onReset={() => problemsRef.current?.reset()} />
        </div>
      </header>

      {/* THE PROBLEMS: the paper's HTML, with answer boxes added by src/practice.js */}
      <NoteContent html={content} style={{ fontSize: `${textSize}%` }} onReady={onReady} />

      {/* AFTER THE PROBLEMS: back to the list, then the next paper */}
      <nav className="note-pager" aria-label="More">
        <Link className="pager-card pager-prev" to={paper.category_url}>
          <span className="pager-label"><i className="fas fa-arrow-left"></i> All papers</span>
          <strong>{paper.category}</strong>
          <span className="pager-where">{plural(location.total, 'paper')}</span>
        </Link>
        {nav.next ? (
          <Link className="pager-card pager-next" to={nav.next.url}>
            <span className="pager-label">Next paper <i className="fas fa-arrow-right"></i></span>
            <strong>{nav.next.title}</strong>
            <span className="pager-where">{location.course}</span>
          </Link>
        ) : (
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
