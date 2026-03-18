import * as drawingHelper from './drawing_helper.js';
import * as data from './note_data.js';

window.addEventListener('resize', () => {
    // Redraw diagrams after resize
    drawOddDataMedian();
    drawEvenDataMedian();
    drawOddDataQuartile();
    drawEvenDataQuartile();
    drawQuartileRD();
    drawboxPlot();
});

// put inside for ensuring loading after DOMloaded
document.addEventListener("DOMContentLoaded", () => {
    // Initialize with default data
    calculateQuartileRD();
    calculateBoxPlot();

    //function in this js file
    drawQuartileRD();
    drawEvenDataMedian();
    drawOddDataMedian();
    drawOddDataQuartile();
    drawEvenDataQuartile();
    drawboxPlot();


    bindButton("btn-quartile-rd", () => {
        calculateQuartileRD();
        drawQuartileRD();
    });

    bindButton("btn-boxplot", () => {
        calculateBoxPlot();
        drawboxPlot();
    });

    bindButton("btn-corcoe-plot", () => {
        console.log("btn-corcoe-plot is pressed")
        generateScatterPlot();

    });

    bindButton("btn-corcoe-toggle-trend", () => {
        console.log("btn-corcoe-toggle-trend is pressed")
        toggleTrend();
    });

    bindButton("btn-corcoe-data", () => {
        console.log("btn-corcoe-data is pressed")
        randomData();
    });

    bindButton("btn-corcoe-reset", () => {
        console.log("btn-corcoe-reset is pressed")
        resetPlot();
    });

});


function bindButton(buttonId, handler) {
    const btn = document.getElementById(buttonId);
    if (!btn) {
        console.warn(`${buttonId} not found`);
        return;
    };

    btn.addEventListener("click", handler);
}


// Reusable data and function

const STYLE = {
    boxHeightRatio: 0.25,
    dotOffsetRatio: 0.05,
    lineWidthRatio: 0.006,
    fontRatio: 0.07
};

function getInputData(id) {
    const inputElement = document.getElementById(id);
    if (!inputElement) return;
    const input = inputElement.value;
    if (!input) return;  // Only check if empty
    const values = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
    if (values.length < 4) return; // Check number of valid numbers
    return values;
};



