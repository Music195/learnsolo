// A note page: /notes/<course>/<topic>/<note>
// Purple header, the note in a white card, practice links, previous/next
// cards, the floating bar and the Topics sidebar.
//
// The data comes from /api/notes/<path> (backend/services/notes.py). It is
// styled by src/styles/note-page.css, note-blocks.css and practice.css.

import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useApi } from '../api.js'
import { useArrowKeys, usePageTitle, useScrollToTop, useTextSize } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'
import LoadError from '../components/LoadError.jsx'
import NoteContent from '../components/NoteContent.jsx'
import TopicsSidebar from '../components/TopicsSidebar.jsx'

export default function Note() {
  // The route in App.jsx is "/notes/*"; useParams()['*'] is the part the *
  // matched, e.g. "math-1/03-quadratic-functions/05-quadratic-formula"
  const path = useParams()['*']

  const { data, error } = useApi(`/api/notes/${path}`)   // this note
  const sidebar = useApi('/api/notes').data              // every note, for the sidebar

  const [topicsOpen, setTopicsOpen] = useState(false)
  const [textSize, changeTextSize] = useTextSize()      // see src/pageHooks.js

  // useCallback keeps the same function between draws, so the sidebar's
  // effect that uses it doesn't restart every time this page draws.
  const closeTopics = useCallback(() => setTopicsOpen(false), [])

  // A new note: start at the top with the sidebar closed, as a new page would
  useScrollToTop(path)
  useEffect(() => setTopicsOpen(false), [path])

  // e.g. "Law of Sines · Math I · Learn Solo"
  usePageTitle(data && `${data.note_title} · ${data.location.course} · Learn Solo`)

  // ← / → keys: previous / next note (not while the sidebar is open)
  useArrowKeys(data?.nav, topicsOpen)

  if (error) return <LoadError error={error} what="note" />
  if (!data) return <p className="section">Loading…</p>

  const { note_title: title, content, location, nav, practice } = data

  return (
    <>
      <FloatBar
        location={location} nav={nav}
        onTextSize={changeTextSize}
        onTopics={sidebar ? () => setTopicsOpen(!topicsOpen) : undefined}
        topicsOpen={topicsOpen}
      />

      {/* key={path}: a new note gets a fresh sidebar, starting on its own course and topic */}
      {sidebar && (
        <TopicsSidebar key={path} sidebar={sidebar} currentPath={path} open={topicsOpen} onClose={closeTopics} />
      )}

      {/* NOTE HEADER: course and topic, the title, and how far along the topic this note is */}
      <header className="note-header">
        <div className="note-header-inner">
          <p className="note-chips">
            <Link to={`/notes/${location.course_first}`}>{location.course}</Link>
            {location.topic && <Link to={`/notes/${location.topic_first}`}>{location.topic}</Link>}
          </p>
          <h1>{title}</h1>
          <p className="note-progress">
            Note {location.index} of {location.total}{location.topic && ` in ${location.topic}`}
            <span className="progress-bar" aria-hidden="true">
              <span style={{ width: `${Math.round((100 * location.index) / location.total)}%` }}></span>
            </span>
          </p>
        </div>
      </header>

      {/* THE NOTE: its HTML from the database, with its demos and formulas */}
      <NoteContent html={content} style={{ fontSize: `${textSize}%` }} />

      {practice && <PracticeLinks practice={practice} />}

      {/* PREVIOUS / NEXT: cards at the end of the note (also the ← / → keys) */}
      <nav className="note-pager" aria-label="Previous and next note">
        <PagerCard link={nav.prev} side="prev" />
        <PagerCard link={nav.next} side="next" />
      </nav>
    </>
  )
}

// PRACTICE: the set that practises this note, then the topic's other sets
function PracticeLinks({ practice }) {
  const { main, more, topic } = practice
  return (
    <section className="practice-links" aria-label="Practise this note">
      <Link className="practice-link" to={`/practice/${main.path}`}>
        <i className="fas fa-puzzle-piece"></i>
        <span>
          <strong>Practise this note: {main.title}</strong>
          <span>{main.count} problems with hints and step-by-step solutions</span>
        </span>
        <span className="go">Start <i className="fas fa-arrow-right"></i></span>
      </Link>
      {more.length > 0 && (
        <p className="practice-more">
          <span>More practice for {topic}:</span>{' '}
          {more.map((set, i) => (
            <span key={set.path}>
              <Link to={`/practice/${set.path}`}>{set.review ? 'Topic review' : set.title}</Link>
              {i < more.length - 1 && ' · '}
            </span>
          ))}
        </p>
      )}
    </section>
  )
}

// One previous/next card. With no note on that side, an empty card keeps
// the other one in its place.
function PagerCard({ link, side }) {
  if (!link) return <span className={`pager-card pager-${side} pager-empty`} aria-hidden="true"></span>
  return (
    <Link className={`pager-card pager-${side}`} to={link.url}>
      <span className="pager-label">
        {side === 'prev' ? <><i className="fas fa-arrow-left"></i> Previous</> : <>Next <i className="fas fa-arrow-right"></i></>}
      </span>
      <strong>{link.title}</strong>
      <span className="pager-where">{link.where}</span>
    </Link>
  )
}
