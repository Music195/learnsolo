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
};

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












// Mean Demo 
function calculateMean() {
    let values;
    try {
        values = readNumericArray('mean-data-input');
    } catch (e) {
        console.warn (e.message);
        return;
    }
    

    if (values.length === 0) {
        alert('Please enter valid numbers separated by commas.');
        return;
    }

    const sortedMeanValues = [...values].sort((a, b) => a - b);

    const sum = totalSum(sortedMeanValues);
    const calculatedMean = mean(sortedMeanValues);
    const variance = populationVariance(sortedMeanValues, calculatedMean);

    // Update visualization
    updateMeanViz(sortedMeanValues);

    // Update output
    let output;
    
    try {
        output = readDivElement('mean-demo-output');
    } catch (e) {
        console.warn(e.message);
        return;
    }
    output.innerHTML =
        `  <div class="summary">
            <div class="item highlight">
               <div class="value">${calculatedMean.toFixed(2)}</div>
               <div class="label">Mean</div>
            </div>
            <div class="item">
               <div class="value">${sum.toFixed(2)}</div>
               <div class="label">Total Sum</div>
            </div>
            <div class="item">
               <div class="value">${sortedMeanValues.length}</div>
               <div class="label">Data Points</div>
            </div>
            <div class="item">
               <div class="value">${variance.toFixed(2)}</div>
               <div class="label">Variance</div>
            </div>
         </div>
      `;

    // Re-render MathJax
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([output]);
    }
};

function updateMeanViz(sortedMeanValues) {
    let container;
    try {
        container = readDivElement('sorted-mean-data');
    } catch (e) {
        console.warn(e.message);
        return;
    };
    // Clear previous points
    container.innerHTML = '';


    // Create data points
    sortedMeanValues.forEach((value, index) => {
        const point = document.createElement('div');
        point.className = 'data-point';
        point.textContent = value;
        // point.style.left = `${index * 60 + 20}px`;
        // point.style.top = `${100 - value * 5}px`;
        container.appendChild(point);
    });
};

// Initialize with default data
window.addEventListener('DOMContentLoaded', calculateMean);

/* ------------------------------------------------------------------------------------ */
// Median Demo
function calculateMedian() {
    
    let values;
    try {
        values = readNumericArray('median-data-input');
    } catch (e) {
        console.warn (e.message);
        return;
    }

    if (values.length === 0) {
        alert('Please enter valid numbers separated by commas.');
        return;
    }

    // Sort the values
    const sortedMedianValues = [...values].sort((a, b) => a - b);
    let median;

    if (sortedMedianValues.length % 2 === 1) {
        // Odd number of values
        const medianIndex = Math.floor(sortedMedianValues.length / 2);
        median = sortedMedianValues[medianIndex];
    } else {
        // Even number of values
        const mid1 = sortedMedianValues[sortedMedianValues.length / 2 - 1];
        const mid2 = sortedMedianValues[sortedMedianValues.length / 2];
        median = (mid1 + mid2) / 2;
    }

    // Update visualization
    updateMedianViz(sortedMedianValues);

    // Update output
    let output;
    
    try {
        output = readDivElement('median-demo-output');
    } catch (e) {
        console.warn(e.message);
        return;
    }
    
    const isEven = sortedMedianValues.length % 2 === 0;
    const medianDesc = isEven
        ? `${sortedMedianValues.length / 2}rd and ${sortedMedianValues.length / 2 + 1}th values`
        : `${Math.floor(sortedMedianValues.length / 2) + 1}th value`;

    output.innerHTML = `
            <div class="summary">
                <div class="item highlight">
                <div class="value">${median}</div>
                <div class="label">Mean</div>
                </div>
                <div class="item">
                <div class="value">${medianDesc}</div>
                <div class="label">Median position</div>
                </div>
                <div class="item">
                <div class="value">${sortedMedianValues.length} (${isEven ? 'even' : 'odd'})</div>
                <div class="label">Data Points</div>
                </div>
            </div>`;

    // Re-render MathJax
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([output]);
    }
};