// ---Odd Median Data Diagram----
function drawOddDataMedian() {
    const canvas = document.getElementById("median-canvas1");
    if (!canvas) return; // Throw error if canvas not found
    const { ctx, width, height, dpr } = drawingHelper.setupCanvas(canvas);
    if (!ctx) return;


    const spacing = Math.min(width / 10, 30); // Scale spacing, max 30
    const startX = width / 2 - (spacing * 4) / 2; // Center the 5 dots
    const startY = height / 2;


    drawingHelper.drawTitle(ctx, startX, startY - spacing, "Odd Number of Data",);

    for (let i = 0; i < 5; i++) {
        const isCenter = i === 2;
        drawingHelper.drawDot(ctx,
            startX + i * spacing,
            startY,
            isCenter ? width / 30 : width / 35,
            null,
            isCenter ? data.colors.red : data.colors.blue,

        );
    }

    // Draw arrow and description once, outside the loop

    drawingHelper.drawDesc(ctx, startX, startY + spacing * 2, "Median (position (5+1)/2 = 3)");
    drawingHelper.drawArrow(ctx, startX + (spacing * 4) / 2, startY + 30);
}
/*------------------------------------------------------------------------------------------------------------------------ */
// Draw even data Median Diagram
function drawEvenDataMedian() {
    const canvas = document.getElementById("median-canvas2");
    if (!canvas) return; // Prevent error if canvas not found
    const { ctx, width, height, dpr } = drawingHelper.setupCanvas(canvas);
    if (!ctx) return;

    const spacing = Math.min(width / 10, 30); // Scale spacing, max 30
    const startX = width / 2 - (spacing * 5) / 2; // Center the 6 dots
    const startY = height / 2;

    drawingHelper.drawTitle(ctx, startX, startY - spacing, "Even Number of Data");

    for (let i = 0; i < 6; i++) {
        const isCenter = i === 2 || i === 3;
        drawingHelper.drawDot(ctx,
            startX + i * spacing,
            startY,
            isCenter ? width / 30 : width / 35,
            null, //text
            isCenter ? data.colors.red : data.colors.blue,
        );
    }

    drawingHelper.drawArrow(ctx, startX + (spacing * 5) / 2, startY + spacing, null);
    drawingHelper.drawDesc(ctx, startX, startY + 2 * spacing, "Median (positions at n/2 and n/2 + 1)");
}
/*------------------------------------------------------------------------------------------------------------------------ */
// Draw odd data quartile Diagram
function drawOddDataQuartile() {
    const canvas = document.getElementById("quartileCanvas3");
    if (!canvas) return; // Prevent error if canvas not found
    const { ctx, width, height, dpr } = drawingHelper.setupCanvas(canvas);
    if (!ctx) return;

    const count = data.quartileData1.numbers.length;
    const spacing = Math.min(width / 10, 40); // Scale spacing, max 40
    const startX = width / 2 - (spacing * (count - 1) / 2); // Center the 9 dots
    const startY = height / 2;

    drawingHelper.drawTitle(ctx, startX - spacing / 2.5, startY - spacing, data.quartileData1.title)

    for (let i = 0; i < 9; i++) {


        drawingHelper.drawDot(ctx,
            startX + i * spacing,
            startY,
            spacing / 2.5,
            data.quartileData1.numbers[i].toString(),
            data.colors.blue
        );
    }
    drawingHelper.drawDesc(ctx, startX + spacing * 1.5, startY + spacing, `Q₁ = ${data.quartileData1.q1}`, 12, data.colors.orange);
    drawingHelper.drawArrow(ctx, startX * 2.6, startY + spacing / 2, spacing / 3);
    drawingHelper.drawDesc(ctx, startX + spacing * 4, startY + spacing, `Q₂ = ${data.quartileData1.q2}`, 12, data.colors.green);
    drawingHelper.drawArrow(ctx, startX + spacing * 4.1, startY + spacing / 2, spacing / 3);
    drawingHelper.drawDesc(ctx, startX + spacing * 6.5, startY + spacing, `Q₃ = ${data.quartileData1.q3}`, 12, data.colors.red);
    drawingHelper.drawArrow(ctx, startX + spacing * 6.6, startY + spacing / 2, spacing / 3);
}

// Draw even data quartile digram
function drawEvenDataQuartile() {
    const canvas = document.getElementById("quartileCanvas4");
    if (!canvas) return; // Prevent error if canvas not found
    // const ctx = canvas.getContext("2d");
    const { ctx, width, height, dpr } = drawingHelper.setupCanvas(canvas);
    if (!ctx) return;

    const count = data.quartileData2.numbers.length;
    const spacing = Math.min(width / 10, 40); // Scale spacing, max 30
    const startX = width / 2 - (spacing * (count - 1) / 2); // Center the 8 dots
    const startY = height / 2;

    drawingHelper.drawTitle(ctx, startX - spacing / 2.5, startY - spacing, data.quartileData2.title)

    for (let i = 0; i < 8; i++) {
        drawingHelper.drawDot(ctx,
            startX + i * spacing,
            startY,
            spacing / 2.5,
            data.quartileData2.numbers[i].toString(),
            data.colors.blue
        );
    }
    drawingHelper.drawDesc(ctx, startX * 1.7, startY + spacing, `Q₁ = ${data.quartileData2.q1}`, 12, data.colors.orange);
    drawingHelper.drawArrow(ctx, startX * 1.7, startY + spacing / 2, spacing / 3);
    drawingHelper.drawDesc(ctx, startX + spacing * 3.5, startY + spacing, `Q₂ = ${data.quartileData2.q2}`, 12, data.colors.green);
    drawingHelper.drawArrow(ctx, startX + spacing * 3.6, startY + spacing / 2, spacing / 3);
    drawingHelper.drawDesc(ctx, startX + spacing * 6, startY + spacing, `Q₃ = ${data.quartileData2.q3}`, 12, data.colors.red);
    drawingHelper.drawArrow(ctx, startX + spacing * 6.1, startY + spacing / 2, spacing / 3);
}
/*------------------------------------------------------------------------------------------------------------------------ */
//No diagram for mode now
/*------------------------------------------------------------------------------------------------------------------------ */
// Diagram for Quartile Range and Deviation

