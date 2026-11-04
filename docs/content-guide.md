# LearnSolo: Content Guide (`content/`)

## Start here

LearnSolo is a study site for Japanese high-school **Mathematics** (Math I, II, III, A, B and C) and **Physics** (Mechanics Basic, Heat, Waves, Electricity, Magnetism and Atomic Physics), as well as **Grade 12 Myanmar** (Mathematics MM and Physics MM), written in English (with Japanese and Burmese terms and a built-in 3-way English/Burmese/Japanese floating dictionary).

The project documentation is split into three connected guides so you can focus on one layer at a time:

| Guide | What it covers |
|---|---|
| **[docs/content-guide.md](content-guide.md)** *(this guide)* | Writing **Notes**, **Practice sets**, **Mock Questions**, interactive **TRY IT demos**, and **dictionary entries** in `content/`, plus how content connects to the backend and frontend |
| **[docs/backend-guide.md](backend-guide.md)** | The **Flask + PostgreSQL** server in `backend/`: importing content into the database, models, migrations, services, JSON API (`/api/...`), accounts, progress, and `pytest` |
| **[docs/frontend-guide.md](frontend-guide.md)** | The **React + Vite** app in `frontend/`: pages, components, hooks, CSS styles, MathJax formula rendering, answer checking, and `localStorage` |
| **[docs/dictionary-guide.md](dictionary-guide.md)** | Deep dive into the 3-way English/Burmese/Japanese dictionary (`content/dictionary.json`, CLI commands, hybrid lookup) |
| **[docs/oracle-server.md](oracle-server.md)** | How the Oracle Cloud production server (`https://learnsolo.duckdns.org`) is set up and deployed |

### The three kinds of learning content

| Kind | What it is | Where it lives | URL |
|---|---|---|---|
| **Notes** | One idea per page: concept, formula, proof, an interactive demo, worked examples | `content/notes/` | `/notes/...` |
| **Practice sets** | 6–7 problems with hints, solutions and an answer box, for a few notes at a time, then a topic review | `content/practice/` | `/practice`, `/practice/...` |
| **Mock Questions** | Exam papers, checked the same way as practice sets: **EJU Mock Papers** (original papers in the EJU format, 10 per course), **JLPT Mock Tests** (N1 to N5 levels, each with 10 mock tests across 4 skill sections: Vocabulary, Grammar, Reading, and Listening with audio scripts; 200 mock tests total) and **University Mock Questions** | `content/past/` | `/past`, `/past/...` |

**You write every page as an HTML file under `content/`.** To add a page, create the HTML file and run `flask import-content` (sections 3, 6 and 7). Nothing has to be registered in code.

**How a student moves through the site:**

```
Home (/)  ── subject tabs → course → topic ──►  Note  ◄─ previous / next ─►  Note
   │                                              │
   │                                              └─ "Practise this note" card
   ▼                                              ▼
Practice hub (/practice) ── tab per course ──►  Practice set ── Next practice → Topic review → Next topic
   │
   └─ bottom link ──►  Mock Questions (/past) ─┬─►  EJU Mock Papers (/past/eju) ── Course 1 / Course 2 tab ──►  Paper
                                               ├─►  JLPT Mock Tests (/past/jlpt) ── N1 to N5 level tabs ──► Section cards ──► Test
                                               └─►  University Mock Questions (/past/university) ──►  Paper
```

---

## 1. How Content, Backend, and Frontend Connect

Content files in `content/` are **HTML fragments** (not full `<html>...</html>` web pages). They do not get served directly as static files. Instead, the **Content**, **Backend**, and **Frontend** layers work together in a pipeline:

