# LearnSolo: project and content guide

## Start here

LearnSolo is a study site for Japanese high-school maths (Math I, II, III, A, B and C), written in English. It has three kinds of content:

| Kind | What it is | Where it lives | URL |
|---|---|---|---|
| **Notes** | One idea per page: concept, formula, proof, an interactive demo, worked examples | `content/notes/` | `/notes/...` |
| **Practice sets** | 6–7 problems with hints, solutions and an answer box, for a few notes at a time, then a topic review | `content/practice/` | `/practice`, `/practice/...` |
| **Past questions** | Exam-style papers (EJU and university), checked the same way as practice sets | `content/past/` | `/past`, `/past/...` |

**There is no database.** Every page is an HTML file under `content/`. Flask finds the files, wraps each one in a shared page template and serves it. To add a page, add a file (sections 6, 7 and 8). Nothing has to be registered.

**How a student moves through the site:**

```
Home (/)  ── subject tabs → course → topic ──►  Note  ◄─ previous / next ─►  Note
   │                                              │
   │                                              └─ "Practise this note" card
   ▼                                              ▼
Practice hub (/practice) ── tab per course ──►  Practice set ── Next practice → Topic review → Next topic
   │
   └─ bottom link ──►  Past questions (/past) ──►  Exam folder ──►  Paper
```

The floating bar at the top of every page has the search box, which finds notes, sets and papers, plus links to Practice and Past questions.

### Map of the code

