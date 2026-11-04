import React from 'react'
import { Link } from 'react-router'
import '../styles/test-score.css'

export default function TestScoreCard({ progress, total, onReset, nextUrl, nextTitle }) {
  if (!progress || !progress.started) return null

  const solved = progress.solved || 0
  const review = progress.review || 0
  const attempted = solved + review
  const isFinished = attempted >= total && total > 0
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0
  const isPass = pct >= 60

  return (
    <aside className={`test-score-card ${isFinished ? 'is-complete' : 'is-progress'}`}>
      <div className="test-score-header">
        <div className="test-score-badge">
          {isFinished ? (
            isPass ? (
              <span className="badge-pass"><i className="fas fa-trophy"></i> Test Passed · 合格</span>
            ) : (
              <span className="badge-review"><i className="fas fa-book-open"></i> Review Needed · 要復習</span>
            )
          ) : (
            <span className="badge-active"><i className="fas fa-pen"></i> Test in Progress</span>
          )}
        </div>
        <div className="test-score-main">
          <div className="score-numbers">
            <span className="score-label">Score</span>
            <strong className="score-value">{solved} <span className="score-total">/ {total}</span></strong>
            <span className={`score-percent ${pct >= 60 ? 'high' : 'low'}`}>{pct}%</span>
          </div>
          <div className="score-breakdown">
            <span className="breakdown-item correct">
              <i className="fas fa-check-circle"></i> Correct: <strong>{solved}</strong>
            </span>
            <span className="breakdown-item review">
              <i className="fas fa-rotate-left"></i> Review: <strong>{review}</strong>
            </span>
            <span className="breakdown-item remaining">
              <i className="fas fa-hourglass-half"></i> Remaining: <strong>{Math.max(0, total - attempted)}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="test-score-actions">
        <button type="button" className="score-btn reset-btn" onClick={onReset}>
          <i className="fas fa-rotate-right"></i> Retake Test
        </button>
        {review > 0 && (
          <button
            type="button"
            className="score-btn review-btn"
            onClick={() => {
              const firstReview = document.querySelector('.practice-problem.is-review')
              if (firstReview) {
                firstReview.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
          >
            <i className="fas fa-eye"></i> Jump to First Mistake
          </button>
        )}
        {nextUrl && isFinished && (
          <Link to={nextUrl} className="score-btn next-btn">
            {nextTitle ? `Next: ${nextTitle}` : 'Next Test'} <i className="fas fa-arrow-right"></i>
          </Link>
        )}
      </div>
    </aside>
  )
}
