export function setupCanvas(canvas, aspect = 0.6) {
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    return {
        ctx,
        width: logicalWidth,
        height: logicalHeight,
        dpr
    }; //return drawing context for drawing in CSS pixels 
}

export function drawDot(ctx, x, y, radius = 10, text = null, color = "#3498db" ) {
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
}

export function drawTitle(ctx, x, y, text) {
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 14px Arial";
    ctx.fillText(text, x, y);
}

export function drawDesc(ctx, x, y, text, color = null) {
    ctx.fillStyle = color !== null ? color : "#000000ff";
    ctx.font = "12px Arial";
    ctx.fillText(text, x, y);
}

export function drawArrow(ctx, x, y, fontSize = null,) {
    ctx.fillStyle = "#e74c3c";
    ctx.font = fontSize !== null ? fontSize + "px Arial" : "14px Arial";
    ctx.fillText("↑", x - 6, y);
}