// add window. to make this function global
function drawQuartileRD() {
    const values = getInputData('quartilerange-data-input');
    // Copy and Sort datas
    const quartileRDSorted = values ? [...values].sort((a, b) => a - b) : [];

    if (quartileRDSorted.length < 4) return; // Need at least 4 values for quartiles

    //quartilesRD is called from notes_demos.js which is global and not module
    const { Q1, Q2, Q3 } = quartiles(quartileRDSorted);

    // Blank canvas sheet
    const canvas = document.getElementById("quartileRD-canvas");
    if (!canvas) return;
    const { ctx, width, height, dpr } = drawingHelper.setupCanvas(canvas, 0.3);
    if (!ctx) return;

    //Layout decision
    const margin = { left: 70, right: 70, top: width / 50, bottom: 60 };

    const axisY = height * 0.8; //axis at the bottom
    const dotY = axisY - height / 8; //dots slightly above
    const boxH = height * STYLE.boxHeightRatio; // Box height
    const boxY = dotY - boxH - height / 20;  // Box even higher

    //Mapping data to pixels
    const minX = Math.min(...quartileRDSorted); //minimum value of data
    const maxX = Math.max(...quartileRDSorted); //maximum value of data

    const range = maxX - minX;
    const pad = range === 0 ? Math.abs(maxX || 1) * 0.1 : range * 0.08 //Handles constant data
    const xMin = minX - pad;  // shift minimum value to the right
    const xMax = maxX + pad; // shift maximum value to the left 


    //Scaling the real data to css coordinates
    // function xScale(x) {
    //     const denom = (xMax - xMin) || 1;
    //     const t = (x - xMin) / denom; // ration of x position (normalized between 0 and 1)according to data domain
    //     return margin.left + t * (width - margin.left - margin.right); // return value of drawing width according to t ratio
    // }

    //Convert quartile values into pixel x positions
    const xQ1 = drawingHelper.xScale(Q1, xMin, xMax, width, margin.left, margin.right);
    const xQ2 = drawingHelper.xScale(Q2, xMin, xMax, width, margin.left, margin.right);
    const xQ3 = drawingHelper.xScale(Q3, xMin, xMax, width, margin.left, margin.right);

    //Render the diagram

    //Clear the canvas as canvas does not auto-clear.
    ctx.clearRect(0, 0, width, height);

    drawingHelper.drawTitle(ctx,
        width / 2,
        axisY - height / 2.5 - boxH,
        "Quartiles focus on the middle 50% (the “main body”) of the data",
        height / 13,
        "#111"
    );

    drawingHelper.drawDesc(ctx,
        xQ1,
        boxY - height / 10,
        `Q1 = ${Q1}`,
        height / 16,
        "#333"
    );

    drawingHelper.drawDesc(ctx,
        xQ2,
        boxY - height / 6.7,
        `Median = ${Q2}`,
        height / 16,
        "#333"
    );

    drawingHelper.drawDesc(
        ctx,
        xQ3,
        boxY - height / 10,
        `Q3 = ${Q3}`,
        height / 16,
        "#333"
    );

    drawingHelper.drawBox(
        ctx,
        xQ1,
        boxY,
        xQ3 - xQ1,
        boxH,
        height * STYLE.lineWidthRatio
    );

    // Draw middle line of box
    drawingHelper.drawLine(ctx,
        xQ2,
        boxY,
        xQ2,
        boxY + boxH,
        null,
        height * STYLE.lineWidthRatio,
        "rgba(30, 90, 200, 1)"
    );

    // Draw three dashed line at Q1, Q2, Q3
    drawingHelper.drawLine(ctx, xQ1, boxY - margin.top / 2, xQ1, axisY, [4, 6], 1, "#999");
    drawingHelper.drawLine(ctx, xQ2, boxY - margin.top / 2, xQ2, axisY, [4, 6], 1, "#999");
    drawingHelper.drawLine(ctx, xQ3, boxY - margin.top / 2, xQ3, axisY, [4, 6], 1, "#999");

    const brY = dotY + margin.top;
    //Horizontal bracket line
    drawingHelper.drawLine(ctx, xQ1, brY, xQ3, brY, null, 2, "rgba(30,90,200,1)");
    //right cap
    drawingHelper.drawLine(ctx, xQ3, brY - 8, xQ3, brY + 8, null, 2, "rgba(30,90,200,1)");
    //left cap
    drawingHelper.drawLine(ctx, xQ1, brY - 8, xQ1, brY + 8, null, 2, "rgba(30,90,200,1)");

    quartileRDSorted.forEach(v =>
        drawingHelper.drawDot(
            ctx,
            drawingHelper.xScale(v, xMin, xMax, width, margin.left, margin.right),
            dotY,
            height / 100,
            null,
            "red"
        )
    );

    drawingHelper.drawLine(
        ctx,
        margin.left,
        axisY,
        width - margin.right,
        axisY,
        null,
        height / 300,
        "#333"
    );

    drawingHelper.drawDesc(
        ctx,
        width / 2,
        axisY + height / 10,
        "Outliers can exist far away, but IQR stays focused on the central half.",
        height / 14,
        "#000000ff"
    );
};
/*------------------------------------------------------------------------------------------------------------------------ */
// BoxPlot diagram
function getOutliers(sortedValues, q1, q3) {
    const iqr = q3 - q1;

    // Calculate outlier boundaries
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    // Find outliers
    const outliers = sortedValues.filter(
        x => x < lowerFence || x > upperFence
    );

    // Filter out outliers for whisker calculation
    // const filtered = sortedValues.filter(x => !outliers.includes(x));
    //Better
    const outlierSet = new Set(outliers);
    const filtered = sortedValues.filter(
        x => !outlierSet.has(x)
    );

    // Find actual whiskers (excluding outliers)
    // Safe even if all values are classified as outliers
    const lowerWhisker =
        filtered.length > 0 ? filtered[0] : q1;

    const upperWhisker =
        filtered.length > 0 ? filtered[filtered.length - 1] : q3;


    return {
        outliers,
        lowerWhisker,
        upperWhisker
    };
};


