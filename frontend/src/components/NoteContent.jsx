// Shows the HTML of a note, practice set or past paper and makes it work:
// runs its <script> tags, which draw the TRY IT demos, and draws the
// formulas with MathJax.
//
// Why not just React's dangerouslySetInnerHTML? When HTML is inserted that
// way, the browser does NOT run the <script> tags inside it, so the demos
// would stay blank. So this component inserts the HTML itself, then runs
// each script by hand, in order.

import { useEffect, useRef } from 'react'
import { typeset } from '../mathjax.js'

// Script files loaded so far (the demo helpers, e.g. /static/js/demos/venn.js).
// Each only needs loading once per visit: it sets up window.NoteVenn etc.,
// which stays there for the next notes.
const loadedFiles = new Map()   // src → Promise that finishes when it has loaded

function loadScriptFile(src) {
  // Already on the page from index.html (geom.js, plot.js)?
  if (!loadedFiles.has(src) && document.querySelector(`head script[src="${src}"]`)) {
    loadedFiles.set(src, Promise.resolve())
  }
  if (!loadedFiles.has(src)) {
    loadedFiles.set(src, new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = () => reject(new Error(`Couldn't load ${src}`))
      document.head.appendChild(script)
    }))
  }
  return loadedFiles.get(src)
}

// Run the <script> tags inside `holder`, one after another, in page order:
// a note's own script uses the helpers loaded by the <script src> before it.
// `isCancelled()` says the note has left the screen, so stop.
async function runScripts(holder, isCancelled) {
  for (const old of holder.querySelectorAll('script')) {
    if (isCancelled()) return
    const src = old.getAttribute('src')
    if (src) {
      await loadScriptFile(src)
    } else {
      // A <script> made with createElement DOES run when it's put on the page.
      // Swapping it in for the inserted one runs the note's code right here.
      const script = document.createElement('script')
      script.textContent = old.textContent
      old.replaceWith(script)
    }
  }
}

// Props:
//   html     the note's HTML
//   style    goes on <main> (the text size)
//   onReady  optional: called with the element holding the HTML once its
//            scripts have run, before the formulas are drawn. Practice
//            sets use it to add their answer boxes (src/practice.js).
export default function NoteContent({ html, style, onReady }) {
  // useRef: holds the real <main> element once React has drawn it
  const ref = useRef(null)

  useEffect(() => {
    // Build the note in a new <div> each time. If React runs this effect
    // twice (StrictMode) or the note changes, the cleanup below throws the
    // old <div> away with everything the scripts attached to it, so demos
    // and formulas are never set up twice on the same elements.
    const holder = document.createElement('div')
    holder.innerHTML = html          // the note's HTML; its scripts don't run yet
    ref.current.replaceChildren(holder)

    let cancelled = false
    runScripts(holder, () => cancelled)
      .then(() => {
        if (cancelled) return
        onReady?.(holder)    // ?.() calls it only if the page passed one
        typeset(holder)      // formulas last, after the demos wrote theirs
      })
      .catch((error) => console.error(error))

    return () => {
      cancelled = true
      holder.remove()
    }
    // Only `html` is listed: a new onReady on every draw shouldn't rebuild the note
  }, [html])   // run again when the note changes

  // React only draws the empty <main>; the effect fills it.
  return <main className="note-content" id="noteContent" ref={ref} style={style}></main>
}
