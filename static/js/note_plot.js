/* =====================================================================
   note_plot.js — shared helper for function-graph demos
   ---------------------------------------------------------------------
   Built on note_geom.js, so a note loads both:
       <script src="/static/js/note_geom.js"></script>
       <script src="/static/js/note_plot.js"></script>

   Main function:
     NotePlot.graph(canvas, {
       x: [-5, 5], y: [-4, 6],                   // visible ranges (maths units)
       points: { P: [1, 2] },                    // optional draggable points (maths units)
       constrain: { P: ([x, y]) => [x, x * x] }, // optional: move a dragged point, e.g. onto a curve
       draw: function (g, P) { ... },            // draws the figure; P.P is [x, y] in maths units
     })
     -> { redraw(), points, move(name, [x, y]) }   move() puts a draggable point somewhere new

   Axes, grid and tick numbers are drawn automatically.

   Inside draw(), g works in maths coordinates (y up):
     g.fn(f, color, opts)            graph of y = f(x)          opts: { width, dash, from, to }
     g.seg(p, q, color, opts)        segment                    opts: { dash: true, width: 2 }
     g.dot(p, color, name)           small labelled point
     g.hollow(p, color)              open circle (end point not included)
     g.text(p, text, color)          text centred at p
     g.vline(x, color, opts)         vertical line x = const
     g.hline(y, color, opts)         horizontal line y = const
     g.band(x1, x2, color)           highlight the x-axis from x1 to x2 (an interval on the number line)
     g.fill(f, x1, x2, color)        shade between y = f(x) and the x-axis for x1 ≤ x ≤ x2
     g.circle(c, r, color, opts)     circle with centre c, radius r  opts: { width, dash }
     g.line(a, b, c, color, opts)    the whole line ax + by + c = 0 (vertical lines too)
     g.region(test, color)           shade every point where test(x, y) is true

   For round circles, make the x-range about 1.55 times the y-range, e.g.
   x: [-7.75, 7.75], y: [-5, 5].

   Also: NotePlot.poly([a, b, c]) → "x² − 2x + 3" style text (highest power first,
   zero terms dropped, 1s hidden). Optional second argument: the letter.
   ===================================================================== */