```
┌─────────────────────────── 1. CONTENT (content/) ───────────────────────────┐
│  You write HTML fragments:                                                   │
│    content/notes/<course>/<topic>/<nn-name>.html                             │
│    content/practice/<course>/<topic>/<nn-name>.html                          │
│    content/past/<exam>/[<group>/]<nn-name>.html                              │
│    content/dictionary.json                                                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         flask import-content / import-dictionary
                                       │
                                       ▼
┌─────────────────────────── 2. BACKEND (backend/) ───────────────────────────┐
│  • importer.py reads every HTML file, extracts its title, tags, cover note, │
│    exam labels, and problem count, and syncs rows into PostgreSQL.           │
│  • PostgreSQL stores courses, topics, notes, problem_sets, dictionary_entries│
│  • When a browser asks for a page, services/*.py + utils/content_loader.py  │
│    load the HTML from PostgreSQL, compute breadcrumbs & prev/next links,     │
│    and send JSON from /api/notes/..., /api/practice/..., /api/past/...       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                               JSON over HTTP (/api/...)
                                       │
                                       ▼
┌────────────────────────── 3. FRONTEND (frontend/) ──────────────────────────┐
│  • React pages (Note.jsx, PracticeSet.jsx, PastPaper.jsx) fetch the JSON     │
│    and draw the shared layout (FloatBar, purple header, sidebar, pager).     │
│  • NoteContent.jsx injects the HTML fragment, executes its <script> tags     │
│    (which call /static/js/demos/plot.js, physkit.js, jsxgraphcore.js, etc.), │
│    and runs MathJax (typeset()) to render $...$ formulas.                    │
│  • On practice & mock papers, practice.js attaches interactive answer boxes, │
│    multiple-choice buttons, and "I got it / Review later" progress buttons.  │
│  • Shared CSS in src/styles/note-blocks.css and practice.css styles every    │
│    block (CONCEPT, FORMULA, TRY IT, EXAMPLE...) automatically.               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Following one note from `content/` to the screen

```
content/notes/<course>/<topic>/<nn-name>.html   ← 1. You write the note file (an HTML fragment)
        │
flask import-content                            ← 2. backend/importer.py reads each file and its
        │                                            title into the PostgreSQL `notes` table
utils/content_loader.py                         ← 3. Reads the notes list and HTML from the database
        │
api/content.py (/api/notes/<path>)              ← 4. backend/services/notes.py loads the note, works
        │                                            out where it sits (Math C › Plane Vectors · 17 of 17)
        │                                            and the previous/next notes, and returns JSON
frontend/src/pages/Note.jsx                     ← 5. React, at /notes/<path>: draws the floating bar,
        │                                            Topics sidebar, purple header, and prev/next cards
components/NoteContent.jsx                      ← 6. Puts the note's HTML on the page, runs its demo
                                                     <script>, and calls MathJax to draw the formulas
