const STYLE = {
  colors: {
    normal: "#3498db",
    q1: "#e74c3c",
    q2: "#27ae60",
    q3: "#f39c12",
    title: "#2c3e50",
    text: "#ffffff"
  },
  box: {
    width: 36,
    height: 36,
    radius: 5,
    gap: 6
  }
};

function setupCanvas(canvas, aspect = 0.6) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    //Set the canvas BUFFER size (device pixels)
    canvas.width = rect.width * dpr;
    canvas.height = rect.width * aspect * dpr;

    canvas.style.height = rect.width * aspect + "px";
    //Change the drawing coordinate system
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    return ctx; //return drawing context for drawing in CSS pixels 
}

function drawDot(ctx, x, y, color = "#3498db", radius = 10) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawTitle(ctx, text, x, y) {
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 14px Arial";
    ctx.fillText (text, x, y);
}

function drawDesc(ctx, text, x, y) {
    ctx.fillStyle = "#666";
    ctx.font = "12px Arial";
    ctx.fillText(text, x, y)
}

function drawOddDiagram() {
    const canvas1 = document.getElementById("quartileCanvas3");
    // if (!canvas1) return; // Prevent error if canvas not found
    // const ctx = canvas.getContext("2d");
    // if (!ctx) return;
    const ctx = setupCanvas(canvas1);

    
    const spacing = Math.min(canvas1.width / 10, 30); // Scale spacing, max 30
    const startX = canvas1.width / 2 - (spacing * 5) / 2; // Center the 5 dots
    const startY = canvas1.height / 2;
    

    drawTitle(ctx, "Odd Number of Data", startX, 40);

    for (let i = 0; i < 6; i++) {
        const isCenter = i === 2;
        drawDot(ctx,
            startX + i * spacing,
            startY, 
            isCenter ? "#e74c3c" : "#3498db",
            isCenter ? 12 : 10
        );
    }

    // Draw arrow and description once, outside the loop
    
    drawDesc(ctx, "Median (position (5+1)/2 = 3)", startX, canvas1.height - 80);
    drawArrow(ctx, startX + 2 * spacing, startY + 30);
}

window.addEventListener("DOMContentLoaded", drawOddDiagram)




function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}
function drawQuartileDiagram(ctx, data) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // ---- Title ----
    ctx.fillStyle = STYLE.colors.title;
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.title, ctx.canvas.width / 2, 25);

    // ---- Boxes ----
    const startY = 50;
    const totalWidth =
        data.numbers.length * STYLE.box.width +
        (data.numbers.length - 1) * STYLE.box.gap;

    let startX = (ctx.canvas.width - totalWidth) / 2;

    data.numbers.forEach((n, i) => {
        let color = STYLE.colors.normal;
        if (n === data.q1) color = STYLE.colors.q1;
        if (n === data.q2) color = STYLE.colors.q2;
        if (n === data.q3) color = STYLE.colors.q3;

        const x = startX + i * (STYLE.box.width + STYLE.box.gap);
        const y = startY;

        ctx.fillStyle = color;
        roundRect(ctx, x, y, STYLE.box.width, STYLE.box.height, STYLE.box.radius);

        ctx.fillStyle = STYLE.colors.text;
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n, x + STYLE.box.width / 2, y + STYLE.box.height / 2);
    });

    // ---- Quartile labels ----
    const labelY = startY + STYLE.box.height + 30;
    ctx.font = "bold 13px sans-serif";

    ctx.fillStyle = STYLE.colors.q1;
    ctx.fillText(`Q₁ = ${data.q1}`, ctx.canvas.width * 0.25, labelY);

    ctx.fillStyle = STYLE.colors.q2;
    ctx.fillText(`Q₂ = ${data.q2}`, ctx.canvas.width * 0.5, labelY);

    ctx.fillStyle = STYLE.colors.q3;
    ctx.fillText(`Q₃ = ${data.q3}`, ctx.canvas.width * 0.75, labelY);
}
const data1 = {
    title: "When data size is 9",
    numbers: [2, 6, 8, 9, 13, 16, 19, 21, 29],
    q1: 9,
    q2: 16,
    q3: 21
};

const data2 = {
    title: "When data size is 8",
    numbers: [2, 6, 8, 9, 13, 16, 19, 21],
    q1: 9,
    q2: 14.5,
    q3: 19
};

const canvas1 = document.getElementById("quartileCanvas1");
const canvas2 = document.getElementById("quartileCanvas2");

const ctx1 = setupCanvas(canvas1);
const ctx2 = setupCanvas(canvas2);

drawQuartileDiagram(ctx1, data1);
drawQuartileDiagram(ctx2, data2);

window.addEventListener("resize", () => {
    drawQuartileDiagram(setupCanvas(canvas1), data1);
    drawQuartileDiagram(setupCanvas(canvas2), data2);
});

