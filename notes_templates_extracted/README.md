# Extracted Notes Templates

## What you get
- `templates/notes_base.html` : shared base (extends your existing `base.html`)
- `templates/notes/*.html`    : 9 note templates that extend `notes_base.html`
- `static/js/notes/common.js` : shared JS helpers (toggleSolution, MathJax rerender helper)
- `static/js/notes/*.js`      : page-specific JS (one file per note)

## How to render (Flask example)
```py
from flask import render_template

@app.get("/notes/mode")
def mode():
    return render_template("notes/mode.html")
```

## If your existing base uses different blocks
`notes_base.html` assumes your `base.html` has blocks:
- `title`
- `extra_head`
- `body`

If your block names differ, just rename them inside `notes_base.html`.
