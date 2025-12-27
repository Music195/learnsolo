import * as drawingHelper from './drawing_helper.js';
import * as data from './note_data.js';

window.addEventListener('resize', () => {
    // Redraw diagrams after resize
    drawOddDataMedian();
    drawEvenDataMedian();
    drawOddDataQuartile();
    drawEvenDataQuartile();
});

drawEvenDataMedian();// test to delete eventlistener????
drawOddDataMedian();// test to delete eventlistener?????
drawOddDataQuartile();
drawEvenDataQuartile();



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
    drawingHelper.drawDesc(ctx, startX + spacing * 1.5, startY + spacing, `Q₁ = ${data.quartileData1.q1}`, data.colors.orange);
    drawingHelper.drawArrow(ctx, startX * 2.7, startY + spacing / 2, spacing / 3);
    drawingHelper.drawDesc(ctx, startX + spacing * 4, startY + spacing, `Q₂ = ${data.quartileData1.q2}`, data.colors.green);
    drawingHelper.drawArrow(ctx, startX + spacing * 4.2, startY + spacing / 2, spacing / 3);
    drawingHelper.drawDesc(ctx, startX + spacing * 6.5, startY + spacing, `Q₃ = ${data.quartileData1.q3}`, data.colors.red);
    drawingHelper.drawArrow(ctx, startX + spacing * 6.7, startY + spacing / 2, spacing / 3);
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
    drawingHelper.drawDesc(ctx, startX * 1.7, startY + spacing, `Q₁ = ${data.quartileData2.q1}`, data.colors.orange);
    drawingHelper.drawArrow(ctx, startX * 1.8, startY + spacing / 2, spacing / 3);
    drawingHelper.drawDesc(ctx, startX + spacing * 3.5, startY + spacing, `Q₂ = ${data.quartileData2.q2}`, data.colors.green);
    drawingHelper.drawArrow(ctx, startX + spacing * 3.7, startY + spacing / 2, spacing / 3);
    drawingHelper.drawDesc(ctx, startX + spacing * 6, startY + spacing, `Q₃ = ${data.quartileData2.q3}`, data.colors.red);
    drawingHelper.drawArrow(ctx, startX + spacing * 6.2, startY + spacing / 2, spacing / 3);
}
