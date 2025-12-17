/* Mean Demo */
function calculateMean() {
    const input = document.getElementById('data-input').value;
    const values = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

    if (values.length === 0) {
        alert('Please enter valid numbers separated by commas.');
        return;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;

    // Update visualization
    updateVisualization(values);

    // Update output
    const output = document.getElementById('demo-output');
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
               <div class="value">${values.length}</div>
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

function updateVisualization(values) {
    const container = document.getElementById('data-points');

    // Clear previous points
    container.innerHTML = '';

    const sortedValues = [...values].sort((a,b) => a - b );

    // Create data points
    sortedValues.forEach((value, index) => {
        const point = document.createElement('div');
        point.className = 'data-point';
        point.textContent = value;
        point.style.left = `${index * 60 + 20}px`;
        point.style.top = `${100 - value * 5}px`;
        container.appendChild(point);
    });
}

function toggleSolution(num) {
    const solution = document.getElementById('solution' + num);
    if (solution.style.display === 'none' || solution.style.display === '') {
        solution.style.display = 'block';
    } else {
        solution.style.display = 'none';
    }
}

// Initialize with default data
window.addEventListener('DOMContentLoaded', calculateMean);

/* ------------------------------------------------------------------------------------ */