```

- **`backend/importer.py`** walks `content/notes/` and turns each file path into a URL path, for example `math-c/01-plane-vectors/17-line-perpendicular-to-a-vector`. The paths are sorted and the order is saved with each row, so the two-digit number at the start of each folder and file name sets the order of the previous/next buttons.
- **The note's title** comes from `<h1 class="note-title">`, not from the filename. The importer saves it in the database for the sidebar, header, and search box (and the note's own `<h1>` is hidden by CSS so the title isn't shown twice).
- **Course and topic folders** (for example `math-c` / `01-plane-vectors`) become the Course and Topic dropdowns in the Topics sidebar, using display names from `backend/utils/courses.py`.
- **Practice sets link to notes** automatically: when a problem in `content/practice/` includes `<p class="related">Uses: <a href="/notes/...">...</a></p>`, `backend/services/notes.py` finds that link and displays a **"Practise this note"** card at the bottom of the note page.

---

## 2. Folders and file names (`content/`)

```
content/
├── notes/<course>/<topic>/<nn-name>.html            the notes
├── practice/<course>/<topic>/<nn-name>.html         practice sets (same course and topic folders as notes/)
├── past/<category>/[<group>/[<section>/]]<nn>.html  mock question papers (eju/course-1/, jlpt/n1/vocab/, jlpt/n2/listening/, university/)
└── dictionary.json                                  curated 3-way vocabulary (English, Burmese, Japanese)
```

- Every folder and file name is **lowercase words joined by hyphens**, starting with a two-digit number that sets the order: `content/notes/math-1/03-quadratic-functions/05-quadratic-formula.html`.
- **Courses currently in the project**:
  - **Mathematics**: `math-1` (Math I), `math-2` (Math II), `math-3` (Math III), `math-a` (Math A), `math-b` (Math B), `math-c` (Math C)
  - **Physics**: `mechanics-basic` (Mechanics Basic), `heat` (Heat), `waves` (Waves), `electricity` (Electricity), `magnetism` (Magnetism), `atomic-physics` (Atomic Physics)
  - **Grade 12 Myanmar**: `g12-math` (Mathematics MM), `g12-physics` (Physics MM)
  - Topics inside each course are numbered in textbook order.
- Keep filenames short and plain ASCII: write `x2` for x², `minus`, `over`, `theta`, `alpha` for symbols. The page title in the file's `<h1>` can use any characters (`²`, `θ`, Burmese, Japanese, etc.).
- The path without `content/<kind>/` and `.html` is the page's URL: `/notes/math-1/03-quadratic-functions/05-quadratic-formula`.
- Display names live in **`backend/utils/courses.py`**: `math-1` → "Math I", `g12-physics` → "Physics MM", mock categories → their names and descriptions. Topic names are made automatically from the folder name (`03-quadratic-functions` → "Quadratic Functions"); add an entry to `TOPIC_NAMES` in `backend/utils/courses.py` only if automatic title-casing gives the wrong name.

---

## 3. Writing Notes (`content/notes/`)

### Inside a note file

Using `content/notes/math-c/01-plane-vectors/17-line-perpendicular-to-a-vector.html` as the example:

| Lines | Part | Purpose |
|---|---|---|
| 1 | `<!-- tags: Vector -->` | Topic tag |
| 2–7 | Header comment | Topic name in English and Japanese/Burmese, plus which shared files the note uses |
| 8 | `<article class="note-page">` | Wraps the note so the shared CSS applies to it |
| 10 | `<h1 class="note-title" data-topic="Vector">` | Title, read for the header, sidebar and search (hidden inside the note itself) |
| 13–110 | The 8 blocks | See below |
| 114–115 | `<script src=...>` | Loads any extra drawing helpers not already in `frontend/index.html` |
| 116–146 | Demo script | Draws the interactive TRY IT demo |

### The 8 blocks, always in this order

| Block | Class | Label shown | What it contains |
|---|---|---|---|
| 1 | `note-concept` | CONCEPT | The idea in plain words, with the Japanese or Burmese term in brackets |
| 2 | `note-formula` | FORMULA | `.formula-main` holds the big formula; `.symbols` holds a short note under it |
| 3 | `note-proof` | WHY IT WORKS | A short numbered proof or derivation |
| 4 | `note-demo` | TRY IT | A `<canvas>` (or JSXGraph box), any sliders (`.controls`) and a readout box (`.output`) |
| 5 | `note-example` ×3–5 | EXAMPLE | A `.question`, then `<details>` holding the steps (`.note-steps`) and the `.answer` |
| 6 | `note-warning` | WATCH OUT | A common mistake |
| 7 | `note-tip` | TIP | A shortcut or hint |
| 8 | `note-takeaways` | REMEMBER | 3 bullet points |

Notes don't contain a `<style>` block. The labels, colours and card shapes all come from `frontend/src/styles/note-blocks.css`, where each class gets its own accent colour and its label through `::before`. To change how every note looks, edit that one file in `frontend/`.

### Content rules

- Stay within the course's curriculum. For example, the Japanese high-school vector notes don't use the cross product, tan⁻¹ / cos⁻¹, or vectors in more than 3 dimensions; angles are found from cos θ and sin θ.
- Write maths between `$...$` (inline) or `$$...$$` (displayed). Write `<` and `>` inside maths as `&lt;` and `&gt;` so the browser doesn't mistake them for HTML tags.

### Adding a new note

1. Copy an existing note from the same folder.
2. Rename it with the next two-digit number, for example `18-something.html`.
3. Change the tag, the title and the 8 blocks.
4. Give the demo a new unique id prefix and rewrite its drawing function.
5. Run the importer from `backend/`:

```bash
cd backend && ../venv/bin/flask import-content
```

Refresh the browser; you don't need to register the note anywhere else.

---

## 4. Interactive TRY IT Demos and Shared Helpers

### Shape of a demo script

Every demo script in a note is wrapped in an immediately-invoked function `(function () { ... })();` so variable names never clash when a student clicks from one note to another in React:

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
- **Sliders** call `plot.redraw` (or update the board) when they change, for example `tBox.addEventListener('input', plot.redraw);`.
- **Readouts** wrap negative numbers in brackets (`2×(−1)`, not `2×-1`); several notes have a small `par` helper for this.
- **Never wait for `DOMContentLoaded`**: React inserts the note's HTML first and then runs its `<script>` tags (`frontend/src/components/NoteContent.jsx`), so the canvas and controls are already in the DOM when the script runs.

### Shared helper files

The demo helpers live in `frontend/public/static/js/demos/` (and `frontend/public/static/css/`). Each helper file begins with a comment listing its functions and options—read that header comment first when writing a new demo.

| File | Used by | What it gives a note |
|---|---|---|
| `/static/js/demos/geom.js` | Geometry notes | `NoteGeom.board()`: draggable points in pixel coordinates, plus maths helpers (`dist`, `mid`, `angle`…) |
| `/static/js/demos/plot.js` | Graph and vector notes (built on `demos/geom.js`) | `NotePlot.graph()`: maths coordinates with y pointing up, automatic axes and grid, and drawing tools like `g.fn`, `g.seg`, `g.line`, `g.poly`, `g.region`. The `plain: true` option hides the axes and grid, for 3D drawings |
| `/static/js/demos/venn.js` | Set notes | `NoteVenn`: parses and formats sets and draws Venn diagrams |
| `/static/js/demos/physkit.js` | Grade 12 Physics (`g12-physics`) notes | `PhysKit`: canvas board, slider controls, arrows, vectors, springs, waves, rays, circuits, gauges and readout helpers for physics simulations |
| `/static/js/demos/jsxgraphcore.js`, `/static/css/jsxgraph.css` | Physics and geometry notes using JSXGraph | `JXG.JSXGraph.initBoard()`: interactive coordinate boards, curves and sliders (automatically cleaned up on unmount in `NoteContent.jsx`) |
| `frontend/src/styles/note-blocks.css`, `dark-mode.css` | Every note | All 8 block styles (`note-concept`, `note-formula`, `note-demo`, etc.) with light and dark mode adaptations |

`geom.js`, `plot.js`, `physkit.js` and `jsxgraphcore.js` are already loaded on every page in `frontend/index.html`. Helpers only needed by a few notes (such as `venn.js`) can be loaded inside the note with `<script src="/static/js/demos/venn.js"></script>`.

---

## 5. Subjects and Courses on the Home Page

The home page (`frontend/src/pages/Home.jsx`) groups the course folders in `content/notes/` into subject tabs. The list of subjects is `SUBJECTS` in `backend/utils/courses.py` (currently **Mathematics**, **Physics**, and **Grade 12 Myanmar**):

- Each course in `COURSES` (`backend/utils/courses.py`) names its display title and subject, for example:
  ```python
  "mechanics-basic": {"name": "Mechanics Basic", "subject": "Physics"},
  "g12-physics":     {"name": "Physics MM",      "subject": "Grade 12 Myanmar"},
  ```
- A course folder not listed in `COURSES` goes under the subject named by its first word (`chemistry-basic` → Chemistry).
- A subject in `SUBJECTS` with no notes yet shows a **Coming soon** tab on the home page. It switches on automatically once a course folder for it has notes and `flask import-content` has been run.
- To give a new course an icon and accent colour on the home page, add an entry to `COURSE_STYLE` in `frontend/src/pages/Home.jsx` (see `docs/backend-guide.md` and `docs/frontend-guide.md`).

---

## 6. Writing Practice Sets (`content/practice/`)

Practice problems with worked solutions are HTML fragments kept in `content/practice/` with the **exact same `<course>/<topic>/` folder names** as `content/notes/`:

```
content/practice/math-c/01-plane-vectors/02-dot-product.html   →   /practice/math-c/01-plane-vectors/02-dot-product
```

- **Sets in a topic:** first the **concept sets**, each covering 3–5 related notes (about 6 problems, from `basic` up to one `exam` question in parts), then the **topic review**, a mix of the whole topic, named `<nn>-topic-review.html`. Every note should be used by at least two problems.
- **Top comment:** a concept set says which notes it covers, as `<!-- Concept set 2 for Plane Vectors: covers notes 07–11. -->` The practice hub (`/practice`) reads this comment (`backend/importer.py`) and shows `"Covers notes 07–11"`, so write it the way a student should read it (`05, 10 and 11` is fine too).
- **A topic needs at least one note**, because the practice set header links back to the topic's notes. Sets in a topic without notes are left off `/practice`.
- **Renaming a set** changes its URL, and saved progress is stored by URL. List the old paths in `data-moved-from` on the `<article>` (separated by `|`); `frontend/src/progress.js` (`moveOldProgress`) moves saved progress to the new path the first time the page opens.

### Practice set HTML template

```html
<!-- Concept set 2 for Plane Vectors: covers notes 07–11. -->
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

