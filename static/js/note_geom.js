/* =====================================================================
   note_geom.js — shared helper for geometry demos with draggable points
   ---------------------------------------------------------------------
   Used by the TRY IT demos in the geometry notes. A note loads it with:
       <script src="/static/js/note_geom.js"></script>

   Main function:
     NoteGeom.board(canvas, {
       points: { A: [x, y], B: [x, y], ... },   // draggable points (canvas pixels, y down)
       draw:   function (g, P) { ... },          // draws the figure; P.A is [x, y]
       fixed:  ["O"],                            // optional: points that can't be dragged
       constrain: { P: (p) => p },              // optional: move a dragged point, e.g. onto a circle
     })
     -> { redraw(), points }

   The canvas is treated as 520 × 340 units whatever its CSS size, and
   draggable points are drawn on top automatically with their names.

   Inside draw(), g has drawing helpers:
     g.seg(p, q, color, opts)      segment p–q        opts: { dash: true, width: 2 }
     g.line(p, q, color, opts)     whole line through p and q (to the canvas edge)
     g.circle(c, r, color, opts)   circle             opts: { fill: "rgba(...)" }
     g.poly([p, q, r], fill)       filled polygon
     g.dot(p, color, name)         small labelled point (not draggable)
     g.text(p, text, color)        text at p
     g.arc(v, p, q, color, r)      angle mark at v between rays v→p and v→q
     g.right(v, p, q, color)       right-angle square at v

   And NoteGeom has the geometry maths (points are [x, y] arrays):
     dist, mid, lerp, angle(v, p, q) in degrees, cross,
     intersect(p1, p2, q1, q2)     where line p1p2 meets line q1q2 (null if parallel)
     foot(p, a, b)                 foot of the perpendicular from p to line ab
     circumcenter(a, b, c), incenter(a, b, c), centroid(a, b, c)
     divide(p, q, m, n)            point dividing pq internally in m : n
     divideExt(p, q, m, n)         point dividing pq externally in m : n (m ≠ n)
     lineCircle(p, q, c, r)        points where line pq meets a circle (0, 1 or 2)
     tangents(p, c, r)             touching points of the tangents from p
     onCircle(p, c, r)             nearest point to p on the circle
   ===================================================================== */