function drawboxPlot() {
    const values = getInputData('boxPlot-data-input');
    const sortedBoxPlotValues = values ? [...values].sort((a, b) => a - b) : [];

    if (sortedBoxPlotValues.length < 4) return; // Need at least 4 values for quartiles

    //quartilesRD is called from notes_demos.js which is global and not module
    const { Q1, Q2, Q3 } = quartiles(sortedBoxPlotValues);
    const { outliers, lowerWhisker, upperWhisker } = getOutliers(sortedBoxPlotValues, Q1, Q3);


    // Blank canvas sheet
    const canvas = document.getElementById("boxPlot-canvas");
    if (!canvas) return;
    const { ctx, width, height, dpr } = drawingHelper.setupCanvas(canvas, 0.2);
    if (!ctx) return;


    const axisY = height * 0.75; //axis at the bottom
    const dotY = axisY - height / 20; //dots slightly above
    const boxH = height * STYLE.boxHeightRatio; // Box height
    const boxY = dotY - boxH - height / 20;  // Box even higher

    //Mapping data to pixels
    const minX = Math.min(...sortedBoxPlotValues); //minimum value of data
    const maxX = Math.max(...sortedBoxPlotValues); //maximum value of data

    const range = maxX - minX;
    const pad = range === 0 ? Math.abs(maxX || 1) * 0.1 : range * 0.08 //Handles constant data
    const xMin = minX - pad;  // extend domain to add visual padding
    const xMax = maxX + pad; // extend domain to add visual padding 

    //Layout decision
    const margin = { left: 70, right: 70, top: width / 50, bottom: 60, spacing: 10 };


    //Scaling the real data to css coordinates
    // function xScale(x) {
    //     const denom = (xMax - xMin) || 1;
    //     const t = (x - xMin) / denom; // ration of x position (normalized between 0 and 1)according to data domain
    //     return margin.left + t * (width - margin.left - margin.right); // return value of drawing width according to t ratio
    // }

    //Convert quartile values into pixel x positions
    const xQ1 = drawingHelper.xScale(Q1, xMin, xMax, width, margin.left, margin.right);
    const xQ2 = drawingHelper.xScale(Q2, xMin, xMax, width, margin.left, margin.right);
    const xQ3 = drawingHelper.xScale(Q3, xMin, xMax, width, margin.left, margin.right);
    const xDMin = drawingHelper.xScale(lowerWhisker, xMin, xMax, width, margin.left, margin.right);
    const xDMax = drawingHelper.xScale(upperWhisker, xMin, xMax, width, margin.left, margin.right);

    //Render the diagram

    //Clear the canvas as canvas does not auto-clear.
    ctx.clearRect(0, 0, width, height);

    drawingHelper.drawTitle(ctx,
        width / 2,
        axisY - height / 3 - boxH,
        outliers.length > 0
            ? "Outlier Detected! " + outliers.join(', ')
            : "No Outlier Detected!",
        height / 13,
        "#111"
    );

    drawingHelper.drawDesc(ctx,
        xQ1,
        boxY - width / 90,
        `Q1 = ${Q1}`,
        height / 16,
        "#333");
    drawingHelper.drawDesc(ctx,
        xQ2,
        boxY - width / 90 * 2,
        `Median = ${Q2}`,
        height / 16,
        "#333"
    );
    drawingHelper.drawDesc(
        ctx,
        xQ3,
        boxY - width / 90,
        `Q3 = ${Q3}`,
        height / 16,
        "#333"
    );

    drawingHelper.drawBox(
        ctx,
        xQ1,
        boxY,
        xQ3 - xQ1,
        boxH,
        height * STYLE.lineWidthRatio
    );

    // Draw middle line of box
    drawingHelper.drawLine(ctx,
        xQ2,
        boxY,
        xQ2,
        boxY + boxH,
        null,
        height * STYLE.lineWidthRatio,
        "rgba(30, 90, 200, 1)"
    );


    drawingHelper.drawWhiskerLine(
        ctx,
        xQ3,
        xDMax,
        xQ1,
        xDMin,
        boxY + boxH / 2,
        boxY + boxH - width / 70,
        boxY + width / 70,
        height * STYLE.lineWidthRatio,
        "rgba(30,90,200,1)"
    );

    //Add outlier description 
    outliers.forEach((x, i) =>
        drawingHelper.drawDesc(
            ctx,
            drawingHelper.xScale(x, xMin, xMax, width, margin.left, margin.right),
            boxY + boxH / 2 + i * height * 0.04,
            x,
            height / 15,
            "red"
        )
    );

    const outlierSet = new Set(outliers);

    //Plot the dot for each data value
    sortedBoxPlotValues.forEach(v =>
        drawingHelper.drawDot(
            ctx,
            drawingHelper.xScale(v, xMin, xMax, width, margin.left, margin.right),
            dotY,
            height / 100,
            null,
            outlierSet.has(v) ? "red" : "#444"
        )
    );

    drawingHelper.drawLine(
        ctx,
        margin.left,
        axisY,
        width - margin.right,
        axisY,
        null,
        height / 300,
        "#333"
    );

    // drawingHelper.drawDesc(
    //     ctx, 
    //     width / 2, 
    //     axisY + height/10, 
    //     "Outliers can exist far away, but IQR stays focused on the central half.", 
    //     height / 14, 
    //     "#000000ff"
    // );

    return {
        Q1, Q2, Q3,
        lowerWhisker,
        upperWhisker,
        outliers
    }; // return for later testing
};
/*------------------------------------------------------------------------------------------------------------------------ */
//Correlation Coefficient diagram
// let trendVisible = true;

