import { useState, useEffect, useRef } from 'react'
import '../styles/dictionary.css'

const DEFAULT_WIDTH = 380
const DEFAULT_HEIGHT = 500
const MIN_WIDTH = 320
const MIN_HEIGHT = 360

// Quick client-side script detection for instant UI feedback
function detectScript(text) {
  if (!text || !text.trim()) return null
  // Burmese (Myanmar script)
  if (/[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF]/.test(text)) return 'my'
  // Japanese (Hiragana, Katakana, CJK Kanji)
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]/.test(text)) return 'ja'
  // English / Latin
  if (/[a-zA-Z]/.test(text)) return 'en'
  return 'auto'
}

const LANG_LABELS = {
  en: 'English (EN)',
  my: 'Burmese (မြန်မာ)',
  ja: 'Japanese (日本語)',
  auto: 'Auto Detect',
}

export default function FloatingDictionary() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Resizable state
  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem('learnsolo_dict_size')
      if (saved) return JSON.parse(saved)
    } catch {}
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  })
  const [isMaximized, setIsMaximized] = useState(false)

  // Dragging / Resizing refs
  const resizeRef = useRef(null)

  // Save customized size to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('learnsolo_dict_size', JSON.stringify(size))
    } catch {}
  }, [size])

  // Mouse / Touch resize handlers
  const startResize = (direction, e) => {
    e.preventDefault()
    if (isMaximized) return

    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)

    resizeRef.current = {
      direction,
      startX: clientX,
      startY: clientY,
      startWidth: size.width,
      startHeight: size.height,
    }

    const onMove = (moveEvent) => {
      if (!resizeRef.current) return
      const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX)
      const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY)
      if (currentX === undefined || currentY === undefined) return

      const { direction, startX, startY, startWidth, startHeight } = resizeRef.current
      const maxWidth = Math.min(820, window.innerWidth - 32)
      const maxHeight = Math.min(760, window.innerHeight - 100)

      let nextWidth = startWidth
      let nextHeight = startHeight

      if (direction === 'corner' || direction === 'left') {
        const deltaX = startX - currentX
        nextWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth + deltaX))
      }

      if (direction === 'corner' || direction === 'top') {
        const deltaY = startY - currentY
        nextHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, startHeight + deltaY))
      }

      setSize({ width: nextWidth, height: nextHeight })
    }

    const onEnd = () => {
      resizeRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
  }

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const detected = detectScript(trimmed) || 'auto'
      const res = await fetch(`/api/dictionary?q=${encodeURIComponent(trimmed)}&from=${detected}`)
      if (!res.ok) {
        throw new Error('Word could not be translated. Please try again.')
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to fetch translation.')
    } finally {
      setLoading(false)
    }
  }

  const detectedLanguage = detectScript(query)

  const drawerStyle = isMaximized
    ? {
        width: 'min(720px, calc(100vw - 32px))',
        height: 'min(720px, calc(100vh - 110px))',
      }
    : {
        width: `${size.width}px`,
        height: `${size.height}px`,
      }

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="floating-dict-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close Dictionary' : 'Open Dictionary'}
        title="Dictionary (Burmese / English / Japanese)"
      >
        <i className={isOpen ? 'fas fa-times' : 'fas fa-language'}></i>
      </button>

      {/* Dictionary Drawer / Window */}
      {isOpen && (
        <div className="dict-drawer" style={drawerStyle}>
          {/* Resize handles */}
          {!isMaximized && (
            <>
              <div
                className="dict-resize-corner"
                onMouseDown={(e) => startResize('corner', e)}
                onTouchStart={(e) => startResize('corner', e)}
                title="Drag to resize"
              >
                <i className="fas fa-arrows-alt"></i>
              </div>
              <div
                className="dict-resize-top"
                onMouseDown={(e) => startResize('top', e)}
                onTouchStart={(e) => startResize('top', e)}
              />
              <div
                className="dict-resize-left"
                onMouseDown={(e) => startResize('left', e)}
                onTouchStart={(e) => startResize('left', e)}
              />
            </>
          )}

          {/* Header */}
          <div className="dict-header">
            <h3><i className="fas fa-book"></i> 3-Way Dictionary</h3>
            <div className="dict-header-actions">
              <button
                className="dict-btn-icon"
                onClick={toggleMaximize}
                title={isMaximized ? 'Restore size' : 'Expand window'}
                aria-label={isMaximized ? 'Restore size' : 'Expand window'}
              >
                <i className={isMaximized ? 'fas fa-compress-alt' : 'fas fa-expand-alt'}></i>
              </button>
              <button
                className="dict-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Search Form with Auto Language Detection */}
          <form onSubmit={handleSearch} className="dict-form">
            <div className="dict-auto-status">
              <span className="dict-auto-pill">
                <i className="fas fa-magic"></i> Auto-Detect:
                <strong> {detectedLanguage ? LANG_LABELS[detectedLanguage] : 'Type in EN, မြန်မာ, or 日本語'}</strong>
              </span>
            </div>

            <div className="dict-input-wrap">
              <input
                type="text"
                placeholder="Type in English, Burmese, or Japanese..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  className="dict-clear-btn"
                  onClick={() => setQuery('')}
                  title="Clear input"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
              <button type="submit" disabled={loading} aria-label="Search">
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
              </button>
            </div>
          </form>

          {/* Results Area */}
          <div className="dict-results">
            {error && <div className="dict-error">{error}</div>}

            {!loading && !error && !result && (
              <div className="dict-empty">
                <i className="fas fa-search" style={{ fontSize: '1.8rem', color: '#cbd5e1', marginBottom: '8px' }}></i>
                <p>Type any word in English, Burmese, or Japanese.</p>
                <span className="dict-tip">Automatically detects the language and gives instant 3-way translations.</span>
              </div>
            )}

            {result && (
              <div className="dict-card">
                <div className="dict-card-top">
                  <span className="dict-source-badge" data-source={result.source}>
                    <i className={result.source === 'curated' ? 'fas fa-check-circle' : result.source === 'ai' ? 'fas fa-sparkles' : 'fas fa-globe'}></i>
                    {result.source === 'curated' ? 'Verified DB' : result.source === 'ai' ? 'AI Translation' : 'Online Translation'}
                  </span>
                  {result.detected_lang && (
                    <span className="dict-detected-tag">
                      Input: {LANG_LABELS[result.detected_lang] || result.detected_lang}
                    </span>
                  )}
                  {result.notes && <span className="dict-notes">{result.notes}</span>}
                </div>

                <div className="dict-field">
                  <span className="lang-tag">EN (English)</span>
                  <p className="dict-lang-val">{result.english || '—'}</p>
                </div>

                <div className="dict-field">
                  <span className="lang-tag">မြန်မာ (Burmese)</span>
                  <p className="dict-lang-val myanmar-text">{result.burmese || '—'}</p>
                </div>

                <div className="dict-field">
                  <span className="lang-tag">日本語 (Japanese)</span>
                  <p className="dict-lang-val">
                    {result.japanese || '—'}
                    {result.reading && <span className="dict-reading"> ({result.reading})</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
