// The past question lists:
//   /past             one card per exam (a folder in content/past/)
//   /past/<exam>      that exam's papers. With subfolders (EJU Course 1 /
//                     Course 2) there is a tab per subfolder, with "Solved n of m".
//
// The data comes from /api/past and /api/past/<exam> (backend/services/past.py).
// Styled by src/styles/past.css and practice-list.css.

import { Link, useParams } from 'react-router'
import { useApi } from '../api.js'
import { solvedCount } from '../progress.js'
import { usePageTitle } from '../pageHooks.js'
import FloatBar from '../components/FloatBar.jsx'
import LoadError from '../components/LoadError.jsx'
import { HubTabs, SetProgress, plural } from '../components/HubTabs.jsx'

export default function PastList() {
  // App.jsx sends both /past and /past/:category here. ":category" is a
  // named part of the address, e.g. "eju"; on /past it is undefined.
  const { category } = useParams()

  return (
    <>
      <FloatBar />
      {/* key={category}: a different exam gets a fresh page (its own tabs) */}
      {category ? <ExamPage key={category} folder={category} /> : <AllExams />}
    </>
  )
}

// The purple header, shared by both pages
function Header({ back, title, lead }) {
  return (
    <header className="note-header">
      <div className="note-header-inner">
        <p className="note-chips">{back}</p>
        <h1>{title}</h1>
        <p className="past-lead">{lead}</p>
      </div>
    </header>
  )
}

// /past: one card per exam
function AllExams() {
  const { data, error } = useApi('/api/past')
  usePageTitle('Past questions · Learn Solo')

  if (error) return <LoadError error={error} what="past questions page" />
  if (!data) return <p className="section">Loading…</p>

  return (
    <>
      <Header
        back={<Link to="/"><i className="fas fa-house"></i> Home</Link>}
        title="Past questions"
        lead="Exam problems to test yourself. Each one has a hint, a step-by-step solution and an answer check."
      />
      <main className="past-content">
        <div className="past-grid">
          {data.categories.map((cat) => (
            <Link key={cat.folder} className="past-card" to={`/past/${cat.folder}`}>
              <span className="past-icon"><i className={`fas ${cat.icon}`}></i></span>
              <strong className="past-name">{cat.name}</strong>
              <span className="past-about">{cat.about}</span>
              <span className="past-foot">
                {plural(cat.papers.length, 'paper')}
                <span className="past-go">Open <i className="fas fa-arrow-right"></i></span>
              </span>
            </Link>
          ))}
          {data.categories.length === 0 && <p className="past-empty">No past questions yet.</p>}
        </div>
      </main>
    </>
  )
}

// /past/<exam>: its papers
function ExamPage({ folder }) {
  const { data: exam, error } = useApi(`/api/past/${folder}`)
  usePageTitle(exam && `${exam.name} · Learn Solo`)

  if (error) return <LoadError error={error} what="exam" />
  if (!exam) return <p className="section">Loading…</p>

  return (
    <>
      <Header
        back={<Link to="/past"><i className="fas fa-arrow-left"></i> All past questions</Link>}
        title={exam.name}
        lead={exam.about}
      />
      <main className="past-content">
        {exam.groups.length > 0 ? (
          // Subfolders: a tab each, remembered per exam (e.g. "past-tab:eju")
          <HubTabs
            tabs={exam.groups.map((group) => ({ id: group.folder, name: group.name, papers: group.papers }))}
            rememberKey={`past-tab:${exam.folder}`}
            label="Courses"
            renderPanel={(group) => <GroupCard group={group} />}
          />
        ) : (
          // No subfolders: a plain list of papers
          <ol className="paper-list">
            {exam.papers.map((paper, i) => (
              <li key={paper.path}>
                <Link className="paper-row" to={`/past/${paper.path}`}>
                  <span className="paper-num">{i + 1}</span>
                  <span className="paper-text">
                    <strong>{paper.title}</strong>
                    <span>{plural(paper.count, 'problem')}{paper.intro && ` · ${paper.intro}`}</span>
                  </span>
                  <span className="paper-go">Start <i className="fas fa-arrow-right"></i></span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  )
}

// One subfolder's papers, with your saved progress.
// Papers keep their progress under "past/<path>", apart from practice sets.
function GroupCard({ group }) {
  const solved = group.papers.map((paper) => solvedCount(`past/${paper.path}`, paper.moved_from))
  const groupSolved = solved.reduce((sum, n) => sum + (n || 0), 0)
  const problems = group.papers.reduce((sum, paper) => sum + paper.count, 0)

  return (
    <article className="topic-card">
      <header className="topic-head">
        <div className="topic-text">
          <h2>{group.name}</h2>
          <p className="topic-meta">
            {plural(group.papers.length, 'paper')} · {problems} problems{' '}
            <span className="topic-solved" hidden={!groupSolved}>Solved {groupSolved} of {problems}</span>
          </p>
        </div>
      </header>
      <ol className="set-list">
        {group.papers.map((paper, i) => (
          <li key={paper.path}>
            <Link className="set-row" to={`/past/${paper.path}`}>
              <span className="set-num">{i + 1}</span>
              <span className="set-text">
                <strong>{paper.title}</strong>
                {/* What each problem practises, from its exam label */}
                <span>{paper.labels.length ? paper.labels.join(' · ') : paper.intro}</span>
              </span>
              <SetProgress solved={solved[i]} count={paper.count} />
            </Link>
          </li>
        ))}
      </ol>
    </article>
  )
}
