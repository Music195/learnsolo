# How the notes are structured

A note file is not a full web page. It is a fragment of HTML that Flask reads from disk and inserts into one shared page template. Every note uses the same structure, so they all look the same and are written the same way.

## 1. How a note reaches the screen

```
notes/<Course>/<Topic>/NN._Title.html          ← the note file (an HTML fragment)
        │
utils/note_loader.py   finds every .html under notes/, reads each note's title
        │
routes/notes.py        /note/<path> → loads the file, works out where it sits
                       (Math C › Vector · 17 of 17) and the previous/next notes
        │
templates/note.html    the shared page: floating bar, Topics sidebar, purple header
                       with the title, previous/next cards, MathJax, the shared CSS
        │
<main class="note-content">{{ content|safe }}</main>   ← the note is inserted here
```

- **`utils/note_loader.py`** walks `notes/` and turns each file path into a URL path, for example `Mathematics C/Vector/17._Line_Perpendicular_To_a_Vector`. The list is sorted, so the `NN.` number at the start of each filename sets the order of the previous/next buttons. The list is cached and rebuilt when the folder changes.
- **The note's title** comes from `<h1 class="note-title">`, not from the filename. The loader reads it for the sidebar and search, and the route shows it in the purple header (the note's own `<h1>` is hidden by the CSS, so the title isn't shown twice). So the title can differ from the filename (for example, Vector note 06's filename has the typo "Mangnitude" but its title is spelled correctly).
- **Course and topic folders** (for example `Mathematics C` / `Vector`) become the Course and Topic dropdowns in the Topics sidebar.
- **`templates/note.html`** loads MathJax with `$...$` as the maths delimiter, and loads `static/css/note_blocks.css` for the shared note design.

## 2. Inside a note file

Using `notes/Mathematics C/Vector/17._Line_Perpendicular_To_a_Vector.html` as the example:

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

Notes don't contain a `<style>` block. The labels, colours and card shapes all come from `static/css/note_blocks.css`, where each class gets its own accent colour and its label through `::before`. To change how every note looks, edit that one file.

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
| `static/js/note_geom.js` | Geometry notes | `NoteGeom.board()`: draggable points in pixel coordinates, plus maths helpers (`dist`, `mid`, `angle`…) |
| `static/js/note_plot.js` | Graph and vector notes (built on `note_geom.js`, so load both) | `NotePlot.graph()`: maths coordinates with y pointing up, automatic axes and grid, and drawing tools like `g.fn`, `g.seg`, `g.line`, `g.poly`, `g.region`. The `plain: true` option hides the axes and grid, for the 3D drawings |
| `static/js/note_venn.js` | Set notes | `NoteVenn`: parses and formats sets and draws Venn diagrams |
| `static/css/note_blocks.css` | Every note | All the block styles |

The page around the note, which notes don't need to touch:

| File | What it does |
|---|---|
| `templates/_floatbar.html`, `static/css/floatbar.css`, `static/js/floatbar.js` | The floating bar shared by the home and note pages: logo, where you are, search (loads `/search-index.json`), text size, previous/next, Topics |
| `static/css/note_tpl_style.css` | Note page layout: background, header, the card (920px wide), sidebar, previous/next cards |
| `static/js/note_tpl.js` | Topics sidebar, A−/A+ text size (saved), ← / → keys for previous/next (not while a slider or text box has focus) |

Each helper file begins with a comment listing its functions and their options, so read that first when writing a new demo.

## 5. Subjects on the home page

The home page (`templates/index.html`, scripts in `static/js/home.js`) groups the course folders into subject tabs. The list of subjects is `SUBJECTS` in `routes/notes.py`:

- A course folder belongs to the subject its name **starts with**: `Mathematics 1` → Mathematics, `Physics Basic` → Physics.
- A subject with no notes yet shows a **Coming soon** tab. It switches on by itself once a folder for it has notes.
- A folder that matches no subject in the list gets its own tab, named after the folder's first word (for example `Chemistry Basic` → Chemistry). Add it to `SUBJECTS` to choose its icon and tab order.
- `COURSE_NAMES` and `TOPIC_NAMES` only change the names shown on the home page and in search (for example `Mathematics 1` → "Math I"). Folders are never renamed.

To start Physics, add notes like `notes/Physics Basic/Motion/01._Velocity.html`, using the same 8-block layout as the maths notes.

## 6. Adding a new note

1. Copy an existing note from the same folder.
2. Rename it with the next number, for example `18._Something.html`.
3. Change the tag, the title and the 8 blocks.
4. Give the demo a new id prefix and rewrite its `draw()` function.

The app finds the new file on its own; you don't need to register it anywhere.

## 7. Practice sets

Practice problems with worked solutions are HTML pages too, kept in their own folder with the same Course/Topic layout as the notes:

```
practice/Mathematics C/Vector/01._Dot_Product_and_Angles.html   →   /practice/Mathematics C/Vector/01._Dot_Product_and_Angles
```

- The page (`templates/practice.html`) has the same floating bar, header and card as a note. The header shows "Solved 2 of 5"; progress is saved on the student's device.
- Every note in the same topic shows a **Practice this topic** card after the note, and the search box finds practice sets too.
- Styles: `static/css/practice.css`. Script: `static/js/practice.js`. Loader: `utils/practice_loader.py`. Route: `/practice/...` in `routes/problems.py`.
- A topic needs at least one note, because the header links back to the topic's notes.

A practice file is a fragment like a note:

```html
<article class="note-page practice-page">
  <h1 class="practice-title">Dot Product and Angles</h1>
  <p class="practice-intro">What this set practises.</p>

  <section class="practice-problem" data-level="basic" data-answer="45" data-placeholder="angle in degrees">
    <h2>Problem 1</h2>
    <p class="question">The question, with maths in $...$.</p>
    <p class="related">Uses: <a href="/note/...">The note it practises</a></p>
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
past/EJU Past Questions/01._Sample_Paper_Math_Course_2.html   →   /past/EJU Past Questions/01._Sample_Paper_Math_Course_2
```

- **Past questions** (`/note/kind_of_problem`, the "Practice problems" link on the home page) shows one card per folder in `past/`. Clicking a card lists its papers (`/note/kind_of_problem/<folder>`), and each paper opens in `templates/practice.html` with hints, solutions and answer boxes. The search box finds papers too.
- **New exam:** make a new folder in `past/`. Give it an icon and a one-line description in `CATEGORY_INFO` in `routes/problems.py` (without one it gets a generic description).
- **New paper:** add an HTML file to the folder. Number files `01._`, `02._`, … to set the order. Use `data-level="exam"` for each problem.
- **Problems in parts:** list the parts right after the question and number the solution steps the same way. The answer box checks one number, so say which part to type in:

```html
<p class="question">A bag holds 4 red balls and 3 white balls…</p>
<ol class="parts">
  <li>(1) Find the probability that exactly 2 are red.</li>
  <li>(2) Find the expected number of red balls. (Type this one in the box.)</li>
</ol>
```

- Real past papers belong to the exam's publisher (JASSO for the EJU, or the university), so check you may republish a paper before adding it.
- Styles: `static/css/past_tpl_style.css` (the list pages) and `static/css/practice.css` (the paper itself).
