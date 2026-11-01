// Pieces shared by the practice hub (/practice) and the past paper lists
// with subfolders (/past/eju): a row of tabs with one panel each, and the
// "Solved 2 of 6" badges. Styled by practice-list.css.

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

// <HubTabs tabs={[{ id, name }]} rememberKey="practice-hub:course" label="Courses"
//          renderPanel={(tab) => ...the panel's contents...} />
//
// The tab open at the start: the one named after # in the address
// (/practice#math-a opens "math-a"); otherwise the one chosen last time
// (saved in localStorage under rememberKey); otherwise the first.
// renderPanel is a function the page passes in: HubTabs calls it for each
// tab to draw that tab's panel.
export function HubTabs({ tabs, rememberKey, label, renderPanel }) {
  const location = useLocation()
  const ids = tabs.map((t) => t.id)

  const [open, setOpen] = useState(() => {
    const wanted = location.hash.slice(1) || localStorage.getItem(rememberKey)
    return ids.includes(wanted) ? wanted : ids[0]
  })

  // Remember the open tab, however it was opened (a click, ← / →, or #name
  // in the address), so the page opens on it next time
  useEffect(() => {
    localStorage.setItem(rememberKey, open)
  }, [open, rememberKey])

  const choose = setOpen

  // ← / → move between tabs, as in other tab lists
  function onTabKey(event) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!step) return
    const next = ids[(ids.indexOf(open) + step + ids.length) % ids.length]
    choose(next)
    document.getElementById(`tab-${next}`).focus()
  }

  return (
    <>
      <div className="hub-tabs" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button key={tab.id} className="hub-tab" role="tab" id={`tab-${tab.id}`}
                  aria-controls={`panel-${tab.id}`} aria-selected={tab.id === open}
                  tabIndex={tab.id === open ? 0 : -1}
                  onClick={() => choose(tab.id)} onKeyDown={onTabKey}>
            {tab.name}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <section key={tab.id} className="hub-panel" role="tabpanel" id={`panel-${tab.id}`}
                 aria-labelledby={`tab-${tab.id}`} hidden={tab.id !== open}>
          {renderPanel(tab)}
        </section>
      ))}
    </>
  )
}

// "Solved 2 of 6", or "✓ Done", or nothing if not started (solved = null or 0)
export function SetProgress({ solved, count }) {
  if (!solved) return <span className="set-progress" hidden></span>
  const done = solved >= count
  return (
    <span className={'set-progress' + (done ? ' is-done' : '')}>
      {done ? <><i className="fas fa-check"></i> Done</> : `Solved ${solved} of ${count}`}
    </span>
  )
}

// "1 set", "2 sets"
export function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
