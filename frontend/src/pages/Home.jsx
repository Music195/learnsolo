// The home page: hero, subject tabs with their courses, how a note works,
// and links to the rest of the site.
//
// The data comes from /api/home (backend/services/home.py). The HTML and
// class names match backend/templates/home.html, so home.css styles it.

import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useApi } from '../api.js'
import FloatBar from '../components/FloatBar.jsx'
import HeroDemo from '../components/HeroDemo.jsx'
import LoadError from '../components/LoadError.jsx'

// One icon and colour per course card, by display name
const COURSE_STYLE = {
  'Math I': ['fa-square-root-variable', '#2563eb'],
  'Math II': ['fa-wave-square', '#7c3aed'],
  'Math III': ['fa-infinity', '#db2777'],
  'Math A': ['fa-dice', '#ea580c'],
  'Math B': ['fa-list-ol', '#0d9488'],
  'Math C': ['fa-location-arrow', '#16a34a'],
}

// Subject names as English: "A", "A and B", "A, B and C"
function names(subjects) {
  const list = subjects.map((s) => s.name)
  if (list.length <= 1) return list.join('')
  return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]
}

// "1 note", "2 notes"
function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export default function Home() {
  const { data, error } = useApi('/api/home')

  // Set the browser tab's title while this page is open
  useEffect(() => {
    document.title = 'Learn Solo · Interactive high-school notes'
  }, [])

  // Until the data arrives, show a short message instead of the page
  if (error) return <LoadError error={error} what="home page" />
  if (!data) return <p className="section">Loading…</p>

  return <HomeContent subjects={data.subjects} stats={data.stats} />
}

