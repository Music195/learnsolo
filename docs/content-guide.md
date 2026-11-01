# LearnSolo: project and content guide

## Start here

LearnSolo is a study site for Japanese high-school maths (Math I, II, III, A, B and C), written in English. It has three kinds of content:

| Kind | What it is | Where it lives | URL |
|---|---|---|---|
| **Notes** | One idea per page: concept, formula, proof, an interactive demo, worked examples | `content/notes/` | `/notes/...` |
| **Practice sets** | 6–7 problems with hints, solutions and an answer box, for a few notes at a time, then a topic review | `content/practice/` | `/practice`, `/practice/...` |
| **Past questions** | Exam papers, checked the same way as practice sets: **EJU Mock Papers** (original papers in the EJU format, 10 per course) and **University Past Questions** | `content/past/` | `/past`, `/past/...` |

**You write every page as an HTML file under `content/`.** `flask import-content` copies them into the PostgreSQL database, Flask sends them to the browser as JSON (`/api/...`), and the React app in `frontend/` shows them. To add a page, add a file and run the import (sections 6, 7 and 8). Nothing has to be registered.

**How a student moves through the site:**

```
Home (/)  ── subject tabs → course → topic ──►  Note  ◄─ previous / next ─►  Note
   │                                              │
   │                                              └─ "Practise this note" card
   ▼                                              ▼
Practice hub (/practice) ── tab per course ──►  Practice set ── Next practice → Topic review → Next topic
   │
   └─ bottom link ──►  Past questions (/past) ──┬─►  EJU Mock Papers (/past/eju) ── Course 1 / Course 2 tab ──►  Paper
                                                 └─►  University Past Questions (/past/university) ──►  Paper
```

The floating bar at the top of every page has the search box, which finds notes, sets and papers, plus links to Practice and Past questions.

### Map of the code

The server code lives in `backend/`, so every code path in this table (`app.py`, `api/`, `services/`, `utils/`…) is inside `backend/`. The React app is in `frontend/` (section 12), and `content/` stays at the project root.

Pages are served from a PostgreSQL database, not straight from the files. You still write content as HTML files in `content/`; `flask import-content` copies them into the database (section 10).

