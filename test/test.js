// import * as data from './test_data.js'
import * as drawingHelper from '../static/js/drawing_helper.js'

const data = [12, 15, 18, 20, 22, 25, 27, 30, 33, 35, 36, 38, 40, 42, 48, 50, 52, 55,100];

// Copy and Sort datas
const sorted = [...data].sort((a,b) => a-b);

// Reusable median function 
function median(arr) {
    const n = arr.length;
    const mid = Math.floor(n/2); // rounding down to the nearest integer
    return (n % 2 === 0) 
    ? (arr[mid-1] + arr[mid]) / 2
    : arr[mid];
}

//computing qurtiles conceptually
function quartiles(arr) {
    const n = arr.length;
    const mid = Math.floor(n/2);

    const lower = arr.slice(0, mid);
    const upper = (n % 2 ===0) ? arr.slice(mid) : arr.slice(mid + 1);

    return {
        Q1: median(lower),
        Q2: median(arr),
        Q3: median(upper)
    };
}

const { Q1, Q2, Q3 } = quartiles(sorted);

const IQR = Q3 - Q1;
const quartileDeviation = IQR / 2;

// Blank canvas sheet
const canvas = document.getElementById("c");
const {ctx, width, height, dpr} = drawingHelper.setupCanvas(canvas, 0.25);

//Layout decision
const margin = { left: 70, right: 70, top: 40, bottom: 60 };

const axisY = 190; //axis at the bottom
const dotY = 150; //dots slightly above
const boxY = 95;  // Box even higher
const boxH = 45; // Box height

//Mapping data to pixels
const minX = Math.min(...sorted); //minimum value of data
const maxX = Math.max(...sorted); //maximum value of data

const pad = (maxX - minX) * 0.08 || 1;
const xMin = minX - pad;  // shift minimum value to the right
const xMax = maxX + pad; // shift maximum value to the left 

function xScale(x) {
    const denom = (xMax - xMin) || 1;
    const t = (x - xMin) / denom; // ration of x position (normalized between 0 and 1)according to data domain
    return margin.left + t * (width - margin.left - margin.right); // return value of drawing width according to t ratio
}

//Drawing helper functions

//Reusable straight lines
function line(x1, y1, x2, y2, w=2, color="#222") {
    ctx.save();  // save the other drawing settings not to mix with other drawing setting
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    ctx.restore();// restore the save settings
}
//Reusalble dashed lines
function dashed(x1, y1, x2, y2, dash=[5,6], w=1, color="#888") {
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

function text (msg, x, y, size=16, color="#111", align="center") {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${size}px system-ui, Arial`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(msg, x, y);
    ctx.restore();
}

function dot(x, y, r= 4, color="#444") {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

//Render the diagram

//Clear the canvas as canvas does not auto-clear.
ctx.clearRect(0, 0, width, height);

text("Quartiles focus on the middle 50% (the “main body”) of the data", width/2, 20, 18, "#111");

line(margin.left, axisY, width-margin.right, axisY, 2, "#333");

//Plot the dot for each data value
sorted.forEach(v => dot(xScale(v), dotY, 2,"red"));

//Convert quartile values into pixel x positions
const xQ1 = xScale(Q1);
const xQ2 = xScale(Q2);
const xQ3 = xScale(Q3);

dashed(xQ1, boxY, xQ1, axisY , [4,6], 1, "#999");
dashed(xQ2, boxY, xQ2, axisY , [4,6], 1, "#999");
dashed(xQ3, boxY, xQ3, axisY, [4,6], 1, "#999");

function drawBox(x, y, w, h, lw=2) {
    ctx.save();
    ctx.fillStyle = "rgba(100,160,255,0.35)";
    ctx.strokeStyle = "rgba(30,90,200,1)";
    ctx.lineWidth = lw;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
}

drawBox(xQ1, boxY, xQ3-xQ1, boxH);


line (xQ2, boxY, xQ2, boxY + boxH, 3, "rgba(30, 90, 200, 1)");

text("Q1", xQ1, boxY- 16, 14, "#333");
text("Median", xQ2, boxY-16, 14, "#333");
text("Q3", xQ3, boxY-16, 14, "#333");

const brY = boxY + boxH + margin.top / 2;
//Horizontal bracket line
line(xQ1, brY, xQ3, brY, 2, "rgba(30,90,200,1)");
//left cap
line(xQ3, brY-8, xQ3, brY+8, 2, "rgba(30,90,200,1)");
//right cap
line(xQ1, brY-8, xQ1, brY+8, 2, "rgba(30,90,200,1)");

text("Outliers can exist far away, but IQR stays focused on the central half.", width/2, axisY+35, 13, "#666")




