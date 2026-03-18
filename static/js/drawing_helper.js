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

export function drawTitle(ctx, x, y, text, size = null, color = null) {
    ctx.save();
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    if (size !== null) {
        ctx.fillStyle = color;
    }
    if (size !== null) {
        ctx.font = `bold ${size}px Arial`;
    }
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
export function drawLine(ctx, x1, y1, x2, y2, dash = null, w = 1, color = "#888") {
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

export function drawWhiskerLine(ctx, xBoxLeft, xDMax, xBoxRight, xDMin, BoxCenterY, capT, capB, w, color = "blue" ) {
    //Right horizontal whiskers line
    drawLine(ctx, xBoxLeft, BoxCenterY, xDMax, BoxCenterY, null, w, color);
    //right cap
    drawLine(ctx, xDMax, capT, xDMax, capB, null, w, color);
    //Left horizontal whiskers line
    drawLine(ctx, xBoxRight, BoxCenterY, xDMin, BoxCenterY, null, w, color);
    //Left cap
    drawLine(ctx, xDMin, capT, xDMin, capB, null, w, color);
};

export function xScale(x, xMin, xMax, width, marginLeft, marginRight) {
    const denom = xMax - xMin;
    if (denom === 0) {
        throw new Error("Maximum X coordinate must not equal minimum X coordinate.");
    }

    const xRatio = (x - xMin) / denom;
    const clampedRatio = Math.min(Math.max(xRatio, 0), 1);

    return marginLeft + clampedRatio * (width - (marginLeft + marginRight));
}

export function yScale(y, yMin, yMax, height, marginTop, marginBottom) {
    const denom = yMax - yMin;
    if (denom === 0) {
        throw new Error("Maximum Y coordinate must not equal minimum Y coordinate.");
    }

    const yRatio = (y - yMin) / denom;
    const clampedRatio = Math.min(Math.max(yRatio, 0), 1);

    return height - marginBottom - clampedRatio * (height - (marginTop + marginBottom));
}

export function clear(ctx, width, height) {
    ctx.clearRect(0,0, width, height);
}

export function grid(ctx, width, height, padding, lineWidth, gridWidth, color) {
    if (gridWidth <= 0) {
        console.warn("Grid width must be greater than 0 to draw grid line");
        return;
    }

    ctx.save();

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    //Center grid inside padding area
    // const usableWidth = width - padding * 2;
    // const usableHeight = height - padding * 2;

    // const offsetX = padding + (usableWidth % gridWidth) / 2;
    // const offsetY = padding + (usableHeight % gridWidth ) / 2;

    
    
    //vertical lines
    for (let x = padding; x < width; x += gridWidth) {
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
    }

    //horizontal lines
    for (let y = padding; y < height; y += gridWidth) {
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    ctx.restore();     
}

// to draw the X and Y axes on the canvas
export function axes(ctx, height, width, padding, lineWidth, color) {
    ctx.save();

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    //X axis
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    //Y axis
    ctx.moveTo(padding , padding);
    ctx.lineTo(padding, height - padding);

    ctx.stroke();

    ctx.restore();
}

//to draw tick labels for the axes showing the min/max values on the X and Y axes
export function ticks(ctx, xmin, xmax, ymin, ymax, padding, height, width, size = 11, color = "#555")  {
    ctx.save();

    ctx.fillStyle = color;
    ctx.font = `${size} system-ui`;
    ctx.fillText(xmin, padding,  height - padding + size);
    ctx.fillText(xmax, width - padding - size, height - padding + size);
    ctx.fillText(ymax, padding - size, padding + size);
    ctx.fillText(ymin, padding - size, height - padding);

    ctx.restore();

}

export function points ({
        ctx,
        xMin, xMax, yMin, yMax,
        xRange, yRange,
        marginLeft, marginRight, 
        marginTop, marginBottom, 
        x, y, color
    }) {
    ctx.save();

    x.forEach((xi, i) => {
        const px = xScale(xi, xMin, xMax, xRange, marginLeft, marginRight);
        const py = yScale(y[i], yMin, yMax, yRange, marginTop, marginBottom);
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.restore();
}

export function trendLine({
        ctx,
        xMin, xMax, yMin, yMax,
        xRange, yRange,
        marginLeft, marginRight, 
        marginTop, marginBottom, 
        x, y, color,
        showTrend
    }) {
    ctx.save();
    
    if (!showTrend) return;

    const mx = mean(x), my = mean(y);
    // For measuring regression
    let num = 0, den = 0;
    for (let i=0; i < x.length; i++) {
        num += (x[i] - mx) * (y[i]-my);
        den += (x[i] - mx) ** 2;
    }
    const m = num / den;
    const b = my - m * mx; // y = mx + b;

    const y1 = m * xMin + b;
    const y2 = m * xMax + b;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xScale(xMin, xMin, xMax, xRange, marginLeft, marginRight), yScale(y1, yMin, yMax, yRange, marginTop, marginBottom));
    ctx.lineTo(xScale(xMax, xMin, xMax, xRange, marginLeft, marginRight), yScale(y2, yMin, yMax, yRange, marginTop, marginBottom));
    ctx.stroke();

    ctx.restore();
}