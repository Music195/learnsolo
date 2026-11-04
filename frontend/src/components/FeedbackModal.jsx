import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { sendJson } from '../api.js'
import { useAuth } from '../auth.jsx'

export default function FeedbackModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const location = useLocation()
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) {
      setError('Please enter a feedback message.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      await sendJson('POST', '/api/feedback', {
        category,
        message,
        email: user ? user.email : email,
        page_url: location.pathname + location.search + location.hash,
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setMessage('')
        onClose()
      }, 1600)
    } catch (err) {
      setError(err.body?.error || 'Could not send feedback. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="feedback-backdrop" onClick={onClose}>
      <div className="feedback-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-header">
          <h3><i className="fas fa-comment-dots"></i> Send Feedback</h3>
          <button type="button" className="feedback-close-btn" onClick={onClose} aria-label="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {success ? (
          <div className="feedback-success-card">
            <i className="fas fa-circle-check"></i>
            <h4>Thank you!</h4>
            <p>Your feedback has been received. It helps us make LearnSolo better for everyone.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <p className="feedback-lead">
              Found a bug, have an idea, or noticed a typo in a question? Let us know!
            </p>

            {error && <p className="account-error" role="alert">{error}</p>}

            <label className="feedback-field">
              <span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="general">💡 General Feedback / Idea</option>
                <option value="correction">✏️ Question Issue / Correction</option>
                <option value="feature">🚀 Feature Request</option>
                <option value="bug">🐞 Website Bug / Glitch</option>
              </select>
            </label>

            {!user && (
              <label className="feedback-field">
                <span>Your Email (Optional)</span>
                <input
                  type="email"
                  placeholder="learner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}

            <label className="feedback-field">
              <span>Your Message</span>
              <textarea
                rows={4}
                required
                placeholder="Write your feedback or issue details here…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>

            <div className="feedback-actions">
              <button type="button" className="account-btn-secondary" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="account-submit feedback-submit-btn" disabled={busy}>
                {busy ? 'Sending…' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