| Part | Files | Job |
|---|---|---|
| App | `app.py` | Creates the Flask app, connects the database and logins, registers the API and the React app, and the `flask import-content` command |
| React app | `frontend.py` | Sends the built React app (`frontend/dist`, made by `npm run build`): its files, and `index.html` for every other address so React shows the page. `/api/...` never gets it |
| Settings | `config.py`, `.env` (project root) | `DATABASE_URL` and `SECRET_KEY`; copy `.env.example` to `.env` |
| Database | `extensions.py`, `models.py`, `migrations/` | The tables (courses, topics, notes, problem_sets, users, progress) and their history for `flask db upgrade` |
| Importing content | `importer.py` | Reads every file in `content/` (titles, covers, exam labels…) and adds, updates or removes rows to match |
| Reading content | `utils/content_loader.py` | Reads notes, practice sets and past papers from the database |
| Page data | `services/home.py`, `notes.py`, `practice.py`, `past.py` | Works out what each page shows: lists, where a page sits, previous/next. Used by the API. `services/urls.py` builds page addresses (the React app's) |
| JSON API | `api/__init__.py`, `api/content.py` | `/api/...`: notes, practice sets and papers as JSON for the React frontend (section 11) |
| Accounts | `api/auth.py`, `api/progress.py` | Sign up, log in and out (Flask-Login cookies), and each user's saved practice progress (sections 9 and 11) |
| Tests | `tests/`, `pytest.ini` | `pytest` from `backend/` (section 10) |
| Names | `utils/courses.py` | Display names: `math-1` → "Math I", topic name fixes, subjects, past-question categories (`eju` → "EJU Mock Papers", `course-1` → "Course 1 (Basic)") |
| Pages | `frontend/src/` | The React app: pages, components, styles (section 12) |
| Demo helpers | `frontend/public/static/js/demos/` | Drawing tools for the TRY IT demos in notes, at `/static/js/demos/...` (section 4) |

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
└── past/<category>/[<group>/]<nn-name>.html   past question papers (eju/course-1/, eju/course-2/, university/)
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
flask import-content   importer.py reads each file and its title into the notes table
        │
utils/content_loader.py   gets the notes list and the note's HTML from the database
        │
api/content.py         /api/notes/<path> → services/notes.py loads the note, works out where it sits
                       (Math C › Plane Vectors · 17 of 17) and the previous/next notes, as JSON
        │
frontend/src/pages/Note.jsx   React, at /notes/<path>: floating bar, Topics sidebar, purple
                       header with the title, previous/next cards
        │
components/NoteContent.jsx   puts the note's HTML on the page, runs its scripts, draws the maths
```

- **`importer.py`** walks `content/notes/` and turns each file path into a URL path, for example `math-c/01-plane-vectors/17-line-perpendicular-to-a-vector`. The paths are sorted and the order is saved with each row, so the number at the start of each name sets the order of the previous/next buttons.
- **The note's title** comes from `<h1 class="note-title">`, not from the filename. The loader reads it for the sidebar and search, and the route shows it in the purple header (the note's own `<h1>` is hidden by the CSS, so the title isn't shown twice). So the title can be longer than the filename (for example `02-graph-of-y-ax2` has the title "Graph Shape of y = ax²").
- **Course and topic folders** (for example `math-c` / `01-plane-vectors`) become the Course and Topic dropdowns in the Topics sidebar.
- **`frontend/index.html`** loads MathJax with `$...$` as the maths delimiter, and `src/styles/note-blocks.css` holds the shared note design.

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

Notes don't contain a `<style>` block. The labels, colours and card shapes all come from `frontend/src/styles/note-blocks.css`, where each class gets its own accent colour and its label through `::before`. To change how every note looks, edit that one file.

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
| `/static/js/demos/geom.js` | Geometry notes | `NoteGeom.board()`: draggable points in pixel coordinates, plus maths helpers (`dist`, `mid`, `angle`…) |
| `/static/js/demos/plot.js` | Graph and vector notes (built on `demos/geom.js`, so load both) | `NotePlot.graph()`: maths coordinates with y pointing up, automatic axes and grid, and drawing tools like `g.fn`, `g.seg`, `g.line`, `g.poly`, `g.region`. The `plain: true` option hides the axes and grid, for the 3D drawings |
| `/static/js/demos/venn.js` | Set notes | `NoteVenn`: parses and formats sets and draws Venn diagrams |
| `src/styles/note-blocks.css` | Every note | All the block styles |

The demo helpers are in `frontend/public/static/js/demos/`. Notes load them by their address (`<script src="/static/js/demos/venn.js">`), and `geom.js` and `plot.js` are already loaded on every page. Paths starting with `src/` are in `frontend/`.

The page around the note, which notes don't need to touch:

| File | What it does |
|---|---|
| `src/components/FloatBar.jsx`, `SearchBox.jsx`, `src/styles/floatbar.css` | The floating bar on every page: logo, where you are, search (loads `/api/search-index`), text size, previous/next, Topics, Log in |
| `src/styles/note-page.css` | Note page layout: background, header, the card (920px wide), sidebar, previous/next cards |
| `src/pages/Note.jsx`, `src/components/TopicsSidebar.jsx`, `src/pageHooks.js` | Topics sidebar, A−/A+ text size (saved), ← / → keys for previous/next (not while a slider or text box has focus) |

Each helper file begins with a comment listing its functions and their options, so read that first when writing a new demo.

## 5. Subjects on the home page

The home page (`frontend/src/pages/Home.jsx`) groups the course folders into subject tabs. The list of subjects is `SUBJECTS` in `utils/courses.py`:

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

Then run `flask import-content` (section 10); you don't need to register the note anywhere else.

## 7. Practice sets

Practice problems with worked solutions are HTML pages too, kept in their own folder with the same course/topic folders as the notes:

```
content/practice/math-c/01-plane-vectors/02-dot-product.html   →   /practice/math-c/01-plane-vectors/02-dot-product
```

- **Sets in a topic:** first the **concept sets**, each covering 3–5 related notes (about 6 problems, from `basic` up to one `exam` question in parts), then the **topic review**, a mix of the whole topic, named `<nn>-topic-review.html`. Every note should be used by at least two problems.
- **Top comment:** a concept set says which notes it covers, as `Concept set 2 for Plane Vectors: covers notes 07–11.` The practice page shows this text ("Covers notes 07–11"), so write it the way a student should read it (`05, 10 and 11` is fine too).
- **Renaming a set** changes its URL, and saved progress is stored by URL. List the old paths in `data-moved-from` on the `<article>` (separated by `|`); `practice.js` moves saved progress to the new path the first time the page opens, and the practice page reads it from the old paths until then.
- **The practice page** (`/practice`, the "Practice" link in the floating bar and on the home page) has a tab per course and a card per topic. Each card lists the topic's sets in order, with the notes they cover and "Solved 2 of 6" from the progress saved on the device; the topic review is marked **Topic review**. The past questions are linked at the bottom. `/practice#math-a` opens on Math A.
- The set page (`src/pages/PracticeSet.jsx`) has the same floating bar, header and card as a note. The header shows "Solved 2 of 5"; "Practice" in the floating bar goes back to the practice page.
- **At the end of a set**, the next card leads on in the practice page's order: **Next practice** (the next set in the topic), **Topic review**, then **Next topic** (the next topic's first set; after a course's last topic, the next course). The ← / → buttons follow the same order.
- After each note, a **Practise this note** card opens the first concept set whose problems link to that note (via "Uses:"), and the topic's other sets are listed under it. The search box finds practice sets too.
- Styles: `src/styles/practice.css` (a set) and `src/styles/practice-list.css` (the practice page). Code: `frontend/src/practice.js`, `src/pages/PracticeList.jsx`, `src/pages/PracticeSet.jsx` and `src/components/HubTabs.jsx` (section 12). Loader: `utils/content_loader.py`. API: `/api/practice` and `/api/practice/...` in `api/content.py`.
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

Past exam questions use the same file format as practice sets, grouped by exam instead of by topic. There are two categories:

| Folder | Name on the site | What it holds |
|---|---|---|
| `content/past/eju/course-1/`, `course-2/` | **EJU Mock Papers**, with a Course 1 (Basic) and a Course 2 (Advanced) tab | 10 original mock papers per course, 6 problems each |
| `content/past/university/` | **University Past Questions** | Longer problems with written solutions |

An exam folder can be split into subfolders, as the EJU papers are by course:

```
content/past/university/01-sample-paper-proof-and-calculus.html   →   /past/university/01-sample-paper-proof-and-calculus
content/past/eju/course-1/03-mock-paper.html                       →   /past/eju/course-1/03-mock-paper
```

- **Past questions** (`/past`, linked at the bottom of the practice page and from "More to explore" on the home page) shows one card per folder in `content/past/`. Clicking a card lists its papers (`/past/<folder>`), and each paper opens like a practice set (`src/pages/PastPaper.jsx`) with hints, solutions and answer boxes. The search box finds papers too.
- **Subfolders** (`eju/course-1/`, `eju/course-2/`) become tabs on the folder's list page, which uses the practice hub's tabs, rows and "Solved n of m" badges (`practice-list.css`, `practice-list.js`). Previous / next on a paper stay inside its subfolder, and the floating bar shows "EJU Mock Papers › Course 1 (Basic) · Paper 3 of 10". `/past/eju#course-2` opens on Course 2. Name the subfolders under `"groups"` in `PAST_CATEGORIES`.
- **New exam:** make a new folder in `content/past/`. Give it a name, an icon and a one-line description in `PAST_CATEGORIES` in `utils/courses.py` (without one it gets a generic description). API: `/api/past/...` in `api/content.py`.
- **New paper:** add an HTML file to the folder (or subfolder). Number files `01-`, `02-`, … to set the order. Use `data-level="exam"` for each problem.
- **EJU mock papers** (10 per course) follow the exam's layout: six problems in the order I Q1, I Q2, II Q1, II Q2, III, IV. Course 1 and Course 2 share the kind of question in Section I (quadratic functions, then counting and probability). After that, Course 1 has numbers and sets, quadratics, integers and figures; Course 2 has sequences, logarithms or trigonometry, vectors or complex numbers, then Math III differentiation and integration. Each problem names its exam question in a label after the title, and the list page shows these labels as the paper's topics:

```html
<h2>Problem 1 <span class="exam-label">I Q1 · Quadratic functions</span></h2>
```

- **Renaming a paper:** list the old paths in `data-moved-from`, with `past/` in front (`data-moved-from="past/eju/02-practice-paper-course-1"`). Saved progress moves to the new path, and old links redirect to it.
- **Problems in parts:** list the parts right after the question and number the solution steps the same way. The answer box checks one number, so say which part to type in:

```html
<p class="question">A bag holds 4 red balls and 3 white balls…</p>
<ol class="parts">
  <li>(1) Find the probability that exactly 2 are red.</li>
  <li>(2) Find the expected number of red balls. (Type this one in the box.)</li>
</ol>
```

- Real past papers belong to the exam's publisher (JASSO for the EJU, or the university), so check you may republish a paper before adding it. The EJU mock papers are original problems in the same format, not copies of past papers.
- Styles: `src/styles/past.css` (the list pages), `src/styles/practice-list.css` (the tabs on `/past/eju`) and `src/styles/practice.css` (the paper itself, including `.exam-label`).
- The search box lists EJU papers as "Past question: Mock Paper 3 · Course 1" with "EJU Mock Papers · Course 1 (Basic) · Past question" under it.

## 9. What is saved, and where

Anyone can make an account (`/signup`) or log in (`/login`) with the button at the right of the floating bar.

- **Logged out**, everything a student does is kept in the browser's `localStorage`. It stays on that one device and browser.
- **Logged in**, practice progress is saved to their account in the database (the `progress` table, one row per set per user), so it is the same on every device. `src/progress.js` loads it all once at log in and sends each change to `PUT /api/progress/<path>`.
- **At log in or sign up**, progress saved in the browser is added to the account (`POST /api/progress/merge`) and then removed from the browser. Where both have the same set, they are combined problem by problem: "solved" in either place wins, so nothing is lost.
- Tabs and text size always stay in the browser.

The `localStorage` keys:

| Key | Written by | What it holds |
|---|---|---|
| `practice:<path>` | `src/progress.js` (logged out only) | One practice set's progress, for example `practice:math-1/03-quadratic-functions/01-vertex-form`. It is a JSON map from problem number (from 0) to `"solved"` or `"review"`. Past papers use `practice:past/<path>`, for example `practice:past/eju/course-1/03-mock-paper`, so they never clash with a set |
| `practice-hub:course` | `src/components/HubTabs.jsx` | The course tab last opened on `/practice` |
| `past-tab:<exam>` | `src/components/HubTabs.jsx` | The tab last opened on a past-question list, for example `past-tab:eju` |
| `noteFontSize` | `src/pageHooks.js` | The A−/A+ text size, from 70 to 150 (%) |

Progress is stored under the set's path, both in the browser and in accounts. Renaming a set loses it unless you add `data-moved-from` (section 7); the progress then moves to the new path the first time the set is opened.

**Passwords** are never stored, only a hash of them (`werkzeug.security`), and the login cookie can't be read by JavaScript (HttpOnly). It is signed with `SECRET_KEY`, so keep that secret and long (`.env.example` shows how to make one).

## 10. Running and deploying

**On your computer** (from the project root, once):

```bash
python -m venv venv && venv/bin/pip install -r backend/requirements.txt
cp .env.example .env              # then set SECRET_KEY to a long random string
docker compose up -d              # starts PostgreSQL (again after each reboot)
cd backend
../venv/bin/flask db upgrade      # creates the tables
../venv/bin/flask import-content  # copies content/ into the database
```

Then, from `backend/`:

```bash
../venv/bin/python app.py         # the API on http://localhost:5000 (reloads when Python files change, FLASK_DEBUG=1 in .env)
```

and, in a second terminal, the React app (section 12): `cd frontend && npm run dev`, then open http://localhost:5173.

**After editing content**, run `../venv/bin/flask import-content` from `backend/` and refresh the page. It prints how many rows were added, updated and removed; running it twice in a row changes nothing. The app doesn't need a restart.

**After changing `models.py`**, make a migration and apply it: `../venv/bin/flask db migrate -m "what changed"`, check the new file in `migrations/versions/`, then `../venv/bin/flask db upgrade`. Commit the migration file with the model change.

**Tests**, from `backend/` (once: `../venv/bin/pip install -r requirements-dev.txt`):

```bash
../venv/bin/pytest          # every test; add -v to see each name
```

They create and use a separate `learnsolo_test` database, filled from `content/`, so your own database is never changed. Run them before opening a pull request.

**On the web:** the site runs on Render, set up by `render.yaml` (a Render "Blueprint"). It has two parts: a PostgreSQL database (`learnsolo-db`) and the web service (`learnsolo`). On every deploy Render:

1. **Builds:** installs `backend/requirements.txt`, then runs `npm ci && npm run build` in `frontend/`.
2. **Starts**, from `backend/`: `flask db upgrade` (new tables or columns), `flask import-content` (the content as it is in `main`), then `gunicorn app:app`, the web server. Flask answers `/api/...` and sends the built React app for everything else.

So editing content needs no extra step online: merge it, and the import runs when the new version starts.

The settings are in `render.yaml` too:
- `DATABASE_URL` is filled in from the database.
- `SECRET_KEY` is made once by Render, as a long random value.
- `SESSION_COOKIE_SECURE=1` makes login cookies https-only.
- `NODE_VERSION` is the Node.js version for the build.

Nothing secret is in the repo.

**Free plan limits:**
- The web service sleeps after a quiet while, so the first visit after that takes about a minute.
- **A free Render database is deleted 30 days after it is made**, with its accounts and progress. To keep them, change the database's `plan` in `render.yaml` to a paid one (for example `basic-256mb`) before then, or point `DATABASE_URL` at another PostgreSQL host. The content itself is never lost: it comes back from `content/` with `flask import-content`.

It deploys again when `main` changes, so the usual flow is:

1. Make a branch.
2. Commit.
3. Open a pull request.
4. Merge into `main`.

**Before merging**, open the pages you changed in the browser. For a practice set, also check:
- every `data-answer` is accepted when typed in,
- the "Uses:" links open the right notes,
- the set appears on `/practice`.

## 11. JSON API

Everything under `/api` returns JSON instead of a page. The React frontend will use it; for now you can open any of these in the browser to see the data. Each returns the same data its HTML page uses (from `services/`); fields called `content` hold the HTML of the note, set or paper.

| Address | Returns |
|---|---|
| `/api/home` | `subjects` (tabs → courses → topics) and `stats` (counts) |
| `/api/search-index` | `[{title, where, url}]` for every note, set and paper |
| `/api/notes` | `notes_meta` (every note's path and title, in order) and `display_names` for the Topics sidebar |
| `/api/notes/<path>` | `note_title`, `content`, `location`, `nav` (prev/next) and `practice` (sets for this note) |
| `/api/practice` | `courses` → topics → sets |
| `/api/practice/<path>` | one set: `title`, `count`, `content`, `location`, `nav` |
| `/api/past` | `categories`, each with its papers |
| `/api/past/<exam>` | one category: name, about, `papers`, `groups` |
| `/api/past/<exam>/[<course>/]<paper>` | one paper, like a set, plus `paper` (its category) |

Anything that doesn't exist answers `404` with `{"error": "not found"}`. The old address of a renamed paper answers `404` with `{"error": "moved", "moved_to": "/past/..."}`.

**Accounts** (`api/auth.py`). They send and receive JSON; mistakes answer with `{"error": "..."}`, a message to show the user.

| Request | Does |
|---|---|
| `GET /api/auth/me` | `{"user": {"email"}}`, or `{"user": null}` when logged out |
| `POST /api/auth/signup` `{"email", "password"}` | Makes an account and logs in (`201`). `400` for a bad email or a password under 8 characters, `409` if the email has an account |
| `POST /api/auth/login` `{"email", "password"}` | Logs in, or `401` "Wrong email or password." (the same message whichever is wrong) |
| `POST /api/auth/logout` | Logs out |

**Progress** (`api/progress.py`), only when logged in; otherwise `401` `{"error": "login required"}`. A set's progress is the same map as in the browser, e.g. `{"0": "solved", "2": "review"}`.

| Request | Does |
|---|---|
| `GET /api/progress` | `{"progress": {<path>: {...}}}`: every set with progress |
| `PUT /api/progress/<path>` | Saves one set's progress (`{}` for "Start again") |
| `DELETE /api/progress/<path>` | Forgets one set's progress |
| `POST /api/progress/merge` `{"progress": {...}}` | Adds the browser's progress to the account ("solved" wins) and returns all of it |

## 12. React frontend

Every page of the site is a React page in `frontend/`: the home page, notes, practice, past questions, log in and sign up. Any other address shows "Page not found".

**Run it** (Flask must be running too, for the data):

```bash
cd frontend
npm install        # once
npm run dev        # http://localhost:5173
```

`npm run dev` starts Vite, which shows changes as soon as you save a file. Requests to `/api/...` are passed on to Flask on :5000 (`vite.config.js`). Files in `public/` (the favicon and `/static/js/demos/`) are served as they are.

**Build it** for the live site: `npm run build` puts the finished files in `frontend/dist/` (git-ignored). Flask sends them (`backend/frontend.py`): `index.html` for every page address, so opening or refreshing `/notes/...` works, and React then shows the right page. Render runs the build on every deploy (section 10).

| File | Job |
|---|---|
| `index.html` | The one HTML page. Loads Bootstrap, Font Awesome, MathJax and the demo helpers (`/static/js/demos/`) once for every page |
| `src/main.jsx` | Starts React and the router |
| `src/App.jsx` | Which page component to show for which address. Add a `<Route>` here when a page moves to React |
| `src/styles.js`, `src/styles/` | The CSS, one file per kind of page; `styles.js` imports them all |
| `public/static/` | Copied as they are: `favicon.png` and `js/demos/` (the notes' drawing helpers) |
| `src/api.js` | `fetchJson(url)` and the `useApi(url)` hook: load data from `/api/...`; `sendJson(method, url, data)` sends data (log in, save progress) |
| `src/auth.jsx` | `<AuthProvider>` and `useAuth()`: who is logged in, and `signup`, `login`, `logout`. Asks `/api/auth/me` when the site opens |
| `src/pages/Account.jsx`, `src/styles/account.css` | The `/login` and `/signup` pages (one form), and the account button's style. Afterwards you go back to the page you came from |
| `src/mathjax.js` | `typeset(element)`: draw the `$...$` formulas inside an element, once |
| `src/pages/Home.jsx` | The home page, from `/api/home` |
| `src/pages/Note.jsx` | A note page (`/notes/<path>`), from `/api/notes/<path>`: header, practice links, previous/next cards, text size, ← / → keys |
| `src/components/NoteContent.jsx` | Shows a note's HTML, runs its `<script>` tags in order (loading helpers like `venn.js` once) and then draws its formulas |
| `src/components/TopicsSidebar.jsx` | The Topics sidebar, from `/api/notes` |
| `src/pages/PracticeList.jsx` | The practice hub (`/practice`), from `/api/practice`: course tabs (remembered; `#math-a` opens Math A) and "Solved n of m" per set and topic |
| `src/pages/PracticeSet.jsx` | One practice set (`/practice/<path>`), from `/api/practice/<path>`: header with progress and "Start again", next set |
| `src/practice.js` | Answer boxes and "I got it" / "Review later" buttons for each problem |
| `src/progress.js` | Reads and saves practice progress: in localStorage when logged out, in the account when logged in (section 9). Pages only use this file, so they don't need to know which |
| `src/pageHooks.js` | Shared by notes and sets: text size, ← / → keys, page title, back to the top on a new page |
| `src/components/LoadError.jsx` | "Not found" / "couldn't be loaded" messages |
| `src/pages/PastList.jsx` | `/past` (a card per exam) and `/past/<exam>` (its papers; tabs per subfolder, remembered as `past-tab:<exam>`, `#course-2` opens Course 2), from `/api/past` and `/api/past/<exam>` |
| `src/pages/PastPaper.jsx` | One paper (`/past/<exam>/[<course>/]<paper>`): works like a practice set, with progress under `past/<path>`. An old address of a renamed paper redirects to the new one |
| `src/components/HubTabs.jsx` | The tabs and "Solved n of m" badges shared by the practice hub and the past paper lists |
| `src/pages/NotFound.jsx` | "Page not found" for any other address |
| `src/components/FloatBar.jsx`, `SearchBox.jsx` | The floating bar (home version, or note version with where-you-are, text size, previous/next and Topics), its search box, and the "Log in" / "Log out" button |
| `src/components/HeroDemo.jsx` | The draggable demo on the home page |

The styles are in `src/styles/`, one file per kind of page, all imported by `src/styles.js`.

**MathJax:** typeset each element only once. A drawn formula keeps a hidden MathML copy for screen readers, and this MathJax build reads MathML too, so typesetting the same element again draws every formula a second time inside the first. `typeset()` in `src/mathjax.js` remembers which elements it has done.

**Scripts in notes:** React doesn't run `<script>` tags in HTML it inserts, so `NoteContent.jsx` runs them itself. Moving to another note doesn't reload the page, so all notes' scripts share one page. That's safe as long as each note keeps to the rules it already follows: wrap the code in `(function () { ... })();`, only touch elements inside the note, and don't wait for the page's load event (`DOMContentLoaded`); the note's HTML is already there when its script runs.

**If `npm run dev` stops passing `/api` to Flask** (pages say "couldn't be loaded" while Flask is running), restart it with Ctrl+C and `npm run dev`. This happens when `vite.config.js` briefly disappears while it runs, for example during `git checkout` to a branch without `frontend/`.