- `data-level`: `basic`, `standard`, `challenge` or `exam` (sets the badge text and colour).
- `data-answer` (optional, for numeric problems): the value the answer box checks against. Write it the way a student would type it: `45`, `6`, `2√7`, `5/2`, `√3/2`, `5π/6`, `3e`, `4/e^2`, `π^2/2` (digits, `+ − × ÷ ^ ( )`, `√`, `π` and `e` are understood by `toNumber` in `frontend/src/practice.js`). Typed answers count as correct within 0.01, so `5.29` is accepted for `2√7`. Leave `data-answer` out for problems whose answer isn't one number (proofs, "find all…").
- `data-choice` (optional, for multiple-choice questions such as JLPT mock tests): the 1-based index of the correct option (`1`, `2`, `3`, or `4`), paired with an ordered list of choices `<ol class="choices"><li>...</li></ol>`. `frontend/src/practice.js` transforms each `<li>` into an interactive `.choice-btn` button, handles green (right) / red (wrong) visual feedback, records review status on incorrect attempts, and calculates the live test score.
- The answer box (or multiple-choice buttons) and the **"I got it / Review later"** buttons are added automatically by `frontend/src/practice.js`; don't write them in the HTML file.
- Keep the solution steps short and numbered, like the examples in the notes, and put any extra insight in `<p class="practice-note">` inside the solution.
- **Before merging a new practice set**, open it in the browser and check:
  - every `data-answer` is accepted when typed in,
  - the `"Uses:"` links open the right notes (and the note page shows the set under "Practise this note"),
  - the set appears on `/practice`.

