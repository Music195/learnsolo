/* =====================================================================
   physkit.js — one shared look and toolset for the G12 Physics demos
   ---------------------------------------------------------------------
   Every physics demo is built the same way:

     <div class="pk" id="pk-xyz"></div>
     <script>
       (function () {
         const k = PhysKit.mount('pk-xyz', { x: [-5, 5], y: [-3, 3] });
         const r = k.slider({ label: 'r', unit: 'm', min: 0.5, max: 2.5, step: 0.1, value: 1.5 });
         k.draw = g => { g.circle([0, 0], r.value, { color: PhysKit.C.ink }); };
         k.loop((dt, t) => { ... });   // animation, Play/Pause handled for you
       })();
     </script>

   What the kit does for every demo:
   - A light drawing board that fills the card width and keeps 1 unit
     across = 1 unit up, so circles stay round on any screen size.
   - World coordinates (metres, volts, ...) instead of pixels.
   - Labels are kept INSIDE the board: if a label would stick out of the
     edge it is pushed back in.
   - Simple notation in labels and controls: "a_c" draws a with a small c
     below, "v^2" draws v with a small 2 above, "ω_{0}" groups several letters.
   - The same colour means the same thing in every demo (see C below).
   - Sliders show their current value, Play/Pause, a readout card.
   - Animations stop by themselves when the student leaves the page.
   ===================================================================== */