function updateMedianViz(sortedMedianValues) {
    let container;
    try {
        container = readDivElement('sorted-median-data');
    } catch (e) {
        console.warn(e.message);
        return;
    };

    // Clear previous content
    container.innerHTML = '';

    // Create data value elements
    sortedMedianValues.forEach((value, index) => {
        const valueElement = document.createElement('div');
        valueElement.className = 'data-point';
        valueElement.textContent = value;

        // Highlight median values
        if (sortedMedianValues.length % 2 === 1) {
            // Odd case - single median
            if (index === Math.floor(sortedMedianValues.length / 2)) {
                valueElement.classList.add('highlight');
            }
        } else {
            // Even case - two middle values
            if (index === sortedMedianValues.length / 2 - 1 || index === sortedMedianValues.length / 2) {
                valueElement.classList.add('highlight');
            }
        }

        container.appendChild(valueElement);
    });
};

// Initialize with default data
window.addEventListener('DOMContentLoaded', calculateMedian);
/* ------------------------------------------------------------------------------------ */
//Quartiles Demo
function calculateQuartiles() {
    
    let values;
    try {
        values = readNumericArray('quartile-data-input');
    } catch (e) {
        console.warn (e.message);
        return;
    }

    if (values.length < 4) {
        alert('Please enter at least 4 values to calculate quartiles.');
        return;
    }

    // Sort the values
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    // Calculate quartile positions
    const q1Pos = (n + 1) / 4;
    const q3Pos = 3 * (n + 1) / 4;

    // Calculate quartiles
    let q1, q2, q3;

    if (n % 2 === 1) {
        // Odd number of values
        q2 = sorted[Math.floor(n / 2)];
        q1 = getQuartileValue(sorted, q1Pos);
        q3 = getQuartileValue(sorted, q3Pos);
    } else {
        // Even number of values
        q2 = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        q1 = getQuartileValue(sorted, q1Pos);
        q3 = getQuartileValue(sorted, q3Pos);
    }

    const iqr = q3 - q1;

    // Update visualization
    updateQuartileViz(sorted);

    // Update output
    let output;
    
    try {
        output = readDivElement('quartile-demo-output');
    } catch (e) {
        console.warn(e.message);
        return;
    }

    output.innerHTML = `
                    <div class="summary">
                    <div class="item">
                        <div class="value">${q1}</div>
                        <div class="label">Q₁</div>
                    </div>
                    <div class="item">
                        <div class="value">${q2}</div>
                        <div class="label">Q₂ (Median)</div>
                    </div>
                    <div class="item">
                        <div class="value">${q3}</div>
                        <div class="label">Q₃</div>
                    </div>
                    <div class="item">
                        <div class="value">${iqr.toFixed(1)}</div>
                        <div class="label">IQR</div>
                    </div>
                    </div>`;

    // Re-render MathJax
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([output]);
    }
};

// can remove later 
function getQuartileValue(sorted, position) {
    const n = sorted.length;
    const lowerIndex = Math.floor(position) - 1; // Convert to 0-based index
    const upperIndex = Math.ceil(position) - 1; // Convert to 0-based index

    if (lowerIndex === upperIndex) {
        return sorted[lowerIndex];
    } else {
        const lowerValue = sorted[lowerIndex];
        const upperValue = sorted[upperIndex];
        const fraction = position - Math.floor(position);
        return lowerValue + fraction * (upperValue - lowerValue);
    }
};

function updateQuartileViz(sorted) {

    let container;
    try {
        container = readDivElement('sorted-quartile-data');
    } catch (e) {
        console.warn(e.message);
        return;
    };
    // Clear previous content
    container.innerHTML = '';

    // Create data value elements
    // Create data value elements
    sorted.forEach((value) => {
        const valueElement = document.createElement('div');
        valueElement.className = 'data-point';
        valueElement.textContent = value;

        container.appendChild(valueElement);
    });
};

