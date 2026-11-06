import { useState, useEffect, useRef, useCallback } from 'react'
import '../styles/calculator.css'

const DEFAULT_WIDTH = 380
const DEFAULT_HEIGHT = 560
const MIN_WIDTH = 320
const MIN_HEIGHT = 460

// Physics constants for high-school math & physics students
const PHYSICS_CONSTANTS = [
  { name: 'g (Standard gravity)', symbol: 'g', value: '9.8', unit: 'm/s²' },
  { name: 'c (Speed of light)', symbol: 'c', value: '3e8', unit: 'm/s' },
  { name: 'e (Elementary charge)', symbol: 'e_charge', value: '1.602e-19', unit: 'C' },
  { name: 'm_e (Electron mass)', symbol: 'm_e', value: '9.109e-31', unit: 'kg' },
  { name: 'N_A (Avogadro constant)', symbol: 'N_A', value: '6.022e23', unit: 'mol⁻¹' },
  { name: 'h (Planck constant)', symbol: 'h', value: '6.626e-34', unit: 'J·s' },
  { name: 'R (Gas constant)', symbol: 'R', value: '8.314', unit: 'J/(mol·K)' },
  { name: 'G (Gravitational constant)', symbol: 'G', value: '6.674e-11', unit: 'N·m²/kg²' },
]

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN
  if (n === 0 || n === 1) return 1
  if (n > 170) return Infinity
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

export function evaluateExpression(expr, isDeg = true, ans = 0) {
  let s = (expr || '').trim()
  if (!s) return '0'

  // Standardize mathematical symbols
  s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')

  // Constants
  s = s.replace(/\bAns\b/gi, `(${ans})`)
  s = s.replace(/π|\bpi\b/gi, `(${Math.PI})`)
  s = s.replace(/\be\b(?![_\w])/gi, `(${Math.E})`)

  // Pre-process factorial: (number)!
  s = s.replace(/(\d+(\.\d+)?)!/g, (_, n) => factorial(Number(n)))

  // Trig degree conversion factor
  const degFactor = isDeg ? Math.PI / 180 : 1
  const invDegFactor = isDeg ? 180 / Math.PI : 1

  const mathScope = {
    sin: (x) => {
      const v = Math.sin(x * degFactor)
      return Math.abs(v) < 1e-14 ? 0 : v
    },
    cos: (x) => {
      const v = Math.cos(x * degFactor)
      return Math.abs(v) < 1e-14 ? 0 : v
    },
    tan: (x) => {
      if (isDeg && Math.abs((x - 90) % 180) < 1e-10) return NaN
      const v = Math.tan(x * degFactor)
      return Math.abs(v) < 1e-14 ? 0 : v
    },
    asin: (x) => Math.asin(x) * invDegFactor,
    acos: (x) => Math.acos(x) * invDegFactor,
    atan: (x) => Math.atan(x) * invDegFactor,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    log: Math.log10,
    ln: Math.log,
    abs: Math.abs,
  }

  // Convert power ^ to **
  s = s.replace(/\^/g, '**')

  // Scope mathematical functions
  for (const fn of Object.keys(mathScope)) {
    s = s.replace(new RegExp(`\\b${fn}\\b`, 'g'), `__scope.${fn}`)
  }

  try {
    const fn = new Function('__scope', `return (${s});`)
    const res = fn(mathScope)

    if (typeof res !== 'number' || isNaN(res)) return 'Error'
    if (!isFinite(res)) return res > 0 ? 'Infinity' : '-Infinity'

    // Clean floating point rounding
    const formatted = Number(res.toPrecision(12))
    return formatted.toString()
  } catch {
    return 'Error'
  }
}