// The page itself, drawn once the data is here. It's a separate component
// so its useState can start from the data (a component's hooks must run
// the same way on every draw, so they can't come after the "Loading…" return).
function HomeContent({ subjects, stats }) {
  const ready = subjects.filter((s) => s.count > 0)   // subjects with notes
  const soon = subjects.filter((s) => s.count === 0)  // "coming soon"

  // Which subject tab is open: at the start, the first one with notes
  const [openTab, setOpenTab] = useState(subjects.indexOf(ready[0] ?? subjects[0]))

  // Left/right arrow keys move between tabs, as screen-reader users expect
  function onTabKey(event) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!step) return
    const next = (openTab + step + subjects.length) % subjects.length
    setOpenTab(next)
    document.getElementById(`tab-${next}`).focus()
  }

  return (
    <>
      {/* <> </> groups several elements without adding an extra HTML tag */}
      <FloatBar />

      {/* HERO: what the site is, the two main actions, and a live demo */}
      <header className="hero">
        <div className="hero-grid">
          <div className="hero-text">
            <h1>High-school subjects you can <span className="highlight">see</span></h1>
            <p className="lead-text">
              Drag points, move sliders and watch every formula work. Free interactive notes for{' '}
              {names(ready)}{soon.length > 0 && `, with ${names(soon)} coming soon`}.
            </p>
            <div className="hero-actions">
              <a className="btn-main" href="#subjects">Start learning <i className="fas fa-arrow-down"></i></a>
              <Link className="btn-ghost" to="/practice"><i className="fas fa-puzzle-piece"></i> Practice problems</Link>
            </div>
            <ul className="stats">
              <li><strong>{stats.notes}</strong> notes</li>
              <li><strong>{stats.courses}</strong> courses</li>
              <li><strong>{stats.topics}</strong> topics</li>
              <li><strong>100%</strong> interactive</li>
            </ul>
          </div>
          <HeroDemo />
        </div>
      </header>

      <main>
        {/* SUBJECTS: one tab per subject; each tab shows its course cards */}
        <section id="subjects" className="section">
          <h2 className="section-title">Choose your subject and course</h2>
          <p className="section-sub">Pick a course to start at its first note, or jump straight to a topic.</p>

          <div className="subject-tabs" role="tablist" aria-label="Subjects">
            {subjects.map((subject, i) => (
              <button
                key={subject.name}
                className="subject-tab" role="tab" id={`tab-${i}`} aria-controls={`panel-${i}`}
                aria-selected={i === openTab}
                tabIndex={i === openTab ? 0 : -1}
                onClick={() => setOpenTab(i)}
                onKeyDown={onTabKey}
              >
                <i className={`fas ${subject.icon}`}></i>
                <span>{subject.name}</span>
                <span className={'tab-count' + (subject.count ? '' : ' soon')}>
                  {subject.count ? plural(subject.count, 'note') : 'Coming soon'}
                </span>
              </button>
            ))}
          </div>

          {subjects.map((subject, i) => (
            <div key={subject.name} className="subject-panel" role="tabpanel"
                 id={`panel-${i}`} aria-labelledby={`tab-${i}`} hidden={i !== openTab}>
              {subject.count ? (
                <div className="course-grid">
                  {subject.courses.map((course) => (
                    <CourseCard key={course.folder} course={course} fallbackIcon={subject.icon} />
                  ))}
                </div>
              ) : (
                // Subject without notes yet
                <div className="coming-soon">
                  <i className={`fas ${subject.icon}`}></i>
                  <h3>{subject.name} notes are coming soon</h3>
                  <p>They'll appear here as soon as they're ready. Until then, explore the {names(ready)} notes.</p>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* HOW IT WORKS: the same four steps in every note */}
        <section id="how" className="section how">
          <h2 className="section-title">Every note works the same way</h2>
          <ol className="steps">
            <li><i className="fas fa-lightbulb"></i><strong>Concept</strong><span>The idea in plain words, then the formula and why it works.</span></li>
            <li><i className="fas fa-hand-pointer"></i><strong>Try it</strong><span>A live demo: drag and slide to see the idea change.</span></li>
            <li><i className="fas fa-pencil"></i><strong>Examples</strong><span>Worked problems. Try first, then reveal the solution.</span></li>
            <li><i className="fas fa-bookmark"></i><strong>Remember</strong><span>Common mistakes, a tip, and the key points to keep.</span></li>
          </ol>
        </section>

        {/* MORE: other parts of the site */}
        <section className="section">
          <h2 className="section-title">More to explore</h2>
          <div className="more-grid">
            <Link className="more-card" to="/practice">
              <i className="fas fa-puzzle-piece"></i>
              <span><strong>Practice problems</strong><span>Problem sets for every topic, with hints and solutions.</span></span>
            </Link>
            <Link className="more-card" to="/past">
              <i className="fas fa-file-pen"></i>
              <span><strong>Past questions</strong><span>EJU mock papers and university exam problems.</span></span>
            </Link>
            <a className="more-card" href="https://hide-channel.studio.site/" target="_blank" rel="noopener">
              <i className="fas fa-external-link-alt"></i>
              <span><strong>HIDE Channel</strong><span>Opens in a new tab.</span></span>
            </a>
            <div className="more-card disabled" aria-disabled="true">
              <i className="fas fa-hourglass-half"></i>
              <span><strong>Coming soon</strong><span>New projects are on the way.</span></span>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>💡 Keep learning, keep growing! · Made with ❤️ for learners</p>
      </footer>
    </>
  )
}

// One course card: the course (opens its first note) and its topics.
// Components get their inputs as "props": here { course, fallbackIcon }.
function CourseCard({ course, fallbackIcon }) {
  const [icon, color] = COURSE_STYLE[course.name] ?? [fallbackIcon, '#2563eb']
  return (
    // style takes an object; "--accent" is a CSS variable home.css uses
    <article className="course-card" style={{ '--accent': color }}>
      <Link className="course-head" to={`/notes/${course.first}`}>
        <span className="course-icon"><i className={`fas ${icon}`}></i></span>
        <span>
          <span className="course-name">{course.name}</span>
          <span className="course-count">{plural(course.count, 'note')} · {plural(course.topics.length, 'topic')}</span>
        </span>
        <i className="fas fa-arrow-right course-go"></i>
      </Link>
      <ul className="topic-list">
        {course.topics.map((topic) => (
          <li key={topic.first}><Link to={`/notes/${topic.first}`}>{topic.name}</Link></li>
        ))}
      </ul>
    </article>
  )
}