// Initialize with default data
window.addEventListener('DOMContentLoaded', calculateQuartiles);
/* ------------------------------------------------------------------------------------ */
//Mode Demo
function calculateMode() {
    
    let values;
    try {
        values = readNumericArray('mode-data-input');
    } catch (e) {
        console.warn (e.message);
        return;
    }

    if (values.length === 0) {
        alert('Please enter valid numerical data.');
        return;
    }

    const { frequencyMap, maxFreq, modes } = mode(values);

    // Convert Map to sorted arrays (KEEP pairing)
    const entries = [...frequencyMap.entries()]
        .sort((a, b) => a[0] - b[0]);

    // Determine mode type
    let modeType = 'No mode';

    if (modes.length === 1) modeType = 'Unimodal';
    else if (modes.length === 2) modeType = 'Bimodal';
    else if (modes.length > 2) modeType = 'Multimodal';

    // Update visualization
    updateModeViz(entries, modes);

    // Create frequency table HTML
    // let tableHTML = '<table><tr><th>Value</th><th>Frequency</th></tr>';
    // Object.keys(frequency).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(value => {
    //     const isMode = modes.includes(parseFloat(value));
    //     const rowClass = isMode ? 'mode-row' : '';
    //     tableHTML += `<tr class="${rowClass}"><td>${value}</td><td>${frequency[value]}</td></tr>`;
    // });
    // tableHTML += '</table>';

    // Update output
    
    let output;
    
    try {
        output = readDivElement('mode-demo-output');
    } catch (e) {
        console.warn(e.message);
        return;
    }
    output.innerHTML = `
        <div class="summary">
            <div class="item highlight">
                <div class="value">${modes.length > 0 ? modes.join(', ') + ` (appears ${maxFreq} time${maxFreq > 1 ? 's' : ''})` : 'No mode'}</div>
                <div class="label">Mode</div>
            </div>
            <div class="item">
                <div class="value">${modeType}</div>
                <div class="label">Mode Type</div>
            </div>
        </div>`;

    // Re-render MathJax
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([output]);
    };
};

function updateModeViz(entries, modes) {
    let container;
    try {
        container = readDivElement('sorted-mode-data');
    } catch (e) {
        console.warn(e.message);
        return;
    };

    // Clear previous content
    container.innerHTML = '';

    // Create data items
    entries.forEach(([value, count]) => {
        const item = document.createElement('div');
        item.className = 'data-point';
        if (modes.includes(value)) {
            item.classList.add('mode');
        }
        item.textContent = value;

        // Add frequency count
        const freqDiv = document.createElement('div');
        freqDiv.className = 'frequency-count';
        freqDiv.textContent = count;
        item.appendChild(freqDiv);

        container.appendChild(item);
    });
};

// Initialize with default data
window.addEventListener('DOMContentLoaded', calculateMode);
/* ------------------------------------------------------------------------------------ */
//quartile range and deviation Demo