---

## 7. Writing Mock Questions (`content/past/`)

Mock exam questions use the **same HTML format** as practice sets, grouped by exam instead of by topic (kept in `content/past/` and served at `/past`). There are currently three categories:

| Folder | Name on the site | What it holds |
|---|---|---|
| `content/past/eju/course-1/`, `course-2/` | **EJU Mock Papers**, with a Course 1 (Basic) and a Course 2 (Advanced) tab | 10 original mock papers per course, 6 problems each |
| `content/past/jlpt/<level>/<section>/` (`n1`–`n5` / `vocab`, `grammar`, `reading`, `listening`) | **JLPT Mock Tests**, with N1 to N5 level tabs and 4 skill sections per level | 10 mock tests per section across all 5 levels (200 tests total), structured according to official JLPT mondai formats with full listening narration transcripts and live scoring |
| `content/past/university/` | **University Mock Questions** | Longer university-style problems with written solutions |

An exam folder can be split into subfolders, as the EJU and JLPT papers are by course, level, or skill section:

```
content/past/university/01-sample-paper-proof-and-calculus.html   →   /past/university/01-sample-paper-proof-and-calculus
content/past/eju/course-1/03-mock-paper.html                       →   /past/eju/course-1/03-mock-paper
content/past/jlpt/n2/vocab/01-mock-test.html                       →   /past/jlpt/n2/vocab/01-mock-test
content/past/jlpt/n1/listening/05-mock-test.html                   →   /past/jlpt/n1/listening/05-mock-test
```

- **Mock Questions Hub** (`/past`, linked in the floating bar, at the bottom of `/practice`, and from "More to explore" on the home page) shows one card per exam folder in `content/past/`. Clicking a card lists its papers (`/past/<folder>`), and each paper opens like a practice set (`frontend/src/pages/PastPaper.jsx`) with hints, solutions, and answer boxes (or multiple-choice buttons).
- **Subfolders and Level Tabs:**
  - On `/past/eju`, `course-1` and `course-2` become the top tabs (`Course 1 (Basic)` and `Course 2 (Advanced)`).
  - On `/past/jlpt`, `n1`, `n2`, `n3`, `n4`, and `n5` become the level tabs. Under each level tab, tests are categorized into 4 skill section cards:
    - **Vocabulary (文字・語彙)** (`vocab/`)
    - **Grammar (文法)** (`grammar/`)
    - **Reading (読解)** (`reading/`)
    - **Listening (聴解)** (`listening/`)
  - Subfolder and level display names live under `"groups"` and `"sections"` in `PAST_CATEGORIES` in `backend/utils/courses.py`.