(function () {
  'use strict';

  // ---------- Colours: one meaning each, used in every demo ----------
  const C = {
    ink: '#1e293b',      // outlines, normal text
    muted: '#64748b',    // helper text, dashed guide lines
    faint: '#e2e8f0',    // grid, light guides
    paper: '#ffffff',    // board background
    force: '#dc2626',    // forces (red)
    vel: '#16a34a',      // velocity (green)
    acc: '#2563eb',      // acceleration (blue)
    energy: '#d97706',   // energy, heat, power (amber)
    field: '#7c3aed',    // electric / magnetic field (purple)
    fluid: '#0ea5e9',    // water, fluid, waves (sky blue)
    fluidFill: '#e0f2fe',
    hot: '#ef4444', cold: '#3b82f6',
    pos: '#dc2626', neg: '#2563eb', // + and − charges, N and S poles
    good: '#16a34a', bad: '#dc2626'
  };
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  // ---------- Notation: "a_c", "v^2", "ω_{max}" ----------
  // Split a label into pieces: normal text, subscript or superscript.
  function parseRich(s) {
    const out = [];
    let i = 0, buf = '';
    const flush = () => { if (buf) { out.push({ t: buf, m: 'n' }); buf = ''; } };
    while (i < s.length) {
      const ch = s[i];
      if ((ch === '_' || ch === '^') && i + 1 < s.length) {
        flush();
        let part;
        if (s[i + 1] === '{') {               // a group: _{max}
          const end = s.indexOf('}', i + 2);
          part = s.slice(i + 2, end < 0 ? s.length : end);
          i = end < 0 ? s.length : end + 1;
        } else {                              // one character: _c
          part = s[i + 1]; i += 2;
        }
        out.push({ t: part, m: ch === '_' ? 'sub' : 'sup' });
      } else { buf += ch; i++; }
    }
    flush();
    return out;
  }
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // The same notation as HTML, for controls and readouts
  function rich(s) {
    return parseRich(String(s)).map(p =>
      p.m === 'sub' ? `<sub>${esc(p.t)}</sub>` : p.m === 'sup' ? `<sup>${esc(p.t)}</sup>` : esc(p.t)
    ).join('');
  }

  // Format a number: fixed decimals, and "−" (a real minus sign) for negatives
  function num(x, d = 2) {
    if (!isFinite(x)) return '∞';
    const s = Math.abs(x).toFixed(d);
    return (x < 0 && Number(s) !== 0 ? '−' : '') + s;
  }

  // =====================================================================
  //   View: one canvas with world coordinates
  // =====================================================================
  function View(host, opts) {
    const canvas = document.createElement('canvas');
    canvas.className = 'pk-canvas';
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const xr = opts.x, yr = opts.y;
    // equal: true → 1 unit across = 1 unit up (height follows the width)
    // equal: false → fixed pixel height, x and y scaled separately (graphs)
    const equal = opts.equal !== false;
    let W = 0, H = 0, sx = 1, sy = 1;
    const view = { canvas, draw: null, handles: [] };

    function resize() {
      const w = Math.max(240, Math.min(host.clientWidth || 640, opts.maxWidth || 680));
      W = w;
      H = equal ? Math.round(w * (yr[1] - yr[0]) / (xr[1] - xr[0])) : (opts.height || 200);
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(W * ratio); canvas.height = Math.round(H * ratio);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      sx = W / (xr[1] - xr[0]); sy = H / (yr[1] - yr[0]);
      view.redraw();
    }

    // World → pixel and back
    const X = x => (x - xr[0]) * sx;
    const Y = y => (yr[1] - y) * sy;
    const toPx = p => [X(p[0]), Y(p[1])];
    const toWorld = q => [q[0] / sx + xr[0], yr[1] - q[1] / sy];

    function stroke(o) {
      ctx.strokeStyle = o.color || C.ink;
      ctx.lineWidth = o.width || 2;
      ctx.setLineDash(o.dash ? (Array.isArray(o.dash) ? o.dash : [6, 5]) : []);
      ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
      ctx.stroke();
      ctx.globalAlpha = 1; ctx.setLineDash([]);
    }
    function fill(o) {
      if (!o.fill) return;
      ctx.fillStyle = o.fill;
      ctx.globalAlpha = o.fillAlpha == null ? 1 : o.fillAlpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Text shrinks with the board on narrow screens (phones), but never
    // below 80 % of its normal size, so labels keep the same spacing.
    const fit = size => size * Math.max(0.8, Math.min(1, W / 620));

    // Measure a rich label so it can be centred and kept inside the board
    function measure(parts, size, bold) {
      let w = 0;
      for (const p of parts) {
        const fs = p.m === 'n' ? size : size * 0.72;
        ctx.font = `${bold ? '600 ' : ''}${fs}px ${FONT}`;
        w += ctx.measureText(p.t).width;
      }
      return w;
    }

    // The drawing toolbox handed to k.draw(g)
    const g = {
      C, num,
      get W() { return W; }, get H() { return H; },
      toPx, toWorld,
      px: d => d * sx,             // world length → pixels
      world: d => d / sx,          // pixels → world length
      line(a, b, o = {}) {
        ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); stroke(o);
      },
      path(pts, o = {}) {
        if (pts.length < 2) return;
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
        if (o.close) ctx.closePath();
        fill(o);
        if (o.color !== 'none') stroke(o);
      },
      // Circle with a radius in world units
      circle(c, r, o = {}) {
        ctx.beginPath(); ctx.arc(X(c[0]), Y(c[1]), Math.abs(r * sx), 0, 2 * Math.PI);
        fill(o); if (o.color !== 'none') stroke(o);
      },
      // Dot with a radius in pixels (particles, points, charges)
      dot(c, rpx = 4, fillColor = C.ink, o = {}) {
        ctx.beginPath(); ctx.arc(X(c[0]), Y(c[1]), rpx, 0, 2 * Math.PI);
        ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
        ctx.fillStyle = fillColor; ctx.fill();
        ctx.globalAlpha = 1;
        if (o.stroke) { ctx.lineWidth = o.width || 1.5; ctx.strokeStyle = o.stroke; ctx.stroke(); }
      },
      rect(x, y, w, h, o = {}) {
        ctx.beginPath();
        const r = o.radius || 0;
        const px = X(x), py = Y(y + h), pw = w * sx, ph = h * sy;
        if (ctx.roundRect && r) ctx.roundRect(px, py, pw, ph, r); else ctx.rect(px, py, pw, ph);
        fill(o); if (o.color !== 'none') stroke(o);
      },
      // Arrow from p along vector v (world units). Its label goes just past
      // the tip, in the arrow's own direction, unless `side` is given.
      arrow(p, v, o = {}) {
        const a = toPx(p), b = toPx([p[0] + v[0], p[1] + v[1]]);
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (L < 2) return;
        const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
        const head = Math.min(o.head || 11, L * 0.6), wid = (o.width || 2.5);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0] - ux * head * 0.8, b[1] - uy * head * 0.8);
        stroke({ ...o, width: wid });
        ctx.beginPath();
        ctx.moveTo(b[0], b[1]);
        ctx.lineTo(b[0] - head * ux - head * 0.45 * uy, b[1] - head * uy + head * 0.45 * ux);
        ctx.lineTo(b[0] - head * ux + head * 0.45 * uy, b[1] - head * uy - head * 0.45 * ux);
        ctx.closePath();
        ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
        ctx.fillStyle = o.color || C.ink; ctx.fill(); ctx.globalAlpha = 1;
        if (o.label) {
          // side is a direction in WORLD coordinates (y up)
          const d = o.side ? [o.side[0], -o.side[1]] : [ux, uy];
          const n = Math.hypot(d[0], d[1]) || 1;
          const parts = parseRich(o.label), size = fit(o.size || 15);
          const tw = measure(parts, size, true);
          // push out by half the label's width (sideways) or height (up/down)
          const dist = 8 + Math.abs(d[0] / n) * tw / 2 + Math.abs(d[1] / n) * size / 2;
          g.textPx([b[0] + d[0] / n * dist, b[1] + d[1] / n * dist], o.label,
            { color: o.color, size: o.size || 15, bold: true });
        }
      },
      // Text at a world point. o: color, size, align ('center'|'left'|'right'),
      // bold, dx/dy (pixel nudge), bg (a soft background box)
      text(p, s, o = {}) {
        g.textPx([X(p[0]) + (o.dx || 0), Y(p[1]) - (o.dy || 0)], s, o);
      },
      textPx(q, s, o = {}) {
        const parts = parseRich(String(s));
        const size = fit(o.size || 14);
        const tw = measure(parts, size, o.bold);
        let x = q[0];
        if ((o.align || 'center') === 'center') x -= tw / 2;
        else if (o.align === 'right') x -= tw;
        // Keep the whole label inside the board
        x = Math.max(4, Math.min(W - tw - 4, x));
        const y = Math.max(size * 0.7 + 2, Math.min(H - size * 0.6 - 2, q[1]));
        if (o.bg) {
          ctx.fillStyle = o.bg === true ? 'rgba(255,255,255,0.85)' : o.bg;
          ctx.fillRect(x - 3, y - size * 0.7, tw + 6, size * 1.4);
        }
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.fillStyle = o.color || C.ink;
        for (const p of parts) {
          const fs = p.m === 'n' ? size : size * 0.72;
          ctx.font = `${o.bold ? '600 ' : ''}${fs}px ${FONT}`;
          const yy = p.m === 'sub' ? y + size * 0.3 : p.m === 'sup' ? y - size * 0.38 : y;
          ctx.fillText(p.t, x, yy);
          x += ctx.measureText(p.t).width;
        }
      },
      // Light grid every `step` world units
      grid(step = 1, color = '#f1f5f9') {
        ctx.beginPath();
        for (let x = Math.ceil(xr[0] / step) * step; x <= xr[1]; x += step) { ctx.moveTo(X(x), 0); ctx.lineTo(X(x), H); }
        for (let y = Math.ceil(yr[0] / step) * step; y <= yr[1]; y += step) { ctx.moveTo(0, Y(y)); ctx.lineTo(W, Y(y)); }
        stroke({ color, width: 1 });
      },
      // Graph axes with tick labels. o: xlabel, ylabel, xstep, ystep, xfmt, yfmt
      axes(o = {}) {
        const x0 = Math.max(xr[0], Math.min(xr[1], 0)), y0 = Math.max(yr[0], Math.min(yr[1], 0));
        const pad = o.pad || 0;
        if (o.xstep) {
          for (let x = Math.ceil(xr[0] / o.xstep) * o.xstep; x <= xr[1] + 1e-9; x += o.xstep) {
            g.line([x, yr[0]], [x, yr[1]], { color: '#f1f5f9', width: 1 });
            if (Math.abs(x - x0) > 1e-9 || !o.ystep)
              g.textPx([X(x), Y(y0) + 12], o.xfmt ? o.xfmt(x) : String(+x.toFixed(3)), { size: 11, color: C.muted });
          }
        }
        if (o.ystep) {
          for (let y = Math.ceil(yr[0] / o.ystep) * o.ystep; y <= yr[1] + 1e-9; y += o.ystep) {
            g.line([xr[0], y], [xr[1], y], { color: '#f1f5f9', width: 1 });
            g.textPx([X(x0) - 6, Y(y)], o.yfmt ? o.yfmt(y) : String(+y.toFixed(3)), { size: 11, color: C.muted, align: 'right' });
          }
        }
        g.arrow([xr[0] + pad, y0], [xr[1] - xr[0] - pad, 0], { color: C.muted, width: 1.5, head: 8 });
        g.arrow([x0, yr[0]], [0, yr[1] - yr[0]], { color: C.muted, width: 1.5, head: 8 });
        if (o.xlabel) g.textPx([W - 6, Y(y0) - 12], o.xlabel, { size: 13, color: C.muted, align: 'right' });
        if (o.ylabel) g.textPx([X(x0) + 8, 10], o.ylabel, { size: 13, color: C.muted, align: 'left' });
      },
      // A draggable handle look: white ring with a coloured centre
      handle(p, color = C.acc) {
        g.dot(p, 9, 'rgba(255,255,255,0.9)', { stroke: color, width: 2.5 });
        g.dot(p, 4, color);
      },
      ctx
    };
    view.g = g;

    // Change the visible range (e.g. a graph whose axis grows with the data)
    view.setRange = function (x, y) {
      if (x) { xr[0] = x[0]; xr[1] = x[1]; }
      if (y) { yr[0] = y[0]; yr[1] = y[1]; }
      sx = W / (xr[1] - xr[0]); sy = H / (yr[1] - yr[0]);
    };

    view.redraw = function () {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = opts.bg || C.paper; ctx.fillRect(0, 0, W, H);
      if (view.draw) view.draw(g);
    };

    // ---------- Dragging ----------
    // view.drag({ get: () => [x, y], set: p => {...}, r: 14, hit: p => true/false })
    // get returns the handle's world position; set receives the new one.
    let active = null;
    const pointer = e => {
      const r = canvas.getBoundingClientRect();
      return toWorld([(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]);
    };
    // A handle can give its own hit(p) test (e.g. "anywhere on the magnet");
    // otherwise it is grabbed within r pixels of its point.
    const hit = p => view.handles.find(h => {
      if (h.hit) return h.hit(p);
      const a = toPx(h.get()), b = toPx(p);
      return Math.hypot(a[0] - b[0], a[1] - b[1]) < (h.r || 16);
    });
    view.drag = h => { view.handles.push(h); return h; };
    canvas.addEventListener('pointerdown', e => {
      active = hit(pointer(e));
      if (active) { canvas.setPointerCapture(e.pointerId); e.preventDefault(); if (active.start) active.start(); }
    });
    canvas.addEventListener('pointermove', e => {
      const p = pointer(e);
      if (active) { active.set(p); view.redraw(); if (view.onChange) view.onChange(); }
      else canvas.style.cursor = hit(p) ? 'grab' : 'default';
    });
    const up = () => { if (active && active.end) active.end(); active = null; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.style.touchAction = 'none';

    if (window.ResizeObserver) new ResizeObserver(() => {
      const w = Math.min(host.clientWidth, opts.maxWidth || 680);
      if (Math.abs(w - W) > 1) resize();
    }).observe(host);
    resize();
    return view;
  }

  // =====================================================================
  //   mount: build the whole demo (board, controls, readout)
  // =====================================================================
  function mount(id, opts = {}) {
    const root = document.getElementById(id);
    root.classList.add('pk');
    root.innerHTML = '';
    const stage = document.createElement('div'); stage.className = 'pk-stage';
    const controls = document.createElement('div'); controls.className = 'pk-controls';
    const readout = document.createElement('div'); readout.className = 'pk-readout';
    root.append(stage, controls, readout);

    const views = [];
    const k = { root, stage, controls, C, rich, num, playing: opts.play !== false, views };

    // Main board, plus extra boards (graphs) with k.addView
    k.addView = function (o) {
      const holder = document.createElement('div'); holder.className = 'pk-view';
      if (o.title) { const t = document.createElement('div'); t.className = 'pk-view-title'; t.innerHTML = rich(o.title); holder.appendChild(t); }
      stage.appendChild(holder);
      const v = View(holder, o);
      views.push(v);
      return v;
    };
    if (opts.x) {
      k.view = k.addView(opts);
      Object.defineProperty(k, 'draw', { set(fn) { k.view.draw = fn; k.view.redraw(); }, get() { return k.view.draw; } });
    }
    k.redraw = () => views.forEach(v => v.redraw());

    // A row of controls (sliders and buttons are added to the current row)
    let row = null;
    k.row = function () { row = document.createElement('div'); row.className = 'pk-row'; controls.appendChild(row); return row; };
    const currentRow = () => row || k.row();

    // ---------- Slider with its value shown next to it ----------
    // k.slider({ label: 'r', unit: 'm', min, max, step, value, digits, format })
    k.slider = function (o) {
      const wrap = document.createElement('label'); wrap.className = 'pk-slider';
      const name = document.createElement('span'); name.className = 'pk-name'; name.innerHTML = rich(o.label);
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', min: o.min, max: o.max, step: o.step || 'any', value: o.value });
      if (o.id) input.id = o.id;
      const val = document.createElement('span'); val.className = 'pk-val';
      wrap.append(name, input, val);
      currentRow().appendChild(wrap);
      const listeners = [];
      const s = {
        input,
        get value() { return Number(input.value); },
        set value(v) { input.value = v; show(); },
        on(fn) { listeners.push(fn); return s; }
      };
      const digits = o.digits != null ? o.digits : (String(o.step || '').split('.')[1] || '').length;
      function show() {
        val.innerHTML = o.format ? o.format(s.value) : num(s.value, digits) + (o.unit ? ' ' + rich(o.unit) : '');
      }
      input.addEventListener('input', () => { show(); listeners.forEach(f => f(s.value)); if (k.update) k.update(); k.redraw(); });
      show();
      return s;
    };

    // ---------- Buttons ----------
    k.button = function (label, fn, o = {}) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pk-btn' + (o.primary ? ' pk-primary' : '');
      b.innerHTML = rich(label);
      b.addEventListener('click', () => { fn(b); if (k.update) k.update(); k.redraw(); });
      currentRow().appendChild(b);
      return b;
    };
    // A group where exactly one button is chosen (e.g. Laminar | Turbulent)
    // k.choice(['Laminar', 'Turbulent'], 0, i => ...) → { get value() }
    k.choice = function (labels, start, fn) {
      const group = document.createElement('div'); group.className = 'pk-choice';
      let value = start || 0;
      const btns = labels.map((l, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.innerHTML = rich(l);
        b.addEventListener('click', () => { set(i); if (fn) fn(i); if (k.update) k.update(); k.redraw(); });
        group.appendChild(b); return b;
      });
      function set(i) { value = i; btns.forEach((b, j) => b.classList.toggle('on', j === i)); }
      set(value);
      currentRow().appendChild(group);
      return { get value() { return value; }, set, buttons: btns };
    };
    // A checkbox
    k.check = function (label, on, fn) {
      const wrap = document.createElement('label'); wrap.className = 'pk-check';
      const input = document.createElement('input'); input.type = 'checkbox'; input.checked = !!on;
      const t = document.createElement('span'); t.innerHTML = rich(label);
      wrap.append(input, t);
      input.addEventListener('change', () => { if (fn) fn(input.checked); if (k.update) k.update(); k.redraw(); });
      currentRow().appendChild(wrap);
      return { get value() { return input.checked; }, input };
    };

    // ---------- Readout card ----------
    // k.readout([...lines]) — each line is HTML; use k.rich('a_c') for notation
    k.readout = function (lines) {
      const html = Array.isArray(lines) ? lines.map(l => `<div>${l}</div>`).join('') : lines;
      if (readout.innerHTML !== html) readout.innerHTML = html;
    };

    // ---------- Animation loop with Play / Pause ----------
    // k.loop(fn) calls fn(dt, t) each frame while playing; t is the demo clock.
    k.t = 0;
    k.loop = function (fn, o = {}) {
      if (o.button !== false) {
        const b = k.button(k.playing ? '❚❚ Pause' : '▶ Play', btn => {
          k.playing = !k.playing;
          btn.innerHTML = k.playing ? '❚❚ Pause' : '▶ Play';
        });
        k.playBtn = b;
      }
      let last = performance.now();
      function tick(now) {
        if (!root.isConnected) return;              // the student left the page
        const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
        last = now;
        if (k.playing) { k.t += dt; fn(dt, k.t); if (k.update) k.update(); k.redraw(); }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    // Start or stop the animation from the demo's own code
    k.setPlaying = function (on) {
      k.playing = on;
      if (k.playBtn) k.playBtn.innerHTML = on ? '❚❚ Pause' : '▶ Play';
    };

    // Run the first update after the demo script has set everything up
    requestAnimationFrame(() => { if (k.update) k.update(); k.redraw(); });
    return k;
  }

  window.PhysKit = { mount, View, C, rich, num, parseRich };
})();
