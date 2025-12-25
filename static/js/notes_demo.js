function toggleSolution(num) {
    const solution = document.getElementById('solution' + num);
    if (solution.style.display === 'none' || solution.style.display === '') {
        solution.style.display = 'block';
    } else {
        solution.style.display = 'none';
    }
}

// Mean Demo 

function calculateMean() {
    const input = document.getElementById('data-input').value;
    const values = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

    if (values.length === 0) {
        alert('Please enter valid numbers separated by commas.');
        return;
    }

    const sortedMeanValues = [...values].sort((a, b) => a - b);

    const sum = sortedMeanValues.reduce((a, b) => a + b, 0);
    const mean = sum / sortedMeanValues.length;
    const variance = sortedMeanValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sortedMeanValues.length;

    // Update visualization
    updateMeanViz(sortedMeanValues);

    // Update output
    const output = document.getElementById('mean-demo-output');
    output.innerHTML =
        `  <div class="summary">
            <div class="item highlight">
               <div class="value">${mean.toFixed(2)}</div>
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
    if (window.MathJax) {
        MathJax.typesetPromise([output]).catch(function (err) {
            console.log('MathJax re-render error:', err);
        });
    }
}

function updateMeanViz(sortedMeanValues) {
    const container = document.getElementById('sorted-mean-data');
    if (!container) return;

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
}

// Initialize with default data
window.addEventListener('DOMContentLoaded', calculateMean);

/* ------------------------------------------------------------------------------------ */
// Median Demo

function calculateMedian() {
    const input = document.getElementById('data-input').value;
    const values = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

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
    const output = document.getElementById('median-demo-output');
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
    if (window.MathJax) {
        MathJax.typesetPromise([output]).catch(function (err) {
            console.log('MathJax re-render error:', err);
        });
    }
}

function updateMedianViz(sortedMedianValues) {
    const container = document.getElementById('sorted-median-data');

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
}

// Initialize with default data
window.addEventListener('DOMContentLoaded', calculateMedian);
/* ------------------------------------------------------------------------------------ */
//Quartiles Demo
function calculateQuartiles() {
    const input = document.getElementById('data-input').value;
    const values = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

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
    const output = document.getElementById('quartile-demo-output');
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
    if (window.MathJax) {
        MathJax.typesetPromise([output]).catch(function (err) {
            console.log('MathJax re-render error:', err);
        });
    }
}

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
}

function updateQuartileViz(sorted) {
    const container = document.getElementById('sorted-quartile-data');
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
}


// Initialize with default data
window.addEventListener('DOMContentLoaded', calculateQuartiles);
/* ------------------------------------------------------------------------------------ */
//Mode Demo
function calculateMode() {
    const input = document.getElementById('data-input').value;
    const values = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

    if (values.length === 0) {
        alert('Please enter valid numerical data.');
        return;
    }

    // Calculate frequency
    const frequency = {};
    values.forEach(value => {
        frequency[value] = (frequency[value] || 0) + 1;
    });

    // Find maximum frequency
    const maxFreq = Math.max(...Object.values(frequency));

    // Find all values with maximum frequency
    const modes = Object.keys(frequency)
        .filter(key => frequency[key] === maxFreq)
        .map(key => parseFloat(key))
        .sort((a, b) => a - b);

    // Determine mode type
    let modeType = 'No mode';

    if (maxFreq > 1) {
        if (modes.length === 1) modeType = 'Unimodal';
        else if (modes.length === 2) modeType = 'Bimodal';
        else modeType = 'Multimodal';
    } else {
        modes.length = 0;
    }

    // Get the non-duplicated values and sort them
    const nonDuplicateSorted = [...new Set(values)].sort((a, b) => a - b);


    // Update visualization
    updateModeViz(nonDuplicateSorted, frequency, modes);

    // Create frequency table HTML
    // let tableHTML = '<table><tr><th>Value</th><th>Frequency</th></tr>';
    // Object.keys(frequency).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(value => {
    //     const isMode = modes.includes(parseFloat(value));
    //     const rowClass = isMode ? 'mode-row' : '';
    //     tableHTML += `<tr class="${rowClass}"><td>${value}</td><td>${frequency[value]}</td></tr>`;
    // });
    // tableHTML += '</table>';

    // Update output
    const output = document.getElementById('mode-demo-output');
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
    if (window.MathJax) {
        MathJax.typesetPromise([output]).catch(function (err) {
            console.log('MathJax re-render error:', err);
        });
    }
}

function updateModeViz(nonDuplicateSorted, frequency, modes) {
    const container = document.getElementById('sorted-mode-data');

    // Clear previous content
    container.innerHTML = '';

    // Create data items
    nonDuplicateSorted.forEach(value => {
        const item = document.createElement('div');
        item.className = 'data-point';
        if (modes.includes(value)) {
            item.classList.add('mode');
        }
        item.textContent = value;

        // Add frequency count
        const count = document.createElement('div');
        count.className = 'frequency-count';
        count.textContent = frequency[value];
        item.appendChild(count);

        container.appendChild(item);
    });
}

// Initialize with default data
window.addEventListener('DOMContentLoaded', calculateMode);
/* ------------------------------------------------------------------------------------ */
//Mode Demo