// /* helpers */

// function correlation(x, y) {
//     const mx = mean(x), my = mean(y);
//     let num = 0, dx = 0, dy = 0;
//     for (let i = 0; i < x.length; i++) {
//         num += (x[i] - mx) * (y[i] - my);
//         dx += (x[i] - mx) ** 2;
//         dy += (y[i] - my) ** 2;
//     }
//     return num / Math.sqrt(dx * dy);
// }

// function strength(r) {
//     const a = Math.abs(r);
//     if (a > 0.8) return "Strong";
//     if (a > 0.5) return "Moderate";
//     if (a > 0.3) return "Weak";
//     return "Very weak / none";
// }

// /* plot */
// function generateScatterPlot() {
//     const x = document.getElementById("x-data").value.split(",").map(Number);
//     const y = document.getElementById("y-data").value.split(",").map(Number);
//     if (x.length !== y.length) return alert("X and Y must have same length");

//     resetPlot();

//     const plot = document.getElementById("scatter-plot-container");
//     const tooltip = document.getElementById("tooltip");

//     const xMin = Math.min(...x), xMax = Math.max(...x);
//     const yMin = Math.min(...y), yMax = Math.max(...y);

//     document.getElementById("x-ticks").innerHTML = `<span>${xMin}</span><span>${xMax}</span>`;
//     document.getElementById("y-ticks").innerHTML = `<span>${yMin}</span><span>${yMax}</span>`;