function calculateQuartileRD() {
    
    let values;
    try {
        values = readNumericArray('quartilerange-data-input');
    } catch (e) {
        console.warn (e.message);
        return;
    }

    if (values.length === 0) {
        alert('Please enter valid numerical data.');
        return;
    }


    if (values.length < 4) {
        alert('Please enter at least 4 values to calculate quartiles.');
        return;
    }

    // Sort the values
    const quartileRDSorted = [...values].sort((a, b) => a - b);
    const n = quartileRDSorted.length;
    const { Q1, Q2, Q3 } = quartiles(quartileRDSorted);

    updateQuartileRDViz(quartileRDSorted);


    // Calculate quartiles
    // let q1, q3;

    // if (n % 2 === 1) {
    //     q1 = getQuartileValue(quartileRDSorted, q1Pos);
    //     q3 = getQuartileValue(quartileRDSorted, q3Pos);
    // } else {
    //     q1 = getQuartileValue(quartileRDSorted, q1Pos);
    //     q3 = getQuartileValue(quartileRDSorted, q3Pos);
    // }

    const qr = Q3 - Q1;
    const qd = qr / 2;
    const totalRange = quartileRDSorted[n - 1] - quartileRDSorted[0];
    const median = n % 2 === 1 ? quartileRDSorted[Math.floor(n / 2)] : (quartileRDSorted[n / 2 - 1] + quartileRDSorted[n / 2]) / 2;

    // Update output
    
    let output;
    
    try {
        output = readDivElement('quartile-rd-demo-output');
    } catch (e) {
        console.warn(e.message);
        return;
    }
    output.innerHTML =
        // <strong>Current Data:</strong> [${values.join(', ')}]<br>
        // <strong>quartileRDSorted Data:</strong> [${quartileRDSorted.join(', ')}]<br>
        // <strong>Q₁ (25th percentile):</strong> ${q1}<br>
        // <strong>Q₂ (50th percentile, Median):</strong> ${median}<br>
        // <strong>Q₃ (75th percentile):</strong> ${q3}<br></br>
        `<div class="summary">
            <div class="item">
                <div class="value">${qr.toFixed(1)}</div>
                <div class="label">Quartile Range (QR)</div>
            </div>
            <div class="item">
                <div class="value">${qd.toFixed(1)}</div>
                <div class="label">Quartile Deviation (QD)</div>
            </div>
            <div class="item">
                <div class="value">${totalRange.toFixed(1)}</div>
                <div class="label">Total Range</div>
            </div>
        </div>`;

    // Re-render MathJax
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([output]);
    }
};

function updateQuartileRDViz(quartileRDSorted) {

    let container;
    try {
        container = readDivElement('sorted-quartileRD-data');
    } catch (e) {
        console.warn(e.message);
        return;
    };

    // Clear previous content
    container.innerHTML = '';

    // Create data items
    quartileRDSorted.forEach(value => {
        const item = document.createElement('div');
        item.className = 'data-point';
        item.textContent = value;
        container.appendChild(item);
    });
}
/* ------------------------------------------------------------------------------------ */
// Box Plot demo


// function compareDatasets() {
//     const input1 = document.getElementById('dataset1').value;
//     const input2 = document.getElementById('dataset2').value;

//     const values1 = input1.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
//     const values2 = input2.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

//     if (values1.length < 3 || values2.length < 3) {
//         alert('Please enter at least 3 values for each dataset.');
//         return;
//     }

//     // Calculate statistics for both datasets
//     const stats1 = calculateStats(values1);
//     const stats2 = calculateStats(values2);

//     const output = document.getElementById('comparison-output');
//     output.innerHTML = `
//        <h4>Dataset Comparison</h4>
//        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
//         <div>
//          <h5>Dataset A</h5>
//          <div class="statistics-summary">
//           <div class="stat-item"><div class="value">${stats1.min}</div><div class="label">Min</div></div>
//           <div class="stat-item"><div class="value">${stats1.q1.toFixed(1)}</div><div class="label">Q₁</div></div>
//           <div class="stat-item"><div class="value">${stats1.median.toFixed(1)}</div><div class="label">Median</div></div>
//           <div class="stat-item"><div class="value">${stats1.q3.toFixed(1)}</div><div class="label">Q₃</div></div>
//           <div class="stat-item"><div class="value">${stats1.max}</div><div class="label">Max</div></div>
//           <div class="stat-item"><div class="value">${stats1.iqr.toFixed(1)}</div><div class="label">IQR</div></div>
//          </div>
//         </div>
//         <div>
//          <h5>Dataset B</h5>
//          <div class="statistics-summary">
//           <div class="stat-item"><div class="value">${stats2.min}</div><div class="label">Min</div></div>
//           <div class="stat-item"><div class="value">${stats2.q1.toFixed(1)}</div><div class="label">Q₁</div></div>
//           <div class="stat-item"><div class="value">${stats2.median.toFixed(1)}</div><div class="label">Median</div></div>
//           <div class="stat-item"><div class="value">${stats2.q3.toFixed(1)}</div><div class="label">Q₃</div></div>
//           <div class="stat-item"><div class="value">${stats2.max}</div><div class="label">Max</div></div>
//           <div class="stat-item"><div class="value">${stats2.iqr.toFixed(1)}</div><div class="label">IQR</div></div>
//          </div>
//         </div>
//        </div>
//       `;
// }


