// The Topics sidebar on a note page: pick a course and a topic to list
// their notes. It starts on the course and topic being read, and the note
// being read is highlighted. Opened by the Topics button in the floating bar.
//
// The list of notes comes from /api/notes (backend/services/notes.py):
//   sidebar.notes_meta     [{ path, title }] for every note, in order
//   sidebar.folders        the course folders, e.g. ["math-1", "math-2", ...]
//   sidebar.display_names  { courses: {"math-1": "Math I"}, topics: {...} }

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

export default function TopicsSidebar({ sidebar, currentPath, open, onClose }) {
  const [courseNow, topicNow] = currentPath.split('/')
  const names = sidebar.display_names

  // The two dropdowns. They start on the note being read.
  const [course, setCourse] = useState(courseNow)
  const [topic, setTopic] = useState(topicNow)

  const asideRef = useRef(null)
  const closeRef = useRef(null)
  const listRef = useRef(null)

  // The topics of the chosen course, in folder order. new Set() drops the
  // repeats (every note of a topic gives the same topic folder).
  const topics = [...new Set(
    sidebar.notes_meta
      .map((note) => note.path.split('/'))
      .filter((parts) => parts.length > 2 && parts[0] === course)
      .map((parts) => parts[1]),
  )]
  // If the chosen topic isn't in this course (the course just changed), use its first topic
  const shownTopic = topics.includes(topic) ? topic : topics[0]
  const notes = sidebar.notes_meta.filter((note) => note.path.startsWith(`${course}/${shownTopic}/`))

  // When the sidebar opens: scroll the list to the current note and put the
  // keyboard focus on the close button.
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('[aria-current]')?.scrollIntoView({ block: 'center' })
    // The sidebar slides in for 0.25 s (note-page.css) and the browser can't
    // focus it before it is visible, so wait for the slide ("transition") to end.
    const aside = asideRef.current
    const focusClose = () => closeRef.current?.focus()
    aside.addEventListener('transitionend', focusClose, { once: true })
    return () => aside.removeEventListener('transitionend', focusClose)
  }, [open])

  // When it closes while the keyboard focus is inside it, give the focus back
  // to the Topics button, so keyboard users don't lose their place.
  useEffect(() => {
    if (!open && asideRef.current?.contains(document.activeElement)) {
      document.querySelector('.bar-topics')?.focus()
    }
  }, [open])

  // Esc closes it
  useEffect(() => {
    if (!open) return
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* The "open" class slides it in (note-page.css) */}
      <aside id="sidebar" aria-label="Topics" className={open ? 'open' : ''} ref={asideRef}>
        <div className="sidebar-head">
          <h2>Topics</h2>
          <button className="sidebar-close" ref={closeRef} aria-label="Close topics" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* A "controlled" dropdown: React keeps its value in state */}
        <label className="sidebar-label" htmlFor="folderFilter">Course</label>
        <select id="folderFilter" value={course} onChange={(event) => setCourse(event.target.value)}>
          {sidebar.folders.map((folder) => (
            <option key={folder} value={folder}>{names.courses[folder] ?? folder}</option>
          ))}
        </select>

        <label className="sidebar-label" htmlFor="subfolderFilter">Topic</label>
        <select id="subfolderFilter" value={shownTopic} onChange={(event) => setTopic(event.target.value)}>
          {topics.map((t) => <option key={t} value={t}>{names.topics[t] ?? t}</option>)}
        </select>

        {/* Notes in the chosen topic; the one you are reading is highlighted */}
        <ol className="note-list" ref={listRef}>
          {notes.map((note) => (
            <li key={note.path}>
              <Link to={`/notes/${note.path}`} onClick={onClose}
                    aria-current={note.path === currentPath ? 'page' : undefined}>
                {note.title}
              </Link>
            </li>
          ))}
        </ol>
      </aside>

      {/* Dark layer behind the open sidebar; clicking it closes the sidebar */}
      <div className="sidebar-backdrop" hidden={!open} onClick={onClose}></div>
    </>
  )
}