export default function FloatingCalculator({ isOpen = false, onClose }) {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState('0')
  const [isDeg, setIsDeg] = useState(true)
  const [isInv, setIsInv] = useState(false)
  const [ans, setAns] = useState(0)
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('learnsolo_calc_hist')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [showConstants, setShowConstants] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Resizable state
  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem('learnsolo_calc_size')
      if (saved) return JSON.parse(saved)
    } catch {}
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  })
  const [isMaximized, setIsMaximized] = useState(false)

  // Draggable position state
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem('learnsolo_calc_pos')
      if (saved) {
        const p = JSON.parse(saved)
        if (typeof p.x === 'number' && typeof p.y === 'number') {
          return {
            x: Math.max(10, Math.min(window.innerWidth - DEFAULT_WIDTH - 10, p.x)),
            y: Math.max(60, Math.min(window.innerHeight - 80, p.y)),
          }
        }
      }
    } catch {}
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - DEFAULT_WIDTH - 24) : 80
    const defaultY = typeof window !== 'undefined' ? Math.max(70, window.innerHeight - DEFAULT_HEIGHT - 86) : 80
    return { x: defaultX, y: defaultY }
  })
  const [isDragging, setIsDragging] = useState(false)

  const resizeRef = useRef(null)
  const dragRef = useRef(null)

  // Save history
  useEffect(() => {
    try {
      localStorage.setItem('learnsolo_calc_hist', JSON.stringify(history.slice(-30)))
    } catch {}
  }, [history])

  // Save customized size & position
  useEffect(() => {
    try {
      localStorage.setItem('learnsolo_calc_size', JSON.stringify(size))
    } catch {}
  }, [size])

  useEffect(() => {
    try {
      localStorage.setItem('learnsolo_calc_pos', JSON.stringify(pos))
    } catch {}
  }, [pos])

  // Real-time evaluation preview while typing
  useEffect(() => {
    if (!expr.trim()) {
      setResult('0')
      return
    }
    const evaluated = evaluateExpression(expr, isDeg, ans)
    if (evaluated !== 'Error') {
      setResult(evaluated)
    }
  }, [expr, isDeg, ans])

  // Insert token into expression
  const insert = useCallback((val) => {
    setExpr((prev) => prev + val)
  }, [])

  // Insert function
  const insertFn = useCallback((fn) => {
    setExpr((prev) => prev + fn + '(')
  }, [])

  // Clear all
  const handleClear = useCallback(() => {
    setExpr('')
    setResult('0')
  }, [])

  // Backspace
  const handleBackspace = useCallback(() => {
    setExpr((prev) => prev.slice(0, -1))
  }, [])

  // Equals / Calculate
  const handleEquals = useCallback(() => {
    if (!expr.trim()) return
    const evaluated = evaluateExpression(expr, isDeg, ans)
    if (evaluated !== 'Error') {
      const numericVal = Number(evaluated)
      setAns(numericVal)
      setHistory((prev) => [
        ...prev,
        { expr, result: evaluated, isDeg, timestamp: Date.now() },
      ])
      setExpr(evaluated)
      setResult(evaluated)
    } else {
      setResult('Error')
    }
  }, [expr, isDeg, ans])

  // Negate sign (+/-)
  const handleNegate = useCallback(() => {
    setExpr((prev) => {
      if (!prev) return '-'
      if (prev.startsWith('-(') && prev.endsWith(')')) {
        return prev.slice(2, -1)
      }
      return `-(${prev})`
    })
  }, [])

  // Physical Keyboard listener
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e) => {
      // Don't intercept if student is focused on an input/textarea in the page
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return

      const key = e.key
      if (key >= '0' && key <= '9') {
        insert(key)
      } else if (['+', '-', '*', '/'].includes(key)) {
        insert(key === '*' ? '×' : key === '/' ? '÷' : key)
      } else if (key === '.' || key === '(' || key === ')') {
        insert(key)
      } else if (key === '^') {
        insert('^')
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault()
        handleEquals()
      } else if (key === 'Backspace') {
        handleBackspace()
      } else if (key === 'Escape') {
        handleClear()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, insert, handleEquals, handleBackspace, handleClear])

  // Dragging handler for the header
  const startDrag = (e) => {
    if (isMaximized) return
    if (e.target.closest('button, input, textarea, a')) return

    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)
    if (clientX === undefined || clientY === undefined) return

    setIsDragging(true)
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: pos.x,
      initialY: pos.y,
    }

    const onMove = (moveEvent) => {
      if (!dragRef.current) return
      const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX)
      const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY)
      if (currentX === undefined || currentY === undefined) return

      const deltaX = currentX - dragRef.current.startX
      const deltaY = currentY - dragRef.current.startY

      const maxX = Math.max(10, window.innerWidth - size.width - 10)
      const maxY = Math.max(60, window.innerHeight - 60)

      const nextX = Math.max(10, Math.min(maxX, dragRef.current.initialX + deltaX))
      const nextY = Math.max(60, Math.min(maxY, dragRef.current.initialY + deltaY))

      setPos({ x: nextX, y: nextY })
    }

    const onEnd = () => {
      dragRef.current = null
      setIsDragging(false)
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

  // Resize handlers
  const startResize = (direction, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isMaximized) return

    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)

    resizeRef.current = {
      direction,
      startX: clientX,
      startY: clientY,
      startWidth: size.width,
      startHeight: size.height,
      startPosX: pos.x,
      startPosY: pos.y,
    }

    const onMove = (moveEvent) => {
      if (!resizeRef.current) return
      const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX)
      const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY)
      if (currentX === undefined || currentY === undefined) return

      const { direction, startX, startY, startWidth, startHeight, startPosX, startPosY } = resizeRef.current
      const maxWidth = Math.min(800, window.innerWidth - 32)
      const maxHeight = Math.min(840, window.innerHeight - 80)

      let nextWidth = startWidth
      let nextHeight = startHeight
      let nextPosX = startPosX
      let nextPosY = startPosY

      // Bottom-Right Corner & Edges
      if (direction === 'corner-br' || direction === 'right') {
        const deltaX = currentX - startX
        nextWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth + deltaX))
      }
      if (direction === 'corner-br' || direction === 'bottom') {
        const deltaY = currentY - startY
        nextHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, startHeight + deltaY))
      }

      // Top-Left Corner & Edges
      if (direction === 'corner' || direction === 'left') {
        const deltaX = startX - currentX
        nextWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth + deltaX))
        nextPosX = startPosX - (nextWidth - startWidth)
      }
      if (direction === 'corner' || direction === 'top') {
        const deltaY = startY - currentY
        nextHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, startHeight + deltaY))
        nextPosY = startPosY - (nextHeight - startHeight)
      }

      setSize({ width: nextWidth, height: nextHeight })
      if (nextPosX !== startPosX || nextPosY !== startPosY) {
        setPos({ x: Math.max(10, nextPosX), y: Math.max(60, nextPosY) })
      }
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

  const toggleMaximize = () => setIsMaximized((prev) => !prev)

  if (!isOpen) return null

  const drawerStyle = isMaximized
    ? {
        top: '60px',
        left: '20px',
        right: '20px',
        bottom: '80px',
        width: 'auto',
        height: 'auto',
        maxWidth: 'none',
        maxHeight: 'none',
      }
    : {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        bottom: 'auto',
        right: 'auto',
      }

  return (
    <div className="calc-drawer" style={drawerStyle}>
      {/* Resize handles */}
      {!isMaximized && (
        <>
          <div
            className="calc-resize-corner"
            onMouseDown={(e) => startResize('corner', e)}
            onTouchStart={(e) => startResize('corner', e)}
            title="Drag to resize"
          >
            <i className="fas fa-arrows-alt"></i>
          </div>
          <div
            className="calc-resize-top"
            onMouseDown={(e) => startResize('top', e)}
            onTouchStart={(e) => startResize('top', e)}
          />
          <div
            className="calc-resize-left"
            onMouseDown={(e) => startResize('left', e)}
            onTouchStart={(e) => startResize('left', e)}
          />
          <div
            className="calc-resize-corner-br"
            onMouseDown={(e) => startResize('corner-br', e)}
            onTouchStart={(e) => startResize('corner-br', e)}
            title="Drag to resize"
          >
            <i className="fas fa-arrows-alt"></i>
          </div>
        </>
      )}

      {/* Header */}
      <div
        className={`calc-header ${isDragging ? 'is-dragging' : ''}`}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        title="Click and drag to move window"
      >
        <div className="calc-header-title">
          <span className="calc-drag-grip" title="Drag to move">
            <i className="fas fa-grip-vertical"></i>
          </span>
          <i className="fas fa-calculator"></i>
          <span>Scientific Calculator</span>
        </div>
        <div className="calc-header-actions">
          {/* DEG / RAD Mode Switch */}
          <button
            type="button"
            className={`calc-mode-btn ${isDeg ? 'deg' : 'rad'}`}
            onClick={() => setIsDeg(!isDeg)}
            title="Toggle Degrees / Radians"
          >
            {isDeg ? 'DEG' : 'RAD'}
          </button>

          {/* Constants Toggle */}
          <button
            type="button"
            className={`calc-tool-btn ${showConstants ? 'active' : ''}`}
            onClick={() => {
              setShowConstants(!showConstants)
              setShowHistory(false)
            }}
            title="Physics Constants"
          >
            <i className="fas fa-atom"></i> Const
          </button>

          {/* History Toggle */}
          <button
            type="button"
            className={`calc-tool-btn ${showHistory ? 'active' : ''}`}
            onClick={() => {
              setShowHistory(!showHistory)
              setShowConstants(false)
            }}
            title="Calculation History"
          >
            <i className="fas fa-history"></i> Hist
          </button>

          {/* Expand / Restore */}
          <button
            type="button"
            className="calc-icon-btn"
            onClick={toggleMaximize}
            title={isMaximized ? 'Restore size' : 'Expand window'}
          >
            <i className={isMaximized ? 'fas fa-compress-alt' : 'fas fa-expand-alt'}></i>
          </button>

          {/* Close */}
          {onClose && (
            <button
              type="button"
              className="calc-close-btn"
              onClick={onClose}
              aria-label="Close Calculator"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Display Screen */}
      <div className="calc-screen">
        <div className="calc-screen-top">
          <span className="calc-screen-mode">{isDeg ? 'DEG' : 'RAD'}</span>
          {ans !== 0 && <span className="calc-screen-ans-tag">Ans = {ans}</span>}
        </div>
        <div className="calc-expr">{expr || '0'}</div>
        <div className={`calc-result ${result === 'Error' ? 'is-error' : ''}`}>
          {result}
        </div>
      </div>

      {/* Physics Constants Panel */}
      {showConstants && (
        <div className="calc-panel">
          <div className="calc-panel-header">
            <span>High School Physics Constants</span>
            <button
              type="button"
              className="calc-icon-btn"
              onClick={() => setShowConstants(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="calc-constants-grid">
            {PHYSICS_CONSTANTS.map((c) => (
              <button
                key={c.symbol}
                type="button"
                className="calc-const-item"
                onClick={() => {
                  insert(c.value)
                  setShowConstants(false)
                }}
                title={c.name}
              >
                <span className="calc-const-symbol">{c.symbol}</span>
                <span className="calc-const-val">{c.value} {c.unit}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="calc-panel">
          <div className="calc-panel-header">
            <span>Recent Calculations</span>
            {history.length > 0 && (
              <button
                type="button"
                className="calc-clear-hist-btn"
                onClick={() => setHistory([])}
              >
                Clear All
              </button>
            )}
          </div>
          <div className="calc-history-list">
            {history.length === 0 ? (
              <p style={{ margin: '8px 0', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                No calculations yet
              </p>
            ) : (
              history.slice().reverse().map((h, i) => (
                <div
                  key={i}
                  className="calc-history-item"
                  onClick={() => {
                    setExpr(h.result)
                    setShowHistory(false)
                  }}
                  title="Click to load result"
                >
                  <span className="calc-history-expr">{h.expr} =</span>
                  <span className="calc-history-res">{h.result}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Keypad */}
      <div className="calc-keypad">
        {/* Row 1 */}
        <button
          type="button"
          className={`calc-btn fn ${isInv ? 'active' : ''}`}
          onClick={() => setIsInv(!isInv)}
          title="Inverse Functions"
        >
          2nd
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert('Ans')}
          title="Last Answer"
        >
          Ans
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert('^')}
          title="Exponent"
        >
          xʸ
        </button>
        <button
          type="button"
          className="calc-btn del"
          onClick={handleBackspace}
          title="Backspace"
        >
          ⌫
        </button>
        <button
          type="button"
          className="calc-btn clear"
          onClick={handleClear}
          title="All Clear"
        >
          AC
        </button>

        {/* Row 2: Trig & Constants */}
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insertFn(isInv ? 'asin' : 'sin')}
        >
          {isInv ? 'sin⁻¹' : 'sin'}
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insertFn(isInv ? 'acos' : 'cos')}
        >
          {isInv ? 'cos⁻¹' : 'cos'}
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insertFn(isInv ? 'atan' : 'tan')}
        >
          {isInv ? 'tan⁻¹' : 'tan'}
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert('π')}
        >
          π
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert('e')}
        >
          e
        </button>

        {/* Row 3: Powers & Log */}
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insertFn(isInv ? 'cbrt' : 'sqrt')}
        >
          {isInv ? '∛x' : '√x'}
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert(isInv ? '^3' : '^2')}
        >
          {isInv ? 'x³' : 'x²'}
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => (isInv ? insert('e^(') : insertFn('ln'))}
        >
          {isInv ? 'eˣ' : 'ln'}
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => (isInv ? insert('10^(') : insertFn('log'))}
        >
          {isInv ? '10ˣ' : 'log'}
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insertFn('abs')}
        >
          |x|
        </button>

        {/* Row 4: Parentheses & Operators */}
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert('(')}
        >
          (
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert(')')}
        >
          )
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert('%')}
        >
          %
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert('!')}
        >
          n!
        </button>
        <button
          type="button"
          className="calc-btn op"
          onClick={() => insert('÷')}
        >
          ÷
        </button>

        {/* Row 5: 7, 8, 9, x */}
        <button
          type="button"
          className="calc-btn num"
          onClick={() => insert('7')}
        >
          7
        </button>
        <button
          type="button"
          className="calc-btn num"
          onClick={() => insert('8')}
        >
          8
        </button>
        <button
          type="button"
          className="calc-btn num"
          onClick={() => insert('9')}
        >
          9
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert('^(-1)')}
        >
          1/x
        </button>
        <button
          type="button"
          className="calc-btn op"
          onClick={() => insert('×')}
        >
          ×
        </button>

        {/* Row 6: 4, 5, 6, - */}
        <button
          type="button"
          className="calc-btn num"
          onClick={() => insert('4')}
        >
          4
        </button>
        <button
          type="button"
          className="calc-btn num"
          onClick={() => insert('5')}
        >
          5
        </button>
        <button
          type="button"
          className="calc-btn num"
          onClick={() => insert('6')}
        >
          6
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={handleNegate}
        >
          ±
        </button>
        <button
          type="button"
          className="calc-btn op"
          onClick={() => insert('-')}
        >
          −
        </button>

        {/* Row 7: 1, 2, 3, + */}
        <button
          type="button"
          className="calc-btn num"
          onClick={() => insert('1')}
        >
          1
        </button>
        <button
          type="button"
          className="calc-btn num"
          onClick={() => insert('2')}
        >
          2
        </button>
        <button
          type="button"
          className="calc-btn num"
          onClick={() => insert('3')}
        >
          3
        </button>
        <button
          type="button"
          className="calc-btn fn"
          onClick={() => insert('e')}
          title="Scientific Exponent (e.g. 1.5e3)"
        >
          EXP
        </button>
        <button
          type="button"
          className="calc-btn op"
          onClick={() => insert('+')}
        >
          +
        </button>

        {/* Row 8: 0, ., = */}
        <button
          type="button"
          className="calc-btn num"
          style={{ gridColumn: 'span 2' }}
          onClick={() => insert('0')}
        >
          0
        </button>
        <button
          type="button"
          className="calc-btn num"
          onClick={() => insert('.')}
        >
          .
        </button>
        <button
          type="button"
          className="calc-btn equals"
          style={{ gridColumn: 'span 2' }}
          onClick={handleEquals}
        >
          =
        </button>
      </div>
    </div>
  )
}
