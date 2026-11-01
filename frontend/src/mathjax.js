// Turning $...$ into formulas with MathJax (loaded in index.html).

// MathJax can only safely do one job at a time, so every job waits for the
// one before it, in a queue made of Promises.
let queue = Promise.resolve()

// The elements already typeset. Each element must be typeset only once:
// a drawn formula keeps a hidden MathML copy for screen readers, and this
// MathJax build also reads MathML, so a second run would draw every formula
// again inside the first. React may run an effect twice (StrictMode), so
// typeset() checks this list. A WeakSet forgets elements once they're gone.
const done = new WeakSet()

// typeset(element): draw the formulas inside `element`, once.
// MathJax loads in the background (async). If it's ready, the job joins the
// queue. If it isn't loaded yet, there's nothing to do: when it finishes
// loading it draws every formula on the page by itself.
export function typeset(element) {
  const mathjax = window.MathJax
  if (!element || done.has(element) || !mathjax?.startup?.promise) return
  done.add(element)
  queue = queue
    .then(() => mathjax.startup.promise)          // wait until MathJax has started
    // skip an element React has already taken off the page
    .then(() => element.isConnected && mathjax.typesetPromise([element]))
    .catch((error) => console.error('MathJax:', error))
}