//     x.forEach((xi, i) => {
//         const dot = document.createElement("div");
//         dot.className = "data-point";

//         const xp = 50 + (xi - xMin) / (xMax - xMin) * 300;
//         const yp = 250 - (y[i] - yMin) / (yMax - yMin) * 200;

//         dot.style.left = xp + "px";
//         dot.style.top = yp + "px";

//         dot.onmouseenter = () => { tooltip.textContent = `(${xi}, ${y[i]})`; tooltip.style.opacity = 1; };
//         dot.onmousemove = e => { tooltip.style.left = e.pageX + "px"; tooltip.style.top = e.pageY + "px"; };
//         dot.onmouseleave = () => tooltip.style.opacity = 0;

//         plot.appendChild(dot);
//     });

//     const r = correlation(x, y);
//     plot.classList.add(r >= 0 ? "positive" : "negative");

//     document.getElementById("correlation-text").textContent =
//         `Correlation r = ${r.toFixed(2)} (${strength(r)})`;

//     drawTrendLine(x, y, xMin, xMax, yMin, yMax);
// }

// function drawTrendLine(x, y, xMin, xMax, yMin, yMax) {
//     const plot = document.getElementById("scatter-plot-container");
//     const mx = mean(x), my = mean(y);

//     let num = 0, den = 0;
//     for (let i = 0; i < x.length; i++) {
//         num += (x[i] - mx) * (y[i] - my);
//         den += (x[i] - mx) ** 2;
//     }
//     const slope = num / den;
//     const intercept = my - slope * mx;

//     const y1 = slope * xMin + intercept;
//     const y2 = slope * xMax + intercept;

//     const x1p = 50;
//     const x2p = 350;
//     const y1p = 250 - (y1 - yMin) / (yMax - yMin) * 200;
//     const y2p = 250 - (y2 - yMin) / (yMax - yMin) * 200;

//     const len = Math.hypot(x2p - x1p, y2p - y1p);
//     const angle = Math.atan2(y2p - y1p, x2p - x1p) * 180 / Math.PI;

//     const line = document.createElement("div");
//     line.className = "trend-line";
//     line.style.left = x1p + "px";
//     line.style.top = y1p + "px";
//     line.style.width = len + "px";
//     line.style.transform = `rotate(${angle}deg)`;

//     plot.appendChild(line);
// }

// /* controls */
// function toggleTrend() {
//     const l = document.querySelector(".trend-line");
//     if (!l) return;
//     trendVisible = !trendVisible;
//     l.style.display = trendVisible ? "block" : "none";
// }

// function randomData() {
//     let x = [], y = [];
//     for (let i = 1; i <= 10; i++) {
//         x.push(i);
//         y.push(Math.round(Math.random() * 10));
//     }
//     document.getElementById("x-data").value = x.join(",");
//     document.getElementById("y-data").value = y.join(",");
//     generateScatterPlot();
// }

