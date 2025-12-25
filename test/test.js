// import * as data from './test_data.js'

/* =========================================================
   CONCEPT: show “main body” of data (middle 50%)
   - dots: your sorted data points
   - bracket/box: Q1 to Q3 (IQR)
   - center line: median
   - label: quartile deviation = IQR/2
   ========================================================= */

// 1) Put your real dataset here (numbers only)
const data = [12, 15, 18, 20, 22, 25, 27, 30, 33, 35, 36, 38, 40, 42, 45, 48, 50, 52, 55, 100]; // includes an outlier on purpose

// -------------------------
// Stats helpers (conceptual)
// -------------------------
const sorted = [...data].sort((a,b) => a-b);

function median(arr) {
  const n = arr.length;
  const mid = Math.floor(n/2);
  return (n % 2 === 0) ? (arr[mid-1] + arr[mid]) / 2 : arr[mid];
}

// “Median of halves” quartiles
function quartiles(arr) {
  const n = arr.length;
  const mid = Math.floor(n/2);
  const lower = arr.slice(0, mid);
  const upper = (n % 2 === 0) ? arr.slice(mid) : arr.slice(mid + 1);
  return { Q1: median(lower), Q2: median(arr), Q3: median(upper) };
}

const { Q1, Q2, Q3 } = quartiles(sorted);
const IQR = Q3 - Q1;
const quartileDeviation = IQR / 2;

// -------------------------
// Canvas setup
// -------------------------
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const W = canvas.width, H = canvas.height;
const margin = { left: 70, right: 70, top: 40, bottom: 60 };

const axisY = 190;     // horizontal number line
const dotY  = 150;     // where dots sit above the axis
const boxY  = 95;      // where the IQR box sits
const boxH  = 45;

// Domain: use data range, with padding
const minX = Math.min(...sorted);
const maxX = Math.max(...sorted);
const pad = (maxX - minX) * 0.08 || 1; // avoid zero range
const xMin = minX - pad;
const xMax = maxX + pad;

// Map a data value → pixel x
function xScale(x) {
  const t = (x - xMin) / (xMax - xMin);
  return margin.left + t * (W - margin.left - margin.right);
}

// Drawing helpers
function line(x1,y1,x2,y2, w=2, color="#222") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.stroke();
  ctx.restore();
}

function dashed(x1,y1,x2,y2, dash=[5,6], w=1, color="#888") {
  ctx.save();
  ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.stroke();
  ctx.restore();
}

function text(msg, x, y, size=16, color="#111", align="center") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px system-ui, Arial`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(msg, x, y);
  ctx.restore();
}

function dot(x,y,r=4,color="#444") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

// -------------------------
// Render (the diagram logic)
// -------------------------
ctx.clearRect(0,0,W,H);

// Title (concept-first)
text("Quartiles focus on the middle 50% (the “main body”) of the data", W/2, 20, 18, "#111");

// Axis (number line)
line(margin.left, axisY, W - margin.right, axisY, 2, "#333");

// Draw data dots (sorted positions)
// Concept: each dot is one observation on the number line
sorted.forEach(v => dot(xScale(v), dotY, 4, "rgba(60,60,60,0.75)"));

// Guides for Q1, Median, Q3
const xQ1 = xScale(Q1);
const xQ2 = xScale(Q2);
const xQ3 = xScale(Q3);

dashed(xQ1, 50, xQ1, axisY + 50, [4,6], 1, "#999");
dashed(xQ2, 50, xQ2, axisY + 50, [4,6], 1, "#999");
dashed(xQ3, 50, xQ3, axisY + 50, [4,6], 1, "#999");

// IQR box: middle 50%
// Concept: the box is the “typical spread”
ctx.save();
ctx.fillStyle = "rgba(100,160,255,0.35)";
ctx.strokeStyle = "rgba(30,90,200,1)";
ctx.lineWidth = 2;
ctx.fillRect(xQ1, boxY, xQ3 - xQ1, boxH);
ctx.strokeRect(xQ1, boxY, xQ3 - xQ1, boxH);
ctx.restore();

// Median line inside the box
line(xQ2, boxY, xQ2, boxY + boxH, 3, "rgba(30,90,200,1)");

// Labels
text("Q1", xQ1, boxY - 16, 14, "#333");
text("Median", xQ2, boxY - 16, 14, "#333");
text("Q3", xQ3, boxY - 16, 14, "#333");

// Bracket showing IQR = Q3 - Q1
const brY = boxY + boxH + 20;
line(xQ1, brY, xQ3, brY, 2, "rgba(30,90,200,1)");
line(xQ1, brY - 8, xQ1, brY + 8, 2, "rgba(30,90,200,1)");
line(xQ3, brY - 8, xQ3, brY + 8, 2, "rgba(30,90,200,1)");
text(`IQR = Q3 − Q1 = ${IQR.toFixed(2)}`, (xQ1 + xQ3)/2, brY + 18, 14, "rgba(30,90,200,1)");

// Quartile deviation (half of IQR)
text(`Quartile deviation = IQR/2 = ${quartileDeviation.toFixed(2)}`, W/2, H - 22, 15, "#111");

// Small conceptual note about outliers
text("Outliers can exist far away, but IQR stays focused on the central half.", W/2, axisY + 35, 13, "#666");