// The live demo on the home page: drag P along y = x²/2.
// The orange line is the tangent at P; its slope equals the x-coordinate of P.
// It is drawn by NotePlot.graph from /static/js/demos/plot.js (in public/), the same
// helper the notes use (loaded in index.html).

import { useEffect, useRef, useState } from 'react'
import { typeset } from '../mathjax.js'

const f = (x) => (x * x) / 2

// Keep P on the curve, with x in steps of 0.1 between −3 and 3
function onCurve([x]) {
  const t = Math.min(Math.max(Math.round(x * 10) / 10, -3), 3)
  return [t, f(t)]
}

export default function HeroDemo() {
  // useRef gives a box that holds the real HTML element after React draws it
  const holderRef = useRef(null)
  const captionRef = useRef(null)
  const [readout, setReadout] = useState('')

  useEffect(() => {
    if (!window.NotePlot) return   // plot.js didn't load
    // plot.js draws on a <canvas> and listens to the mouse on it. We make the
    // canvas here rather than in the JSX, so the cleanup can remove it with
    // its listeners: then the demo can't end up set up twice (StrictMode).
    const canvas = document.createElement('canvas')
    canvas.id = 'heroCanvas'
    holderRef.current.appendChild(canvas)

    window.NotePlot.graph(canvas, {
      x: [-4.65, 4.65], y: [-1, 5],
      points: { P: [1.5, f(1.5)] },
      constrain: { P: onCurve },
      draw(g, P) {
        const [a, b] = P.P
        g.fn(f, '#2563eb', { width: 3 })
        g.fn((x) => a * (x - a) + b, '#ea580c', { width: 2 })   // tangent: y = a(x − a) + a²/2
        setReadout(`P = (${+a.toFixed(1)}, ${+b.toFixed(3)})   slope of tangent = ${+a.toFixed(1)}`)
      },
    })
    return () => canvas.remove()
  }, [])   // [] = run once, when the demo first appears

  // Draw the formula in the caption. React never changes the caption's text
  // after this, so it's safe for MathJax to replace it with a formula.
  useEffect(() => typeset(captionRef.current), [])

  return (
    <figure className="hero-demo">
      <figcaption ref={captionRef}>
        <i className="fas fa-hand-pointer"></i> Try it: drag P along {'$y = \\frac{1}{2}x^2$'}
      </figcaption>
      <div ref={holderRef}></div>
      <div className="hero-readout">{readout}</div>
    </figure>
  )
}