function updateBoxPlotViz(sortedBoxPlotValues) {

    let container;
    try {
        container = readDivElement('sorted-boxPlot-data');
    } catch (e) {
        console.warn(e.message);
        return;
    };

    // Clear previous points
    container.innerHTML = '';


    // Create data points
    sortedBoxPlotValues.forEach((value, index) => {
        const point = document.createElement('div');
        point.className = 'data-point';
        point.textContent = value;
        // point.style.left = `${index * 60 + 20}px`;
        // point.style.top = `${100 - value * 5}px`;
        container.appendChild(point);
    });
};

function calculateBoxPlot() {
    
    let values;
    try {
        values = readNumericArray('boxPlot-data-input');
    } catch (e) {
        console.warn (e.message);
        return;
    }

    if (values.length < 5) {
        alert('Please enter at least 5 values to create a meaningful box plot.');
        return;
    }

    // Sort the values
    const sortedBoxPlotValues = [...values].sort((a, b) => a - b);
    updateBoxPlotViz(sortedBoxPlotValues);

    const { Q1, Q2, Q3 } = quartiles(sortedBoxPlotValues);
    const min = sortedBoxPlotValues[0];
    const max = sortedBoxPlotValues[sortedBoxPlotValues.length - 1];
    const iqr = Q3 - Q1;

    // Calculate outlier boundaries
    const lowerFence = Q1 - 1.5 * iqr;
    const upperFence = Q3 + 1.5 * iqr;

    // Find outliers
    const outliers = sortedBoxPlotValues.filter(x => x < lowerFence || x > upperFence);

    // Update statistics display
    
    let output;
    
    try {
        output = readDivElement('boxplot-demo-output');
    } catch (e) {
        console.warn(e.message);
        return;
    }
    output.innerHTML =
        // <strong>Current Data:</strong> [${values.join(', ')}]<br>
        // <strong>Sorted Data:</strong> [${sortedBoxPlotValues.join(', ')}]<br>
        `
            <div class="summary">
                <div class="item">
                    <div class="value">
                        ${outliers.length > 0
            ? outliers.join(', ')
            : "No"}
                    </div>
                    <div> Outlier Detected </div>
                </div>
                <div class="item">
                    <div class="value">${min}</div>
                    <div class="label">Min</div>
                </div>
                <div class="item">
                    <div class="value">${max}</div>
                    <div class="label">Max</div>
                </div>
                <div class="item">
                    <div class="value">${Q1.toFixed(1)}</div>
                    <div class="label">Q₁</div>
                </div>
                <div class="item">
                    <div class="value">${Q2.toFixed(1)}</div>
                    <div class="label">Median</div>
                </div>
                <div class="item">
                    <div class="value">${Q3.toFixed(1)}</div>
                    <div class="label">Q₃</div>
                </div>
                <div class="item">
                    <div class="value">${iqr.toFixed(1)}</div>
                    <div class="label">IQR</div>
                </div>
            </div>
        `;
    // ${outliers.length > 0 ? `<strong>Outliers:</strong> [${outliers.join(', ')}]<br>` : '<strong>No outliers detected</strong><br>'}
    // <div id="boxplot-viz" style="text-align: center; margin: 20px 0;">
    // ${createBoxPlotSVG(min, Q1, median, Q3, max, lowerWhisker, upperWhisker, outliers)}
    // </div>

    // Re-render MathJax
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([output]);
    }
};

