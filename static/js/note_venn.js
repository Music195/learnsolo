/* =====================================================================
   note_venn.js — shared Venn diagram helper for the set notes
   ---------------------------------------------------------------------
   Used by the TRY IT demos in notes/Mathematics A/Union and Elements.
   A note loads it with:
       <script src="/static/js/note_venn.js"></script>

   Main functions:
     NoteVenn.parse("1, 2, 2, 3")      -> ["1", "2", "3"]  (duplicates removed)
     NoteVenn.format(["3", "1"])       -> "{1, 3}"         (sorted, set braces)
     NoteVenn.union / intersect / minus / isSubset   set operations on arrays
     NoteVenn.draw(canvas, options)    draws the diagram (see below)

   draw() options:
     U      : universal set (array). Elements of A and B are added if missing.
     A, B   : the sets (B can be left out for a one-set diagram)
     layout : "overlap" (A and B cross), "subset" (A drawn inside B),
              or "single" (only A). Default: "overlap", or "single" without B.
     shade  : function (inA, inB) -> true/false. Regions where it returns
              true are coloured. E.g. union: (a, b) => a || b
     counts : instead of listing elements, write one number per region:
              { onlyA, both, onlyB, neither }  (for counting problems)
   ===================================================================== */
(function () {
  // ---------- Set helpers (sets are arrays of strings) ----------

  // Turn "1, 2, 2, 3" into ["1", "2", "3"]: split on commas, trim, drop blanks and repeats
  function parse(text) {
    const items = text.split(',').map((s) => s.trim()).filter((s) => s !== '');
    return [...new Set(items)];
  }

  // Sort numbers numerically and everything else alphabetically
  function sortItems(items) {
    return [...items].sort((x, y) => {
      const nx = Number(x), ny = Number(y);
      if (!isNaN(nx) && !isNaN(ny)) return nx - ny;
      return x.localeCompare(y);
    });
  }

  // Show a set the way it is written in maths: {1, 2, 3} or ∅
  function format(items) {
    return items.length === 0 ? '∅' : '{' + sortItems(items).join(', ') + '}';
  }

  const union = (A, B) => [...new Set([...A, ...B])];
  const intersect = (A, B) => A.filter((x) => B.includes(x));
  const minus = (A, B) => A.filter((x) => !B.includes(x));
  const isSubset = (A, B) => A.every((x) => B.includes(x));

  // ---------- Drawing ----------

  // Fixed drawing size; CSS scales the canvas down on small screens
  const WIDTH = 520;
  const HEIGHT = 320;
  const RECT = { x: 10, y: 10, w: 500, h: 300 }; // the universal set U

  // Circle positions for each layout
  const LAYOUTS = {
    overlap: { A: { x: 205, y: 165, r: 105 }, B: { x: 315, y: 165, r: 105 } },
    subset:  { A: { x: 255, y: 165, r: 62 },  B: { x: 290, y: 165, r: 130 } },
    single:  { A: { x: 260, y: 165, r: 110 } },
  };

  const COLORS = {
    A: '#2563eb',             // blue outline for A
    B: '#7c3aed',             // purple outline for B
    U: '#475569',             // grey outline for U
    shade: 'rgba(249, 115, 22, 0.35)', // orange fill for the highlighted region
  };

  const inside = (p, c, margin = 0) => Math.hypot(p.x - c.x, p.y - c.y) < c.r - margin;
  const outside = (p, c, margin = 0) => Math.hypot(p.x - c.x, p.y - c.y) > c.r + margin;

  // Restrict drawing to the inside (want = true) or outside (want = false) of a circle
  function clipCircle(ctx, c, want) {
    ctx.beginPath();
    if (!want) ctx.rect(RECT.x, RECT.y, RECT.w, RECT.h); // rectangle minus circle (even-odd rule)
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.clip(want ? 'nonzero' : 'evenodd');
  }

  // Colour the regions chosen by shade(inA, inB)
  function drawShading(ctx, circles, shade) {
    const hasB = Boolean(circles.B);
    for (const inA of [true, false]) {
      for (const inB of hasB ? [true, false] : [false]) {
        if (!shade(inA, inB)) continue;
        ctx.save();
        clipCircle(ctx, circles.A, inA);
        if (hasB) clipCircle(ctx, circles.B, inB);
        ctx.fillStyle = COLORS.shade;
        ctx.fillRect(RECT.x, RECT.y, RECT.w, RECT.h);
        ctx.restore();
      }
    }
  }

  // Candidate spots for element labels: a grid of points that sit clearly inside
  // one region (at least 16px away from every circle edge)
  function candidateSpots(circles) {
    const spots = [];
    for (let y = RECT.y + 28; y <= RECT.y + RECT.h - 18; y += 30) {
      for (let x = RECT.x + 24; x <= RECT.x + RECT.w - 20; x += 32) {
        const p = { x, y };
        const ok = Object.values(circles).every((c) => inside(p, c, 16) || outside(p, c, 16));
        if (ok) spots.push(p);
      }
    }
    return spots;
  }

  // Place each element in a free spot of its own region, nearest the region's middle
  function placeElements(items, circles, test, anchor, spots, used) {
    const free = spots
      .filter((p) => !used.has(p) && test(p))
      .sort((p, q) => Math.hypot(p.x - anchor.x, p.y - anchor.y) - Math.hypot(q.x - anchor.x, q.y - anchor.y));
    // Take the closest spots, then fill them in reading order (top-to-bottom, left-to-right)
    const chosen = free.slice(0, items.length).sort((p, q) => p.y - q.y || p.x - q.x);
    chosen.forEach((p) => used.add(p));
    // If a region is too full, the extra elements are left out of the picture
    return sortItems(items).slice(0, chosen.length).map((label, i) => ({ label, ...chosen[i] }));
  }

  // Draw one element as a small white bubble with its name
  function drawElement(ctx, el) {
    ctx.font = '14px sans-serif';
    const w = Math.max(24, ctx.measureText(el.label).width + 12);
    ctx.beginPath();
    ctx.roundRect(el.x - w / 2, el.y - 12, w, 24, 12);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.label, el.x, el.y + 1);
  }

  function draw(canvas, options) {
    const A = options.A || [];
    const B = options.B || null;
    const layoutName = options.layout || (B ? 'overlap' : 'single');
    const circles = LAYOUTS[layoutName];
    const shade = options.shade || (() => false);
    const U = union(options.U || [], union(A, B || []));

    // Sharp drawing on high-resolution screens
    const ratio = window.devicePixelRatio || 1;
    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;
    canvas.style.width = WIDTH + 'px'; // CSS max-width shrinks it on phones
    canvas.style.aspectRatio = `${WIDTH} / ${HEIGHT}`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // 1. Highlighted region underneath everything else
    drawShading(ctx, circles, shade);

    // 2. Outlines and labels for U, A, B
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = COLORS.U;
    ctx.strokeRect(RECT.x, RECT.y, RECT.w, RECT.h);
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = COLORS.U;
    ctx.fillText('U', RECT.x + 8, RECT.y + 6);
    for (const name of B ? ['A', 'B'] : ['A']) {
      const c = circles[name];
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS[name];
      ctx.stroke();
      ctx.fillStyle = COLORS[name];
      // A's label sits top-left of its circle, B's top-right
      const angle = name === 'A' ? -2.3 : -0.84;
      ctx.fillText(name, c.x + (c.r + 6) * Math.cos(angle) - 6, c.y + (c.r + 6) * Math.sin(angle) - 18);
    }

    // 3a. Counting mode: one big number in the middle of each region
    if (options.counts) {
      const c = options.counts;
      const cA = circles.A, cB = circles.B;
      const spotsForCounts = [
        [c.onlyA, cA.x - cA.r / 2, cA.y],
        [c.both, (cA.x + cB.x) / 2, cA.y],
        [c.onlyB, cB.x + cB.r / 2, cB.y],
        [c.neither, RECT.x + 40, RECT.y + RECT.h - 30],
      ];
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0f172a';
      for (const [value, x, y] of spotsForCounts) {
        if (value !== undefined) ctx.fillText(String(value), x, y);
      }
      return;
    }

    // 3b. Elements, each in the region it belongs to
    const spots = candidateSpots(circles);
    const used = new Set();
    const cA = circles.A, cB = circles.B;
    const regions = B ? [
      { items: intersect(A, B), test: (p) => inside(p, cA) && inside(p, cB), anchor: layoutName === 'subset' ? cA : { x: (cA.x + cB.x) / 2, y: cA.y } },
      { items: minus(A, B), test: (p) => inside(p, cA) && !inside(p, cB), anchor: { x: cA.x - cA.r / 2, y: cA.y } },
      { items: minus(B, A), test: (p) => !inside(p, cA) && inside(p, cB), anchor: { x: cB.x + cB.r / 2, y: cB.y } },
      { items: minus(U, union(A, B)), test: (p) => !inside(p, cA) && !inside(p, cB), anchor: { x: RECT.x, y: RECT.y + RECT.h } },
    ] : [
      { items: A, test: (p) => inside(p, cA), anchor: cA },
      { items: minus(U, A), test: (p) => !inside(p, cA), anchor: { x: RECT.x, y: RECT.y + RECT.h } },
    ];
    for (const region of regions) {
      placeElements(region.items, circles, region.test, region.anchor, spots, used)
        .forEach((el) => drawElement(ctx, el));
    }
  }

  window.NoteVenn = { parse, format, union, intersect, minus, isSubset, draw };
})();