(function () {
  const W = 520, H = 340;

  // ---------- Geometry maths ----------
  const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);

  // Angle at v between rays v→p and v→q, in degrees (0 … 180)
  function angle(v, p, q) {
    const a1 = Math.atan2(p[1] - v[1], p[0] - v[0]);
    const a2 = Math.atan2(q[1] - v[1], q[0] - v[0]);
    let d = Math.abs(a1 - a2) * 180 / Math.PI;
    return d > 180 ? 360 - d : d;
  }

  // Where line p1p2 meets line q1q2; null when they are parallel
  function intersect(p1, p2, q1, q2) {
    const d = (p2[0] - p1[0]) * (q2[1] - q1[1]) - (p2[1] - p1[1]) * (q2[0] - q1[0]);
    if (Math.abs(d) < 1e-9) return null;
    const t = ((q1[0] - p1[0]) * (q2[1] - q1[1]) - (q1[1] - p1[1]) * (q2[0] - q1[0])) / d;
    return lerp(p1, p2, t);
  }

  // Foot of the perpendicular from p to line ab
  function foot(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
    return [a[0] + dx * t, a[1] + dy * t];
  }

  // Centre of the circle through a, b, c (null if they are in a line)
  function circumcenter(a, b, c) {
    const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    if (Math.abs(d) < 1e-9) return null;
    const s = (p) => p[0] * p[0] + p[1] * p[1];
    return [
      (s(a) * (b[1] - c[1]) + s(b) * (c[1] - a[1]) + s(c) * (a[1] - b[1])) / d,
      (s(a) * (c[0] - b[0]) + s(b) * (a[0] - c[0]) + s(c) * (b[0] - a[0])) / d,
    ];
  }

  // Incentre: average of the vertices weighted by the opposite side lengths
  function incenter(a, b, c) {
    const la = dist(b, c), lb = dist(c, a), lc = dist(a, b), s = la + lb + lc;
    return [(la * a[0] + lb * b[0] + lc * c[0]) / s, (la * a[1] + lb * b[1] + lc * c[1]) / s];
  }

  // Nearest point to p on the circle (centre c, radius r): use it in constrain
  function onCircle(p, c, r) {
    const d = dist(p, c) || 1;
    return [c[0] + (p[0] - c[0]) * r / d, c[1] + (p[1] - c[1]) * r / d];
  }

  const centroid = (a, b, c) => [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
  const divide = (p, q, m, n) => lerp(p, q, m / (m + n));
  const divideExt = (p, q, m, n) => lerp(p, q, m / (m - n));

  // Points where line pq meets the circle (centre c, radius r)
  function lineCircle(p, q, c, r) {
    const f = foot(c, p, q), h = dist(c, f);
    if (h > r + 1e-9) return [];
    const len = dist(p, q), k = Math.sqrt(Math.max(r * r - h * h, 0)) / len;
    const dx = (q[0] - p[0]) * k, dy = (q[1] - p[1]) * k;
    return k < 1e-9 ? [f] : [[f[0] - dx, f[1] - dy], [f[0] + dx, f[1] + dy]];
  }

  // Touching points of the two tangents from an outside point p
  function tangents(p, c, r) {
    const d = dist(p, c);
    if (d <= r) return [];
    const base = Math.atan2(p[1] - c[1], p[0] - c[0]), off = Math.acos(r / d);
    return [base - off, base + off].map((t) => [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]);
  }

  // ---------- Drawing helpers bound to one canvas ----------
  function painter(ctx) {
    function stroke(color, opts = {}) {
      ctx.strokeStyle = color;
      ctx.lineWidth = opts.width || 2;
      ctx.setLineDash(opts.dash ? [6, 5] : []);
    }
    const g = {
      seg(p, q, color = '#334155', opts) {
        stroke(color, opts);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      },
      line(p, q, color = '#94a3b8', opts) {
        const d = dist(p, q) || 1, k = 2000 / d;
        g.seg(lerp(p, q, -k), lerp(p, q, k), color, opts);
      },
      circle(c, r, color = '#334155', opts = {}) {
        stroke(color, opts);
        ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2);
        if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
        ctx.stroke();
      },
      poly(pts, fill = 'rgba(37, 99, 235, 0.08)') {
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
      },
      text(p, text, color = '#0f172a') {
        ctx.setLineDash([]);
        ctx.fillStyle = color; ctx.font = '14px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, p[0], p[1]);
      },
      dot(p, color = '#0f172a', name) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, Math.PI * 2); ctx.fill();
        if (name) g.text([p[0] + 12, p[1] - 12], name, color);
      },
      arc(v, p, q, color = '#ea580c', r = 22) {
        let a1 = Math.atan2(p[1] - v[1], p[0] - v[0]), a2 = Math.atan2(q[1] - v[1], q[0] - v[0]);
        let diff = a2 - a1;
        while (diff <= -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        stroke(color, { width: 2 });
        ctx.beginPath(); ctx.arc(v[0], v[1], r, a1, a1 + diff, diff < 0); ctx.stroke();
      },
      right(v, p, q, color = '#475569') {
        const s = 10, u = lerp(v, p, s / (dist(v, p) || 1)), w = lerp(v, q, s / (dist(v, q) || 1));
        stroke(color, { width: 1.5 });
        ctx.beginPath(); ctx.moveTo(u[0], u[1]);
        ctx.lineTo(u[0] + w[0] - v[0], u[1] + w[1] - v[1]); ctx.lineTo(w[0], w[1]); ctx.stroke();
      },
    };
    return g;
  }

  // ---------- The board: canvas + draggable points ----------
  function board(canvas, options) {
    const ctx = canvas.getContext('2d');
    const points = {};
    Object.entries(options.points).forEach(([k, v]) => (points[k] = [v[0], v[1]]));
    const fixed = new Set(options.fixed || []);
    let dragging = null;

    // Sharp drawing on high-resolution screens
    const ratio = window.devicePixelRatio || 1;
    canvas.width = W * ratio;
    canvas.height = H * ratio;
    canvas.style.width = W + 'px'; // CSS shrinks it on narrow screens (max-width: 100%)
    canvas.style.touchAction = 'none'; // let fingers drag points instead of scrolling

    function redraw() {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const g = painter(ctx);
      options.draw(g, points);
      // Draggable points on top: a ring shows they can be moved
      Object.entries(points).forEach(([name, p]) => {
        if (fixed.has(name)) return;
        ctx.setLineDash([]);
        ctx.fillStyle = '#2563eb';
        ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(p[0], p[1], 11, 0, Math.PI * 2); ctx.stroke();
        g.text([p[0] + 16, p[1] - 14], name, '#1e3a8a');
      });
    }

    // Convert a mouse/finger position to the 520 × 340 board units
    function toBoard(e) {
      const rect = canvas.getBoundingClientRect();
      return [(e.clientX - rect.left) * W / rect.width, (e.clientY - rect.top) * H / rect.height];
    }

    canvas.addEventListener('pointerdown', (e) => {
      const m = toBoard(e);
      let best = null, bestD = 20;
      Object.entries(points).forEach(([name, p]) => {
        if (!fixed.has(name) && dist(m, p) < bestD) { best = name; bestD = dist(m, p); }
      });
      if (best) { dragging = best; canvas.setPointerCapture(e.pointerId); }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const m = toBoard(e);
      let p = [Math.min(Math.max(m[0], 10), W - 10), Math.min(Math.max(m[1], 10), H - 10)];
      if (options.constrain && options.constrain[dragging]) p = options.constrain[dragging](p);
      points[dragging] = p;
      redraw();
    });
    const stop = () => (dragging = null);
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);

    redraw();
    return { redraw, points };
  }

  window.NoteGeom = {
    board, dist, mid, lerp, cross, angle, intersect, foot, onCircle,
    circumcenter, incenter, centroid, divide, divideExt, lineCircle, tangents,
  };
})();
