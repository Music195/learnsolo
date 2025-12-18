
window.addEventListener('resize', () => {
    resizeCanvas();
    // Redraw diagrams after resize
    drawOddDiagram();
    drawEvenDiagram();
});
window.addEventListener('DOMContentLoaded', resizeCanvas);

// Canvas resize for responsiveness
function resizeCanvas() {
    const canvases = ['median-canvas1', 'median-canvas2'];
    canvases.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetWidth * 0.75; // Maintain aspect ratio
        }
    });
}


//-------- Helpers ----------
function drawDot(ctx, x, y, color = "#3498db", radius = 10) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawArrow(ctx, x, y) {
    ctx.fillStyle = "#e74c3c";
    ctx.font = "24px Arial";
    ctx.fillText("↑", x-6, y);
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

// ---Odd Median Data Diagram----
function drawOddDiagram() {
    const canvas = document.getElementById("median-canvas1");
    if (!canvas) return; // Prevent error if canvas not found
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const spacing = Math.min(canvas.width / 10, 30); // Scale spacing, max 30
    const startX = canvas.width / 2 - (spacing * 5) / 2; // Center the 5 dots
    const startY = canvas.height / 2;
    

    drawTitle(ctx, "Odd Number of Data", startX, 40);

    for (let i = 0; i < 5; i++) {
        const isCenter = i === 2;
        drawDot(ctx,
            startX + i * spacing,
            startY, 
            isCenter ? "#e74c3c" : "#3498db",
            isCenter ? 12 : 10
        );
    }

    // Draw arrow and description once, outside the loop
    
    drawDesc(ctx, "Median (position (5+1)/2 = 3)", startX, canvas.height - 80);
    drawArrow(ctx, startX + 2 * spacing, startY + 30);
}

window.addEventListener("DOMContentLoaded", drawOddDiagram);

// Draw even data Median Diagram
function drawEvenDiagram() {
    const canvas = document.getElementById("median-canvas2");
    if (!canvas) return; // Prevent error if canvas not found
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const spacing = Math.min(canvas.width / 10, 30); // Scale spacing, max 30
    const startX = canvas.width / 2 - (spacing * 6) / 2; // Center the 6 dots
    const startY = canvas.height / 2;

    drawTitle(ctx, "Even Number of Data", startX, 40);

    for (let i = 0; i < 6; i++) {
        const isCenter = i === 2 || i === 3;
        drawDot(ctx,
            startX + i * spacing,
            startY,
            isCenter ? "#e74c3c" : "#3498db",
            isCenter ? 12 : 10
        );
    }

    drawArrow(ctx, startX + 2.5 * spacing, startY + 30);
    drawDesc(ctx, "Median (positions at n/2 and n/2 + 1)", startX, canvas.height - 80);
}
window.addEventListener("DOMContentLoaded", drawEvenDiagram);