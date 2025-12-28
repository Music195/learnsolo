export function setupCanvas(canvas, aspect = 0.6) {
    if (!canvas) throw new Error("Canvas element not found");
    const ctx = canvas.getContext("2d");
    // Get the device pixel ratio
    const dpr = window.devicePixelRatio || 1;

    // CSS size (logical pixels) /coordinates
    const rect = canvas.getBoundingClientRect();
    const logicalWidth = rect.width;
    const logicalHeight = rect.width * aspect;//Define my own css height related to css width

    // BUFFER size (device pixels) /coordinates
    canvas.width = Math.round(logicalWidth * dpr);
    canvas.height = Math.round(logicalHeight * dpr);

    // Match CSS height to logical height
    canvas.style.height = logicalHeight + "px";

    // Map logical pixels to buffer pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);//  Draw using css coordinates but transform to device coordinates
    ctx.imageSmoothingEnabled = false;

    return {
        ctx,
        width: logicalWidth,
        height: logicalHeight,
        dpr
    }; //return drawing context for drawing in CSS pixels 
}

export function drawDot(ctx, x, y, radius = 10, text = null, color = "#3498db") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill()

    if (text !== null) {
        ctx.fillStyle = "#ffffff"; // White text for contrast
        ctx.font = `${Math.floor(radius * 0.8)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x, y);
    }
    ctx.restore();
}

export function drawTitle(ctx, x, y, text) {
    ctx.save();
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 14px Arial";
    ctx.fillText(text, x, y);
    ctx.restore();
}

export function drawDesc(ctx, x, y, text, size = 14, color = null) {
    ctx.save();
    ctx.fillStyle = color !== null ? color : "#000000ff";
    ctx.font = `${size}px system-ui, Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
    ctx.restore();
}

export function drawArrow(ctx, x, y, fontSize = null,) {
    ctx.save();
    ctx.fillStyle = "#e74c3c";
    ctx.font = fontSize !== null ? fontSize + "px Arial" : "14px Arial";
    ctx.fillText("↑", x - 6, y);
    ctx.restore();
}

//Reusalble dashed lines
export function line(ctx, x1, y1, x2, y2, dash = null, w = 1, color = "#888") {
    ctx.save();
    if (dash !== null) {
        ctx.setLineDash(dash);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

export function drawBox(ctx, x, y, w, h, lw = 2) {
    ctx.save();
    ctx.fillStyle = "rgba(100,160,255,0.35)";
    ctx.strokeStyle = "rgba(30,90,200,1)";
    ctx.lineWidth = lw;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
}