// function resetPlot() {
//     const plot = document.getElementById("scatter-plot-container");
//     plot.className = "plot";
//     plot.innerHTML = `
//     <div class="grid"></div>
//     <div class="axis axis-x"></div>
//     <div class="axis axis-y"></div>
//     <div id="x-ticks" class="ticks x"></div>
//     <div id="y-ticks" class="ticks y"></div>`;
// }

let plotState = {
    ctx : null,
    canvas : null,
    xMin : 0, xMax : 0, yMin: 0, yMax : 0,
    xRange : 0, yRange : 0,
    x :[], y : [], 
    showTrend : true, 
    rValue: 0
};

//Generate scatter plot
export function generateScatterPlot() {
    const canvas = document.getElementById("plot");
    if (!canvas) {
        console.warn("Canvas 'plot' not found!");
        return;
    }

    const {ctx, width, height} = drawingHelper.setupCanvas(canvas);
    if (!ctx) return;

    let x, y;

    try {
        x = readNumericArray("x-data");
        y = readNumericArray("y-data");
    } catch (e) {
        console.warn(e.message);
    }

    if (!x || !y || x.length === 0 || y.length === 0) {
        console.warn ("No valid data");
        return;
    }

    if (x.length !== y.length) {
        alert("X and Y must have the same length!");
        return ;
    }

    const {xMin, xMax, yMin, yMax} = getBoundaryValue(x, y, 0);
    const xRange = xMax - xMin, yRange = yMax - yMin;
    if (xRange === 0 || yRange === 0 ) {
        alert("Need at least two different x and y values");
        return;
    }

    // Store state for redraw()
    plotState = {
        ctx, 
        canvas,
        height, width, 
        xMin, xMax, yMin, yMax,
        xRange, yRange,
        x, y,
        showTrend: true,
        rValue: correlation(x, y),
        marginLeft: 50,
        marginRight: 50,
        marginTop: 20,
        marginBottom: 40,
        color: "#000",
    };
    redraw();
}

export function redraw () {
    const { ctx,
        height, width,
        xMin, xMax, yMin, yMax,
        x, y,
        showTrend,
        rValue,
        marginLeft, marginRight, 
        marginTop, marginBottom 
    } = plotState;

    //Clear and draw background 
    drawingHelper.clear(ctx, height, width);
    drawingHelper.grid(ctx, 10, height, width, 2, 20, "#000");
    drawingHelper.axes(ctx, height, width, 25, 2, "#000");
    drawingHelper.ticks(ctx, xMin, xMax, yMin, yMax, 20, height, width, 15, "#000");

    const color = rValue >= 0 ? "#1f77b4" : "#e74c3c";
    
    drawingHelper.points( {
        ctx,
        xMin, xMax, yMin, yMax,
        xRange: xMax - xMin,
        yRange: yMin - yMax,
        marginLeft, marginRight, marginTop, marginBottom,
        x, y, color
    });

    //Draw trend line if enabled
    if (showTrend) {
        drawingHelper.trendLine({
            ctx,
            xMin, xMax, yMin, yMax,
            xRange: xMax - xMin,
            yRange: yMax - yMin,
            marginLeft, marginRight, marginTop, marginBottom,
            x, y, color,
            showTrend: true
        });
    }
    

    // document.getElementById("output").textContent = 
    //  `Correlation r = ${rValue.toFixed(2)} (${strength(rValue)})`;

}

function randomData() {
    let x = [], y = [];

    for (let i = 1; i <= 10; i++) {
        x.push(i);
        y.push(Math.round(Math.random() * 10));
    }

    readDivElement("x-data").value = x.join(",");
    readDivElement("y-data").value = y.join(",");
    generateScatterPlot();
}


function toggleTrend() {
    const l = document.querySelector(".trend-line");
    if (!l) return;

    trendVisible = !trendVisible;

    l.style.display = trendVisible ? "block" : "none";
}


function resetPlot() {

}


// if (xMax === xMin || yMax === yMin) {
//     alert("Need at least two different x values and two different Y values.");
//     return;
// }