| Part | Files | Job |
|---|---|---|
| App | `app.py` | Creates the Flask app and registers the four route files |
| Routes | `routes/home.py` | `/` (home page) and `/search-index.json` (the search box's list of every page) |
| | `routes/notes.py` | `/notes/<path>`, plus the older Google Drive PDF viewer (`/viewer`, `/proxy-pdf`), which no page links to now |
| | `routes/practice.py` | `/practice` (the hub) and `/practice/<path>` (one set, with next/previous) |
| | `routes/past.py` | `/past`, `/past/<exam>` and `/past/<exam>/<paper>` |
| Reading content | `utils/content_loader.py` | Walks `content/`, reads titles, covers and progress-related fields, and caches the lists |
| Names | `utils/courses.py` | Display names: `math-1` → "Math I", topic name fixes, subjects, past-question categories |
| Google Drive | `utils/google_drive.py`, `utils/google_drive_link.py` | Only for the PDF viewer. They need `GOOGLE_CREDENTIALS_JSON` |
| Templates | `templates/base.html` | The shared `<head>`: Bootstrap, Font Awesome, fonts |
| | `templates/partials/floatbar.html` | The floating bar on every page |
| | `home.html`, `note.html`, `practice-list.html`, `practice.html`, `past-list.html`, `pdf-viewer.html` | One template per kind of page |
| Styles and scripts | `static/css/<page>.css`, `static/js/<page>.js` | Named after the page they belong to (the tables in sections 4 and 7 list them) |
| Demo helpers | `static/js/demos/` | Drawing tools for the TRY IT demos in notes (section 4) |

The sections below go into detail:
- Sections 0–6 cover notes.
- Section 7 covers practice sets.
- Section 8 covers past questions.
- Section 9 explains what the browser saves.
- Section 10 covers running and deploying the site.

## 0. Folders and file names

```
content/
├── notes/<course>/<topic>/<nn-name>.html      the notes
├── practice/<course>/<topic>/<nn-name>.html   practice sets (same course and topic folders as notes/)
└── past/<category>/<nn-name>.html             past question papers (eju/, university/)
```

- Every folder and file name is **lowercase words joined by hyphens**, starting with a two-digit number that sets the order: `content/notes/math-1/03-quadratic-functions/05-quadratic-formula.html`.
- Courses: `math-1`, `math-2`, `math-3`, `math-a`, `math-b`, `math-c`. Topics are numbered in textbook order.
- Keep names short and plain ASCII: write `x2` for x², `minus`, `over`, `theta`, `alpha` for symbols. The page title in the file's `<h1>` can use any characters.
- The path without `content/<kind>/` and `.html` is the page's URL: `/notes/math-1/03-quadratic-functions/05-quadratic-formula`.
- Display names live in **`utils/courses.py`**: `math-1` → "Math I", past categories → their names and descriptions. Topic names are made from the folder name (`03-quadratic-functions` → "Quadratic Functions"); add an entry to `TOPIC_NAMES` only if that gives the wrong name.

A note file is not a full web page. It is a fragment of HTML that Flask reads from disk and inserts into one shared page template. Every note uses the same structure, so they all look the same and are written the same way.

## 1. How a note reaches the screen

```
content/notes/<course>/<topic>/<nn-name>.html   ← the note file (an HTML fragment)
        │
utils/content_loader.py   finds every .html under content/notes/, reads each note's title
        │
routes/notes.py        /notes/<path> → loads the file, works out where it sits
                       (Math C › Plane Vectors · 17 of 17) and the previous/next notes
        │
templates/note.html    the shared page: floating bar, Topics sidebar, purple header
                       with the title, previous/next cards, MathJax, the shared CSS
        │
<main class="note-content">{{ content|safe }}</main>   ← the note is inserted here
```

- **`utils/content_loader.py`** walks `content/notes/` and turns each file path into a URL path, for example `math-c/01-plane-vectors/17-line-perpendicular-to-a-vector`. The list is sorted, so the number at the start of each name sets the order of the previous/next buttons. The list is cached and rebuilt when the folder changes.
- **The note's title** comes from `<h1 class="note-title">`, not from the filename. The loader reads it for the sidebar and search, and the route shows it in the purple header (the note's own `<h1>` is hidden by the CSS, so the title isn't shown twice). So the title can be longer than the filename (for example `02-graph-of-y-ax2` has the title "Graph Shape of y = ax²").
- **Course and topic folders** (for example `math-c` / `01-plane-vectors`) become the Course and Topic dropdowns in the Topics sidebar.
- **`templates/note.html`** loads MathJax with `$...$` as the maths delimiter, and loads `static/css/note-blocks.css` for the shared note design.

## 2. Inside a note file

Using `content/notes/math-c/01-plane-vectors/17-line-perpendicular-to-a-vector.html` as the example:

| Lines | Part | Purpose |
|---|---|---|
| 1 | `<!-- tags: Vector -->` | Topic tag |
| 2–7 | Header comment | Topic name in English and Japanese, plus which shared files the note uses |
| 8 | `<article class="note-page">` | Wraps the note so the shared CSS applies to it |
| 10 | `<h1 class="note-title" data-topic="Vector">` | Title, read for the header, sidebar and search (hidden inside the note itself) |
| 13–110 | The 8 blocks | See below |
| 114–115 | `<script src=...>` | Loads the drawing helpers |
| 116–146 | Demo script | Draws the interactive TRY IT demo |

### The 8 blocks, always in this order

| Block | Class | Label shown | What it contains |
|---|---|---|---|
| 1 | `note-concept` | CONCEPT | The idea in plain words, with the Japanese term in brackets |
| 2 | `note-formula` | FORMULA | `.formula-main` holds the big formula; `.symbols` holds a short note under it |
| 3 | `note-proof` | WHY IT WORKS | A short numbered proof |
| 4 | `note-demo` | TRY IT | A `<canvas>`, any sliders (`.controls`) and a readout box (`.output`) |
| 5 | `note-example` ×3–5 | EXAMPLE | A `.question`, then `<details>` holding the steps (`.note-steps`) and the `.answer` |
| 6 | `note-warning` | WATCH OUT | A common mistake |
| 7 | `note-tip` | TIP | A shortcut or hint |
| 8 | `note-takeaways` | REMEMBER | 3 bullet points |

Notes don't contain a `<style>` block. The labels, colours and card shapes all come from `static/css/note-blocks.css`, where each class gets its own accent colour and its label through `::before`. To change how every note looks, edit that one file.

### Content rules

- Stay within the Japanese high-school curriculum. For example, the vector notes don't use the cross product, tan⁻¹ / cos⁻¹, or vectors in more than 3 dimensions; angles are found from cos θ and sin θ.
- Write maths between `$...$` (inline) or `$$...$$` (displayed). Write `<` and `>` inside maths as `&lt;` and `&gt;`.

## 3. The demo script

Every demo script has the same shape:

```js
(function () {                                   // wrapper: names can't clash with other scripts
  const output = document.getElementById('vhOutput');     // ids use a unique prefix per note (vh…)
  const half = ([x, y]) => [Math.round(x*2)/2, ...];      // small local helpers
  NotePlot.graph(canvas, {
    x: [-6.2, 6.2], y: [-4, 4],                  // visible range in maths units
    points: { A: [-1, 0], N: [0, 2] },           // draggable points
    constrain: { A: half },                      // snap rule for each point
    draw(g, P) { g.line(...); g.seg(...); output.textContent = ...; }  // runs again on every drag
  });
})();
```

- **The comment at the top** of each script says what the user can drag and what each colour means.
- **Unique id prefixes** (`vh`, `vf`, `vw`…) stop two notes' canvases or outputs from clashing.
- **Sliders** call `plot.redraw` when they change, for example `tBox.addEventListener('input', plot.redraw);` in Vector note 15.
- **Readouts** wrap negative numbers in brackets (`2×(−1)`, not `2×-1`); several notes have a small `par` helper for this.

## 4. Shared helper files

| File | Used by | What it gives a note |
|---|---|---|
| `static/js/demos/geom.js` | Geometry notes | `NoteGeom.board()`: draggable points in pixel coordinates, plus maths helpers (`dist`, `mid`, `angle`…) |
| `static/js/demos/plot.js` | Graph and vector notes (built on `demos/geom.js`, so load both) | `NotePlot.graph()`: maths coordinates with y pointing up, automatic axes and grid, and drawing tools like `g.fn`, `g.seg`, `g.line`, `g.poly`, `g.region`. The `plain: true` option hides the axes and grid, for the 3D drawings |
| `static/js/demos/venn.js` | Set notes | `NoteVenn`: parses and formats sets and draws Venn diagrams |
| `static/css/note-blocks.css` | Every note | All the block styles |

The page around the note, which notes don't need to touch:

| File | What it does |
|---|---|
| `templates/partials/floatbar.html`, `static/css/floatbar.css`, `static/js/floatbar.js` | The floating bar shared by the home and note pages: logo, where you are, search (loads `/search-index.json`), text size, previous/next, Topics |
| `static/css/note-page.css` | Note page layout: background, header, the card (920px wide), sidebar, previous/next cards |
| `static/js/note-page.js` | Topics sidebar, A−/A+ text size (saved), ← / → keys for previous/next (not while a slider or text box has focus) |

Each helper file begins with a comment listing its functions and their options, so read that first when writing a new demo.

## 5. Subjects on the home page

The home page (`templates/home.html`, scripts in `static/js/home.js`) groups the course folders into subject tabs. The list of subjects is `SUBJECTS` in `utils/courses.py`:

- Each course in `COURSES` names its subject. A course folder not listed there goes under the subject named by its first word: `physics-basic` → Physics.
- A subject with no notes yet shows a **Coming soon** tab. It switches on by itself once a folder for it has notes.
- A folder that matches no subject in the list gets its own tab, named after the folder's first word (for example `chemistry-basic` → Chemistry). Add it to `SUBJECTS` to choose its icon and tab order.
- Add the new course to `COURSES` to give it a display name (for example `physics-basic` → "Physics Basic").

To start Physics, add notes like `content/notes/physics-basic/01-motion/01-velocity.html`, using the same 8-block layout as the maths notes.

## 6. Adding a new note

1. Copy an existing note from the same folder.
2. Rename it with the next number, for example `18-something.html`.
3. Change the tag, the title and the 8 blocks.
4. Give the demo a new id prefix and rewrite its `draw()` function.

The app finds the new file on its own; you don't need to register it anywhere.

## 7. Practice sets

Practice problems with worked solutions are HTML pages too, kept in their own folder with the same course/topic folders as the notes:

```
content/practice/math-c/01-plane-vectors/02-dot-product.html   →   /practice/math-c/01-plane-vectors/02-dot-product
```

- **Sets in a topic:** first the **concept sets**, each covering 3–5 related notes (about 6 problems, from `basic` up to one `exam` question in parts), then the **topic review**, a mix of the whole topic, named `<nn>-topic-review.html`. Every note should be used by at least two problems.
- **Top comment:** a concept set says which notes it covers, as `Concept set 2 for Plane Vectors: covers notes 07–11.` The practice page shows this text ("Covers notes 07–11"), so write it the way a student should read it (`05, 10 and 11` is fine too).
- **Renaming a set** changes its URL, and saved progress is stored by URL. List the old paths in `data-moved-from` on the `<article>` (separated by `|`); `practice.js` moves saved progress to the new path the first time the page opens, and the practice page reads it from the old paths until then.
- **The practice page** (`/practice`, the "Practice" link in the floating bar and on the home page) has a tab per course and a card per topic. Each card lists the topic's sets in order, with the notes they cover and "Solved 2 of 6" from the progress saved on the device; the topic review is marked **Topic review**. The past questions are linked at the bottom. `/practice#math-a` opens on Math A.
- The set page (`templates/practice.html`) has the same floating bar, header and card as a note. The header shows "Solved 2 of 5"; "Practice" in the floating bar goes back to the practice page.
- **At the end of a set**, the next card leads on in the practice page's order: **Next practice** (the next set in the topic), **Topic review**, then **Next topic** (the next topic's first set; after a course's last topic, the next course). The ← / → buttons follow the same order.
- After each note, a **Practise this note** card opens the first concept set whose problems link to that note (via "Uses:"), and the topic's other sets are listed under it. The search box finds practice sets too.
- Styles: `static/css/practice.css` (a set) and `static/css/practice-list.css` (the practice page). Scripts: `static/js/practice.js` and `static/js/practice-list.js`. Loader: `utils/content_loader.py`. Routes: `/practice` and `/practice/...` in `routes/practice.py`.
- A topic needs at least one note, because the header links back to the topic's notes. Sets in a topic without notes are left off the practice page.

A practice file is a fragment like a note:

```html
<article class="note-page practice-page">
  <h1 class="practice-title">Dot Product and Angles</h1>
  <p class="practice-intro">What this set practises.</p>

  <section class="practice-problem" data-level="basic" data-answer="45" data-placeholder="angle in degrees">
    <h2>Problem 1</h2>
    <p class="question">The question, with maths in $...$.</p>
    <p class="related">Uses: <a href="/notes/...">The note it practises</a></p>
    <details class="hint"><summary>Show hint</summary><p>A nudge, not the answer.</p></details>
    <details class="solution">
      <summary>Show solution</summary>
      <ol class="note-steps"><li>Step 1</li><li>Step 2</li></ol>
      <p class="answer">The final answer</p>
    </details>
  </section>
</article>
```

- `data-level`: `basic`, `standard`, `challenge` or `exam` (the badge and colour).
- `data-answer` (optional): the value the answer box checks against. Write it the way a student would type it: `45`, `6`, `2√7`, `5/2`, `√3/2`, `5π/6`, `3e`, `4/e^2`, `π^2/2` (digits, `+ − × ÷ ^ ( )`, `√`, `π` and `e` are understood). Typed answers count as correct within 0.01, so `5.29` is accepted for `2√7`. Leave it out for problems whose answer isn't one number (proofs, "find all…").
- The answer box and the "I got it / Review later" buttons are added by `practice.js`; don't write them in the file.
- Keep the solution steps short and numbered, like the examples in the notes, and put any extra insight in `<p class="practice-note">` inside the solution.

## 8. Past questions

Past exam questions use the same file format as practice sets, grouped by exam instead of by topic:

```
content/past/eju/01-sample-paper-math-course-2.html   →   /past/eju/01-sample-paper-math-course-2
```

- **Past questions** (`/past`, linked at the bottom of the practice page) shows one card per folder in `content/past/`. Clicking a card lists its papers (`/past/<folder>`), and each paper opens in `templates/practice.html` with hints, solutions and answer boxes. The search box finds papers too.
- **New exam:** make a new folder in `content/past/`. Give it a name, an icon and a one-line description in `PAST_CATEGORIES` in `utils/courses.py` (without one it gets a generic description). Routes: `routes/past.py`.
- **New paper:** add an HTML file to the folder. Number files `01-`, `02-`, … to set the order. Use `data-level="exam"` for each problem.
- **Problems in parts:** list the parts right after the question and number the solution steps the same way. The answer box checks one number, so say which part to type in:

```html
<p class="question">A bag holds 4 red balls and 3 white balls…</p>
<ol class="parts">
  <li>(1) Find the probability that exactly 2 are red.</li>
  <li>(2) Find the expected number of red balls. (Type this one in the box.)</li>
</ol>
```

- Real past papers belong to the exam's publisher (JASSO for the EJU, or the university), so check you may republish a paper before adding it.
- Styles: `static/css/past.css` (the list pages) and `static/css/practice.css` (the paper itself).

## 9. What is saved on the device

The site has no accounts. Everything a student does is kept in the browser's `localStorage`, so it stays on that one device and browser:

| Key | Written by | What it holds |
|---|---|---|
| `practice:<path>` | `static/js/practice.js` | One practice set's progress, for example `practice:math-1/03-quadratic-functions/01-vertex-form`. It is a JSON map from problem number (from 0) to `"solved"` or `"review"`. Past papers use `practice:past/<exam>/<paper>`, so they never clash with a set |
| `practice-hub:course` | `static/js/practice-list.js` | The course tab last opened on `/practice` |
| `noteFontSize` | `static/js/note-page.js` | The A−/A+ text size, from 70 to 150 (%) |

Because progress is stored under the set's path, renaming a set loses it unless you add `data-moved-from` (section 7).

## 10. Running and deploying

**On your computer:**

```bash
python -m venv venv && venv/bin/pip install -r requirements.txt   # once
venv/bin/python app.py                                            # http://localhost:5000
FLASK_DEBUG=1 venv/bin/python app.py                              # reloads when Python files change
```

You don't need to restart after editing content. Every page is read from its file on each visit, and the notes list is rebuilt when a file is added, renamed or removed. If you change a note's `<h1>` title and the sidebar or search still shows the old one, restart the app.

**On the web:** the site runs on Render, set up by `render.yaml`. Render installs `requirements.txt` and starts `gunicorn app:app`. It deploys again when `main` changes, so the usual flow is:

1. Make a branch.
2. Commit.
3. Open a pull request.
4. Merge into `main`.

`GOOGLE_CREDENTIALS_JSON` is set in the Render dashboard, not in the repo, and only the PDF viewer needs it.

**Before merging**, open the pages you changed in the browser. For a practice set, also check:
- every `data-answer` is accepted when typed in,
- the "Uses:" links open the right notes,
- the set appears on `/practice`.
