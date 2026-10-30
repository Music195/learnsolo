# How the notes are structured

A note file is not a full web page. It is a fragment of HTML that Flask reads from disk and inserts into one shared page template. Every note uses the same structure, so they all look the same and are written the same way.

## 1. How a note reaches the screen

```
notes/<Course>/<Topic>/NN._Title.html          ← the note file (an HTML fragment)
        │
utils/note_loader.py   finds every .html under notes/, reads each note's title
        │
routes/notes.py        /note/<path> → loads the file, works out previous/next notes
        │
templates/note.html    the shared page: sidebar, ◀ ▶ buttons, font-size buttons,
                       MathJax, and the shared CSS
        │
<div class="note-content">{{ content|safe }}</div>   ← the note is inserted here
```

- **`utils/note_loader.py`** walks `notes/` and turns each file path into a URL path, for example `Mathematics C/Vector/17._Line_Perpendicular_To_a_Vector`. The list is sorted, so the `NN.` number at the start of each filename sets the order of the ◀ ▶ buttons. The list is cached and rebuilt when the folder changes.
- **The note's title** comes from `<h1 class="note-title">`, not from the filename. The loader reads it for the sidebar and search, and the route reads it for the page heading. So the title can differ from the filename (for example, Vector note 06's filename has the typo "Mangnitude" but its title is spelled correctly).
- **Course and topic folders** (for example `Mathematics C` / `Vector`) become the two filter dropdowns in the sidebar.
- **`templates/note.html`** loads MathJax with `$...$` as the maths delimiter, and loads `static/css/note_blocks.css` for the shared note design.

## 2. Inside a note file

Using `notes/Mathematics C/Vector/17._Line_Perpendicular_To_a_Vector.html` as the example:

| Lines | Part | Purpose |
|---|---|---|
| 1 | `<!-- tags: Vector -->` | Topic tag |
| 2–7 | Header comment | Topic name in English and Japanese, plus which shared files the note uses |
| 8 | `<article class="note-page">` | Wraps the note so the shared CSS applies to it |
| 10 | `<h1 class="note-title" data-topic="Vector">` | Title; the CSS shows "VECTOR" in small letters above it |
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

Each helper file begins with a comment listing its functions and their options, so read that first when writing a new demo.

## 5. Adding a new note

1. Copy an existing note from the same folder.
2. Rename it with the next number, for example `18._Something.html`.
3. Change the tag, the title and the 8 blocks.
4. Give the demo a new id prefix and rewrite its `draw()` function.

The app finds the new file on its own; you don't need to register it anywhere.