// function getQuartileValue(sorted, position) {
//     const n = sorted.length;
//     const lowerIndex = Math.floor(position) - 1;
//     const upperIndex = Math.ceil(position) - 1;

//     if (lowerIndex === upperIndex) {
//         return sorted[lowerIndex];
//     } else {
//         const lowerValue = sorted[lowerIndex];
//         const upperValue = sorted[upperIndex];
//         const fraction = position - Math.floor(position);
//         return lowerValue + fraction * (upperValue - lowerValue);
//     }
// };

// function createBoxPlotSVG(min, q1, median, q3, max, lowerWhisker, upperWhisker, outliers) {
//     // Scale values to SVG coordinates (assuming data range fits in 400 units)
//     const dataRange = max - min;
//     const scale = dataRange > 0 ? 400 / dataRange : 1;
//     const offset = 50;

//     const scaleX = (value) => offset + (value - min) * scale;

//     const q1X = scaleX(q1);
//     const medianX = scaleX(median);
//     const q3X = scaleX(q3);
//     const lowerWhiskerX = scaleX(lowerWhisker);
//     const upperWhiskerX = scaleX(upperWhisker);

//     let svg = `<svg width="500" height="120" viewBox="0 0 500 120">
//        <!-- Whiskers -->
//        <line stroke="#222" stroke-width="2" x1="${lowerWhiskerX}" y1="60" x2="${q1X}" y2="60"></line>
//        <line stroke="#222" stroke-width="2" x1="${q3X}" y1="60" x2="${upperWhiskerX}" y2="60"></line>

//        <!-- Whisker caps -->
//        <line stroke="#222" stroke-width="2" x1="${lowerWhiskerX}" y1="45" x2="${lowerWhiskerX}" y2="75"></line>
//        <line stroke="#222" stroke-width="2" x1="${upperWhiskerX}" y1="45" x2="${upperWhiskerX}" y2="75"></line>

//        <!-- Box -->
//        <rect fill="#fff" stroke="#222" stroke-width="2" x="${q1X}" y="30" width="${q3X - q1X}" height="60"></rect>

//        <!-- Median line -->
//        <line stroke="#ff7043" stroke-width="3" x1="${medianX}" y1="30" x2="${medianX}" y2="90"></line>

//        <!-- Outliers -->
//        ${outliers.map(outlier => {
//         const outlierX = scaleX(outlier);
//         return `<circle cx="${outlierX}" cy="60" r="4" fill="#e74c3c" stroke="#222" stroke-width="1"></circle>`;
//     }).join('')}

//        <!-- Labels -->
//        <text x="${lowerWhiskerX}" y="105" text-anchor="middle" font-size="12">${lowerWhisker.toFixed(1)}</text>
//        <text x="${q1X}" y="105" text-anchor="middle" font-size="12">${q1.toFixed(1)}</text>
//        <text x="${medianX}" y="105" text-anchor="middle" font-size="12">${median.toFixed(1)}</text>
//        <text x="${q3X}" y="105" text-anchor="middle" font-size="12">${q3.toFixed(1)}</text>
//        <text x="${upperWhiskerX}" y="105" text-anchor="middle" font-size="12">${upperWhisker.toFixed(1)}</text>
//       </svg>`;

//     return svg;
// };

// function calculateStats(values) {
//     const sorted = [...values].sort((a, b) => a - b);
//     const n = sorted.length;
//     const q1 = getQuartileValue(sorted, (n + 1) / 4);
//     const median = n % 2 === 1 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
//     const q3 = getQuartileValue(sorted, 3 * (n + 1) / 4);
//     const min = sorted[0];
//     const max = sorted[sorted.length - 1];
//     const iqr = q3 - q1;

//     return { min, q1, median, q3, max, iqr };
// };