### JLPT Mock Tests Structure & Formatting

Each JLPT mock test contains 10–25 authentic exam-style questions following the official JLPT test specifications:

1. **Vocabulary (文字・語彙)**:
   - 問題1: 漢字読み (Kanji reading)
   - 問題2: 表記 (Kanji writing / orthography)
   - 問題3: 語形成 (Word formation, e.g. prefixes/suffixes)
   - 問題4: 文脈規定 (Contextual vocabulary)
   - 問題5: 言い換え類義 (Paraphrasing & synonyms)
   - 問題6: 用法 (Correct word usage in context)

2. **Grammar (文法)**:
   - 問題1: 文法形式の判断 (Sentence grammar 1 — selecting correct grammatical pattern)
   - 問題2: 文の組み立て (Sentence grammar 2 — star `★` arrangement problems)
   - 問題3: 文章の文法 (Text grammar / cohesive discourse)

3. **Reading (読解)**:
   - 内容理解 (短文) (Short passages, ~200 characters)
   - 内容理解 (中文) (Medium passages, ~500 characters)
   - 統合理解 (Integrated / comparative reading across multiple texts)
   - 主張理解 (長文) (Thematic / long passage comprehension)
   - 情報検索 (Information retrieval / notices, flyers, catalogues)

4. **Listening (聴解) & Audio Narration Scripts**:
   - 問題1: 課題理解 (Task-based comprehension)
   - 問題2: ポイント理解 (Key point comprehension)
   - 問題3: 概要理解 (Gist / general comprehension)
   - 問題4: 即時応答 (Quick verbal response)
   - 問題5: 統合理解 (Integrated comprehension)

Every listening test includes an expandable audio transcript formatted for YouTube API or Text-to-Speech (TTS) narration:

```html
<section class="practice-problem" data-level="exam" data-choice="1">
  <h2>Question 1 <span class="exam-label">問題1 · 課題理解</span></h2>
  <div class="listening-situation">
    <p class="sit-jp"><strong>【場面】</strong> 会社で、女性の上司と男性の社員が話しています。男性はまず何をしますか。</p>
    <p class="sit-en"><em>Situation:</em> At a company, a female supervisor and a male employee are talking. What does the man do first?</p>
  </div>
  <details class="transcript">
    <summary>🎧 Show Audio Script / Dialogue (音声スクリプト)</summary>
    <div class="transcript-content">
      <p>女：佐藤くん、明日の資料の日付、修正してある？<br>
      男：すみません、まだ確認していませんでした。<br>
      女：じゃあ、先に印刷した資料の日付をチェックして、違っていたらすぐ刷り直して。<br>
      男：わかりました。すぐに確認します！</p>
    </div>
  </details>
  <p class="question"><strong>質問：</strong>男性の社員は、まず何をしなければなりませんか。</p>
  <ol class="choices">
    <li>配付資料の日付を確認する</li>
    <li>プロジェクターの動作を確認する</li>
    <li>会議室の椅子を並べる</li>
    <li>新しいプレゼン資料を作成する</li>
  </ol>
  <details class="solution">
    <summary>Show explanation</summary>
    <p>Explanation in English with Japanese cues.</p>
    <p class="answer">Answer: 1 · 配付資料の日付を確認する</p>
  </details>
</section>
```

### Live Scoring & Test Score Cards

Mock tests include a complete real-time scoring system:

- **Live Header Score**: As questions are answered, the page header immediately updates (`Score: 8/10 (80%) · 2 to review`).
- **Interactive Choice Buttons**: Selecting a choice immediately checks the answer. An incorrect choice marks the problem for review, preserving genuine exam accuracy.
- **Test Selection Badges**: The test list displays color-coded score pills (`Score: 8/10 (80%)`):
  - Green pill (`.is-done`): Passed ($\ge 60\%$).
  - Amber pill (`.is-review`): Review needed ($< 60\%$).
