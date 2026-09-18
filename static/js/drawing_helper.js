function setupCanvas(canvas, aspect = 0.6) {
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

function drawDot(ctx, x, y, radius = 10, text = null, color = "#3498db") {
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

function drawTitle(ctx, x, y, text, size = null, color = null) {
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

function drawDesc(ctx, x, y, text, size = 14, color = null) {
    ctx.save();
    ctx.fillStyle = color !== null ? color : "#000000ff";
    ctx.font = `${size}px system-ui, Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawArrow(ctx, x, y, fontSize = null,) {
    ctx.save();
    ctx.fillStyle = "#e74c3c";
    ctx.font = fontSize !== null ? fontSize + "px Arial" : "14px Arial";
    ctx.fillText("↑", x - 6, y);
    ctx.restore();
}

//Reusalble dashed lines
function drawLine(ctx, x1, y1, x2, y2, dash = null, w = 1, color = "#888") {
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

function drawBox(ctx, x, y, w, h, lw = 2) {
    ctx.save();
    ctx.fillStyle = "rgba(100,160,255,0.35)";
    ctx.strokeStyle = "rgba(30,90,200,1)";
    ctx.lineWidth = lw;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
}

function drawWhiskerLine(ctx, xBoxLeft, xDMax, xBoxRight, xDMin, BoxCenterY, capT, capB, w, color = "blue" ) {
    //Right horizontal whiskers line
    drawLine(ctx, xBoxLeft, BoxCenterY, xDMax, BoxCenterY, null, w, color);
    //right cap
    drawLine(ctx, xDMax, capT, xDMax, capB, null, w, color);
    //Left horizontal whiskers line
    drawLine(ctx, xBoxRight, BoxCenterY, xDMin, BoxCenterY, null, w, color);
    //Left cap
    drawLine(ctx, xDMin, capT, xDMin, capB, null, w, color);
};

function xScale(x, xMin, xMax, width, marginLeft, marginRight) {
    const denom = xMax - xMin;
    if (denom === 0) {
        throw new Error("Maximum X coordinate must not equal minimum X coordinate.");
    }

    const xRatio = (x - xMin) / denom;
    const clampedRatio = Math.min(Math.max(xRatio, 0), 1);

    return marginLeft + clampedRatio * (width - (marginLeft + marginRight));
}

function yScale(y, yMin, yMax, height, marginTop, marginBottom) {
    const denom = yMax - yMin;
    if (denom === 0) {
        throw new Error("Maximum Y coordinate must not equal minimum Y coordinate.");
    }

    const yRatio = (y - yMin) / denom;
    const clampedRatio = Math.min(Math.max(yRatio, 0), 1);

    return height - marginBottom - clampedRatio * (height - (marginTop + marginBottom));
}

function clear(ctx, width, height) {
    ctx.clearRect(0,0, width, height);
}

function grid(ctx, width, height, padding, lineWidth, gridWidth, color) {
    if (gridWidth <= 0) {
        console.warn("Grid width must be greater than 0 to draw grid line");
        return;
    }

    ctx.save();

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
 
    
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
function axes(ctx, height, width, padding, lineWidth, color) {
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
function ticks() {
    ctx.fillStyle = "#555";
    ctx.font = "11px system-ui";

    const divisions = 5;

    for (let i = 0; i <= divisions; i++) {

        const xValue = xmin + (xmax - xmin) * i / divisions;
        const x = map(xValue, xmin, xmax, PAD, W - PAD);

        ctx.fillText(
            xValue.toFixed(1),
            x - 8,
            H - PAD + 15
        );
    }

    for (let i = 0; i <= divisions; i++) {

        const yValue = ymin + (ymax - ymin) * i / divisions;
        const y = map(yValue, ymin, ymax, H - PAD, PAD);

        ctx.fillText(
            yValue.toFixed(1),
            PAD - 30,
            y + 4
        );
    }
}

function points ({
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

function trendLine({
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



//computing mean
function mean(values) {
    const n = values.length;

    //safety check: mean is undefined for empty data;
    if (n === 0) return NaN;

    const sum = values.reduce(
        (sum, value) => sum + value,
        0
    ); // add all value until 0
    const mean = sum / n;

    return mean;
};

//Reusable function

// Median function 
function median(sortedValues) {
    const n = sortedValues.length;
    const mid = Math.floor(n / 2); // rounding down to the nearest integer
    return (n % 2 === 0)
        ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
        : sortedValues[mid];
};

//computing qurtiles conceptually using median function
function quartiles(sortedValues) {
    const n = sortedValues.length;
    const mid = Math.floor(n / 2);

    const lower = sortedValues.slice(0, mid);
    const upper = (n % 2 === 0) ? sortedValues.slice(mid) : sortedValues.slice(mid + 1);

    return {
        Q1: median(lower),
        Q2: median(sortedValues),
        Q3: median(upper)
    };
};



//computing mode
function mode(values) {
    if (values.length === 0) {
        return { frequencyMap: new Map(), maxFreq: 0, modes: [] };
    }

    const freq = new Map(); // Map store key data value pair

    values.forEach(v => {
        freq.set(v, (freq.get(v) || 0) + 1);
    });

    const maxFreq = Math.max(...freq.values());

    if (maxFreq === 1) {
        return { frequencyMap: freq, maxFreq, modes: [] };
    };

    const modes = [...freq.entries()]             //convert map to array
        .filter(([_, count]) => count === maxFreq)    //Keep only values that appear most often
        .map(([value]) => value)                      //Extract just the value (ignore count)
        .sort((a, b) => a - b);

    return { frequencyMap: freq, maxFreq, modes };

};

//computing total sum
function totalSum(values) {
    const totalSum = values.reduce(
        (sum, value) => sum + value,
        0
    );
    return totalSum;
};

//computing population variance
function populationVariance(values, mean) {
    const n = values.length;
    // Variance is undefined for empty data
    if (n === 0) return NaN;

    const sumSquaredDeviations = values.reduce(
        (sum, value) => sum + Math.pow(value - mean, 2),
        0
    );
    // Population variance = average of squared deviations
    return sumSquaredDeviations / n;
};

//computing sample variance
function sampleVariance(values, mean) {
    const n = values.length;
    if (n < 2) return NaN;

    const sumSquaredDeviations = values.reduce(
        (sum, value) => sum + (value - mean) ** 2,
        0
    );

    return sumSquaredDeviations / (n - 1);
}

//computing correlation
function correlation (x, y) {
    const mx = mean(x), my = mean(y);
    let sxy = 0, sx = 0, sy = 0;

    for (let i = 0; i < x.length; i++) {
        sxy += (x[i] - mx) * (y[i] - my);
        sx += (x[i] - mx) ** 2;
        sy += (y[i] - my) ** 2;
    }

    let strength;

    if (sx === 0 || sy === 0) {
        return { strength: "undefined", r: NaN };
    }

    const r = sxy / Math.sqrt(sx * sy);
    const a = Math.abs(r);

    if (a > 0.8) strength = "Strong";
    else if (a > 0.5) strength = "Moderate";
    else if (a > 0.3) strength = "Weak";
    else strength = "Very weak or None";

    return {strength, r };
}

// Checking string
function readStr(id, allowed = null) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`${id} not found`);

    const value = String(el.value).trim().toLowerCase();
    if (!value) throw new Error(`${id} is empty`);

    if (allowed && !allowed.includes(value)) {
        throw new Error(`${id} must be one of: ${allowed.join(", ")}`);
    }

    return value;
}

// Checking numeric array 
function readNumericArray(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`${id} not found`);
    if (!el.value.trim()) throw new Error(`${id} is empty`);

    const arr = el.value
        .split(",")
        .map(v => Number(v.trim()))
        .filter(v => !Number.isNaN(v));

    if (arr.length ===0) {
        throw new Error(`${id} contains no valid numbers`);
    }

    return arr;
}

// Checking div element
function readDivElement (id) {
    const el = document.getElementById(id);
    if(!el) throw new Error (`${id} not found`);
    return el;
}

//to get the maximum and minimum value of x and y 
function getBoundaryValue (x, y, paddingRatio = 0.05) {
    if (!x.length || !y.length) {
        throw new Error("Array must not be empty");
    }

    const xmin = Math.min(...x);
    const xmax = Math.max(...x);
    const ymin = Math.min(...y);
    const ymax = Math.max(...y);

    const xRange = xmax - xmin;
    const yRange = ymax - ymin;

    return {
        xmin: xmin - xRange * paddingRatio,
        xmax: xmax - xRange * paddingRatio,
        ymin: ymin - yRange * paddingRatio,
        ymax: ymax - yRange * paddingRatio
    };
}