// Initialize with default data
/* ------------------------------------------------------------------------------------ */
//Variance and Standard Deviation demo
function calculateVSD() {
  
    let values;
    try {
        values = readNumericArray('vsd-data-input');
    } catch (e) {
        console.warn (e.message);
        return;
    }

    if (values.length < 2) {
        alert('Please enter at least 2 values.');
        return;
    }
    
    //if other same error handling try to make function
    // const calculationTypeElement = document.getElementById('calculation-type');
    // if (!calculationTypeElement) {
    //     console.warn("calculation-type element not found");
    //     return;
    // }
    // const calculationType = calculationTypeElement.value;
    // if (!calculationType) {
    //     console.warn("No calculation type selected");
    //     return;
    // }
    let calculationType ;
    try {
        calculationType = readStr('calculation-type', ['sample', 'population']);
    } catch (e) {
        console.warn(e.message);
        return;
    }

    // Calculate mean
    const calculatedMean = mean(values);

    // Calculate deviations and squared deviations
    const deviations = values.map(val => val - calculatedMean);
    // Calculate variance
    const calculatedVariance = calculationType === 'sample' ? sampleVariance(values, calculatedMean) : populationVariance(values, calculatedMean);

    // Calculate standard deviation
    const stdDev = Math.sqrt(calculatedVariance);

    // Update visualization
    updateVSDViz(values, calculatedMean, deviations);

    // Update output
    
    let output;
    
    try {
        output = readDivElement('vsd-demo-output');
    } catch (e) {
        console.warn(e.message);
        return;
    }

    output.innerHTML =
        // <strong>Current Data:</strong> [${values.join(', ')}]<br>
        // <strong>Mean (${calculationType === 'sample' ? 'x̄' : 'μ'}):</strong> ${mean.toFixed(2)}<br>
        // <strong>Calculation Type:</strong> ${calculationType.charAt(0).toUpperCase() + calculationType.slice(1)}<br>
        `
            <div class="summary">
                <div class="item highlight">
                    <div class="value">${calculatedVariance.toFixed(2)}</div>
                    <div class="label">Variance (${calculationType === 'sample' ? 's²' : 'σ²'})</div>
                </div>
                <div class="item highlight">
                    <div class="value">${stdDev.toFixed(2)}</div>
                    <div class="label">Std Dev (${calculationType === 'sample' ? 's' : 'σ'})</div>
                </div>
                <div class="item">
                    <div class="value">
                        ${calculationType === 'sample' ? 'x̄' : 'μ'} : ${calculatedMean.toFixed(2)}
                    </div>
                    <div class="label">Mean</div>
                </div>
                <div class="item">
                    <div class="value">
                        ${calculationType.charAt(0).toUpperCase() + calculationType.slice(1)}
                    </div>
                    <div class="label">Type</div>
                </div>
            </div>
        `;

    // Re-render MathJax
    if (window.MathJax) {
        MathJax.typesetPromise([output]).catch(function (err) {
            console.log('MathJax re-render error:', err);
        });
    }
}

function updateVSDViz(values, calculatedMean, deviations) {
    
    let container;
    try {
        container = readDivElement('data-deviations');
    } catch (e) {
        console.warn(e.message);
        return;
    };

    // Clear previous content
    container.innerHTML = '';

    // Create data items
    values.forEach((value, index) => {
        const point = document.createElement('div');
        point.className = 'data-point';
        point.textContent = value;

        // Add deviation label
        const label = document.createElement('div');
        label.className = 'deviation-label';
        label.textContent = deviations[index].toFixed(1);
        point.appendChild(label);

        // Highlight mean
        if (Math.abs(value - calculatedMean) < 0.001) {
            point.classList.add('mean');
        }

        container.appendChild(point);
    });
}

// Initialize with default data
window.addEventListener('DOMContentLoaded', calculateVSD);
/* ------------------------------------------------------------------------------------ */
// Correlation Demo

// const canvas = document.getElementById("plot");
// const ctx = canvas.getContext("2d");

// const W = canvas.width;
// const H = canvas.height;
// const PAD = 40;

// let dataX = [], dataY = [];
// let showTrend = true;
// let rValue = 0;