(function () {
  const W = 520, H = 340, PAD = 6;

  // A "nice" tick step (1, 2 or 5 times a power of 10) giving about 8–12 ticks
  function tickStep(span) {
    const raw = span / 10, p = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 5, 10].map((k) => k * p).find((s) => s >= raw);
  }

  function graph(canvas, options) {
    const [x0, x1] = options.x, [y0, y1] = options.y;
    // maths → pixels and back
    const toPx = ([x, y]) => [PAD + (x - x0) / (x1 - x0) * (W - 2 * PAD), PAD + (y1 - y) / (y1 - y0) * (H - 2 * PAD)];
    const toMath = ([px, py]) => [x0 + (px - PAD) / (W - 2 * PAD) * (x1 - x0), y1 - (py - PAD) / (H - 2 * PAD) * (y1 - y0)];

    const startPx = {};
    Object.entries(options.points || {}).forEach(([k, v]) => (startPx[k] = toPx(v)));
    const constrainPx = {};
    Object.entries(options.constrain || {}).forEach(([k, f]) => (constrainPx[k] = (p) => toPx(f(toMath(p)))));

    let mathPoints = {};
    const board = window.NoteGeom.board(canvas, {
      points: startPx,
      constrain: constrainPx,
      draw(pg, P) {
        mathPoints = {};
        // round away pixel → maths float noise (2.9999999999999996 → 3)
        Object.entries(P).forEach(([k, v]) => (mathPoints[k] = toMath(v).map((c) => +c.toFixed(9))));
        drawAxes(pg);
        options.draw(mathPainter(pg), mathPoints);
      },
    });

    function drawAxes(pg) {
      const sx = tickStep(x1 - x0), sy = tickStep(y1 - y0);
      for (let x = Math.ceil(x0 / sx) * sx; x <= x1; x += sx) pg.seg(toPx([x, y0]), toPx([x, y1]), '#f1f5f9', { width: 1 });
      for (let y = Math.ceil(y0 / sy) * sy; y <= y1; y += sy) pg.seg(toPx([x0, y]), toPx([x1, y]), '#f1f5f9', { width: 1 });
      const ax = Math.min(Math.max(0, y0), y1), ay = Math.min(Math.max(0, x0), x1); // where the axes sit
      pg.seg(toPx([x0, ax]), toPx([x1, ax]), '#64748b', { width: 1.5 });
      pg.seg(toPx([ay, y0]), toPx([ay, y1]), '#64748b', { width: 1.5 });
      for (let x = Math.ceil(x0 / sx) * sx; x <= x1; x += sx) {
        if (Math.abs(x) < sx / 2) continue;
        const p = toPx([x, ax]);
        pg.text([p[0], p[1] + 12], String(+x.toFixed(6)), '#94a3b8');
      }
      for (let y = Math.ceil(y0 / sy) * sy; y <= y1; y += sy) {
        if (Math.abs(y) < sy / 2) continue;
        const p = toPx([ay, y]);
        pg.text([p[0] - 12, p[1]], String(+y.toFixed(6)), '#94a3b8');
      }
      const o = toPx([ay, ax]);
      pg.text([o[0] - 9, o[1] + 11], 'O', '#94a3b8');
    }

    // Drawing helpers in maths coordinates, built on the pixel painter
    function mathPainter(pg) {
      const g = {
        fn(f, color = '#2563eb', opts = {}) {
          const a = opts.from ?? x0, b = opts.to ?? x1, n = 400;
          let prev = null;
          for (let i = 0; i <= n; i++) {
            const x = a + (b - a) * i / n, y = f(x);
            const cur = Number.isFinite(y) && y > y0 - (y1 - y0) && y < y1 + (y1 - y0) ? toPx([x, y]) : null;
            if (prev && cur) pg.seg(prev, cur, color, { width: opts.width || 3, dash: opts.dash });
            prev = cur;
          }
        },
        seg: (p, q, color, opts) => pg.seg(toPx(p), toPx(q), color, opts),
        dot: (p, color, name) => pg.dot(toPx(p), color, name),
        hollow: (p, color = '#0d9488') => pg.circle(toPx(p), 5, color, { fill: 'white' }),
        text: (p, text, color) => pg.text(toPx(p), text, color),
        vline: (x, color = '#94a3b8', opts = { dash: true }) => pg.seg(toPx([x, y0]), toPx([x, y1]), color, opts),
        hline: (y, color = '#94a3b8', opts = { dash: true }) => pg.seg(toPx([x0, y]), toPx([x1, y]), color, opts),
        band(a, b, color = '#0d9488') {
          const ax = Math.min(Math.max(0, y0), y1);
          pg.seg(toPx([Math.max(a, x0), ax]), toPx([Math.min(b, x1), ax]), color, { width: 6 });
        },
        fill(f, a, b, color = 'rgba(37, 99, 235, 0.15)') {
          const pts = [toPx([a, 0])];
          for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200; pts.push(toPx([x, f(x)])); }
          pts.push(toPx([b, 0]));
          pg.poly(pts, color);
        },
        circle(c, r, color = '#2563eb', opts = {}) {
          let prev = toPx([c[0] + r, c[1]]);
          for (let i = 1; i <= 120; i++) {
            const t = i * Math.PI / 60, cur = toPx([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]);
            pg.seg(prev, cur, color, { width: opts.width || 3, dash: opts.dash });
            prev = cur;
          }
        },
        line(a, b, c, color = '#2563eb', opts = {}) {
          const o = { width: opts.width || 3, dash: opts.dash };
          if (Math.abs(b) > 1e-9) pg.seg(toPx([x0, -(a * x0 + c) / b]), toPx([x1, -(a * x1 + c) / b]), color, o);
          else if (Math.abs(a) > 1e-9) pg.seg(toPx([-c / a, y0]), toPx([-c / a, y1]), color, o);
        },
        region(test, color = 'rgba(37, 99, 235, 0.15)') {
          const s = 4; // cell size in pixels
          for (let px = PAD; px < W - PAD; px += s) {
            for (let py = PAD; py < H - PAD; py += s) {
              const [x, y] = toMath([px + s / 2, py + s / 2]);
              if (test(x, y)) pg.poly([[px, py], [px + s, py], [px + s, py + s], [px, py + s]], color);
            }
          }
        },
      };
      return g;
    }

    return {
      redraw: board.redraw,
      get points() { return mathPoints; },
      move(name, p) {
        const q = toPx(p);
        board.points[name][0] = q[0]; board.points[name][1] = q[1];
        board.redraw();
      },
    };
  }

  // Polynomial as readable text: poly([1, -2, 0, 3]) -> "x³ − 2x² + 3"
  function poly(coeffs, v = 'x') {
    const sup = ['', '', '²', '³', '⁴', '⁵', '⁶'];
    const deg = coeffs.length - 1;
    let out = '';
    coeffs.forEach((c, i) => {
      const k = deg - i, r = +c.toFixed(4);
      if (r === 0) return;
      const abs = Math.abs(r), body = k === 0 ? `${abs}` : `${abs === 1 ? '' : abs}${v}${sup[k]}`;
      out += out ? (r < 0 ? ` − ${body}` : ` + ${body}`) : (r < 0 ? `−${body}` : body);
    });
    return out || '0';
  }

  window.NotePlot = { graph, poly };
})();