- **Test Completion Score Card (`<TestScoreCard />`)**:
  - Displays at the bottom of each test with status badges (`🏆 Test Passed · 合格` vs `📖 Review Needed · 要復習`).
  - Breakdown stats: Correct, Review, and Remaining questions.
  - Action buttons: **Retake Test** (wipes saved score and resets DOM choice states), **Jump to First Mistake** (smooth-scrolls to the first incorrect question), and **Next Test**.

---

```html
<h2>Problem 1 <span class="exam-label">I Q1 · Quadratic functions</span></h2>
```

- **EJU mock papers** (10 per course) follow the exam's layout: six problems in the order I Q1, I Q2, II Q1, II Q2, III, IV. Course 1 and Course 2 share the kind of question in Section I (quadratic functions, then counting and probability). After that, Course 1 has numbers and sets, quadratics, integers and figures; Course 2 has sequences, logarithms or trigonometry, vectors or complex numbers, then Math III differentiation and integration.
- **Problems in parts:** list the parts right after the question and number the solution steps the same way. When using a numeric answer box, say which part to type in:

```html
<p class="question">A bag holds 4 red balls and 3 white balls…</p>
<ol class="parts">
  <li>(1) Find the probability that exactly 2 are red.</li>
  <li>(2) Find the expected number of red balls. (Type this one in the box.)</li>
</ol>
```

- **Renaming a paper:** list the old paths in `data-moved-from`, with `past/` in front (`data-moved-from="past/eju/02-practice-paper-course-1"`). Saved progress moves to the new path, and old links redirect to it (`PaperMoved` in `backend/services/past.py`).
- **Copyright note:** Real past papers belong to the exam's publisher (JASSO for the EJU, JEES/Japan Foundation for the JLPT, or the university), so check you may republish a paper before adding it. The EJU and JLPT mock papers in `content/past/` are original problems written in the exam format, not copies of published past papers.

---

## 8. Curated 3-Way Dictionary (`content/dictionary.json`)

Alongside `notes/`, `practice/`, and `past/`, `content/dictionary.json` holds curated trilingual study terms (**English ↔ Burmese ↔ Japanese** with readings, part of speech, notes, and example sentences).

- After editing `content/dictionary.json`, import it into PostgreSQL from `backend/`:
  ```bash
  cd backend && ../venv/bin/flask import-dictionary
  ```
- See **[docs/dictionary-guide.md](dictionary-guide.md)** for the full JSON format, CLI commands (`flask import-dictionary`, `flask list-dictionary`, `flask add-word`), and how the hybrid lookup service works.

---

## 9. Common Content & Demo Problems

| What you see | What it means | Fix |
|---|---|---|
| "Sorry, this note doesn't exist" for a new file | The file isn't in the database yet | Run `cd backend && ../venv/bin/flask import-content` |
| A change in a note, set, or mock paper doesn't show | The site reads PostgreSQL, not the raw HTML files | Run `cd backend && ../venv/bin/flask import-content`, then refresh |
| A change in `content/dictionary.json` doesn't show | The dictionary table hasn't been synced | Run `cd backend && ../venv/bin/flask import-dictionary` |
| Formulas show as raw `$x^2$` | MathJax didn't run on that element, or `<` / `>` inside `$...$` broke the HTML parser, or `$` is inside an HTML attribute | Write `&lt;` and `&gt;` inside maths, and check F12 → Console for `MathJax:` errors |
| A TRY IT demo stays blank | Its `<script>` threw an error | Open F12 → Console to see the error and line number; check that canvas/slider IDs in the script match the HTML |
| A practice set doesn't appear on `/practice` | Its `<course>/<topic>` folder has no notes in `content/notes/`, or `flask import-content` wasn't run | Ensure the topic has at least one note and run `flask import-content` |

### Hands-on exercises for Content & Demos

1. **Level 1 (HTML & Content)**: Edit a sentence in an existing note under `content/notes/`, run `cd backend && ../venv/bin/flask import-content`, and refresh the note in the browser.
2. **Level 2 (JavaScript & Demos)**: Open a note's demo script alongside Section 4 above. Change a curve colour or slider range, or add `console.log(P)` inside `draw(g, P)` and watch F12 → Console while dragging a point.
