import * as drawingHelper from './drawing_helper.js';
import * as data from './note_data.js';

window.addEventListener('resize', () => {
    // Redraw diagrams after resize
    drawQuartileRD();
    drawOddDataMedian();
    drawEvenDataMedian();
    drawOddDataQuartile();
    drawEvenDataQuartile();
});

// put inside for ensuring loading after DOMloaded
document.addEventListener("DOMContentLoaded", () => {
    // Initialize with default data
    calculateQuartileRD();

    //function in this js file
    drawQuartileRD();
    drawEvenDataMedian();// test to delete eventlistener????
    drawOddDataMedian();// test to delete eventlistener?????
    drawOddDataQuartile();
    drawEvenDataQuartile();

    const drawQuartileRDBtn = document.getElementById("draw-quartileRD-btn");

    if (!drawQuartileRDBtn) {
        console.warn("drawQuartileRDBtn not found");
        return;
    }

    if (drawQuartileRDBtn) {
        drawQuartileRDBtn.addEventListener("click", () => {
            calculateQuartileRD();
            drawQuartileRD();
        });
    }

});




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
function getInputData() {
    const inputElement = document.getElementById('quartilerange-data-input');
    if (!inputElement) return;
    const input = inputElement.value;
    if (!input) return;  // Only check if empty
    const values = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
    if (values.length < 4) return; // Check number of valid numbers
    return values;
};

// add window. to make this function global
function drawQuartileRD() {
    const values = getInputData();
    // Copy and Sort datas
    const quartileRDSorted = values ? [...values].sort((a, b) => a - b) : [];

    if (quartileRDSorted.length < 4) return; // Need at least 4 values for quartiles

    //quartilesRD is called from notes_demos.js which is global and not module
    const { Q1, Q2, Q3 } = quartilesRD(quartileRDSorted);

    const IQR = Q3 - Q1;
    const quartileDeviation = IQR / 2;

    // Blank canvas sheet
    const canvas = document.getElementById("quartileRD-canvas");
    if (!canvas) return;
    const { ctx, width, height, dpr } = drawingHelper.setupCanvas(canvas, 0.3);
    if (!ctx) return;

    //Layout decision
    const margin = { left: 70, right: 70, top: width / 50, bottom: 60 };

    const axisY = 190; //axis at the bottom
    const dotY = 150; //dots slightly above
    const boxY = 95;  // Box even higher
    const boxH = 45; // Box height

    //Mapping data to pixels
    const minX = Math.min(...quartileRDSorted); //minimum value of data
    const maxX = Math.max(...quartileRDSorted); //maximum value of data

    const pad = (maxX - minX) * 0.08 || 1;
    const xMin = minX - pad;  // shift minimum value to the right
    const xMax = maxX + pad; // shift maximum value to the left 


    //Scaling the real data to css coordinates
    function xScale(x) {
        const denom = (xMax - xMin) || 1;
        const t = (x - xMin) / denom; // ration of x position (normalized between 0 and 1)according to data domain
        return margin.left + t * (width - margin.left - margin.right); // return value of drawing width according to t ratio
    }

    //Render the diagram

    //Clear the canvas as canvas does not auto-clear.
    ctx.clearRect(0, 0, width, height);

    drawingHelper.drawDesc(ctx, width / 2, 20, "Quartiles focus on the middle 50% (the “main body”) of the data", 18, "#111");

    drawingHelper.line(ctx, margin.left, axisY, width - margin.right, axisY, null, 2, "#333");

    //Plot the dot for each data value
    quartileRDSorted.forEach(v => drawingHelper.drawDot(ctx, xScale(v), dotY, 1, null, "red"));

    //Convert quartile values into pixel x positions
    const xQ1 = xScale(Q1);
    const xQ2 = xScale(Q2);
    const xQ3 = xScale(Q3);

    drawingHelper.line(ctx, xQ1, boxY, xQ1, axisY, [4, 6], 1, "#999");
    drawingHelper.line(ctx, xQ2, boxY, xQ2, axisY, [4, 6], 1, "#999");
    drawingHelper.line(ctx, xQ3, boxY, xQ3, axisY, [4, 6], 1, "#999");

    drawingHelper.drawBox(ctx, xQ1, boxY, xQ3 - xQ1, boxH);

    drawingHelper.line(ctx, xQ2, boxY, xQ2, boxY + boxH, null, 3, "rgba(30, 90, 200, 1)");

    drawingHelper.drawDesc(ctx, xQ1, boxY - margin.top, `Q1 = ${Q1}`, 14, "#333");
    drawingHelper.drawDesc(ctx, xQ2, boxY - margin.top * 2, `Median = ${Q2}`, 14, "#333");
    drawingHelper.drawDesc(ctx, xQ3, boxY - margin.top, `Q3 = ${Q3}`, 14, "#333");

    const brY = dotY + margin.top;
    //Horizontal bracket line
    drawingHelper.line(ctx, xQ1, brY, xQ3, brY, null, 2, "rgba(30,90,200,1)");
    //left cap
    drawingHelper.line(ctx, xQ3, brY - 8, xQ3, brY + 8, null, 2, "rgba(30,90,200,1)");
    //right cap
    drawingHelper.line(ctx, xQ1, brY - 8, xQ1, brY + 8, null, 2, "rgba(30,90,200,1)");

    drawingHelper.drawDesc(ctx, ctx, width / 2, axisY + 35, "Outliers can exist far away, but IQR stays focused on the central half.", 13, "#666");
};
/*------------------------------------------------------------------------------------------------------------------------ */
