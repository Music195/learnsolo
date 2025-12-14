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
      updateVisualization(sorted, q1, q2, q3);

      // Update output
      const output = document.getElementById('demo-output');
      output.innerHTML = `<strong>Current Data:</strong> [${values.join(', ')}]<br>
      <strong>Sorted Data:</strong> [${sorted.join(', ')}]<br>
      <strong>Q₁ (25th percentile):</strong> ${q1}<br>
      <strong>Q₂ (50th percentile, Median):</strong> ${q2}<br>
      <strong>Q₃ (75th percentile):</strong> ${q3}<br>
      <strong>IQR (Q₃ - Q₁):</strong> ${iqr}<br>
      <div class="quartile-summary">
       <div class="quartile-stat">
        <div class="value">${q1}</div>
        <div class="label">Q₁</div>
       </div>
       <div class="quartile-stat">
        <div class="value">${q2}</div>
        <div class="label">Q₂ (Median)</div>
       </div>
       <div class="quartile-stat">
        <div class="value">${q3}</div>
        <div class="label">Q₃</div>
       </div>
       <div class="quartile-stat">
        <div class="value">${iqr.toFixed(1)}</div>
        <div class="label">IQR</div>
       </div>
      </div>`;

      // Re-render MathJax
      if (window.MathJax) {
       MathJax.typesetPromise([output]).catch(function(err) {
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

     function updateVisualization(sorted, q1, q2, q3) {
      const container = document.getElementById('sorted-data');

      // Clear previous content
      container.innerHTML = '';

      // Create data value elements
      sorted.forEach((value, index) => {
       const valueElement = document.createElement('div');
       valueElement.className = 'data-value';
       valueElement.textContent = value;

       // Highlight quartile values
       if (Math.abs(value - q1) < 0.001) {
        valueElement.classList.add('quartile-highlight', 'q1');
        const arrow = document.createElement('div');
        arrow.className = 'quartile-arrow q1';
        arrow.textContent = 'Q₁';
        valueElement.appendChild(arrow);
       } else if (Math.abs(value - q2) < 0.001) {
        valueElement.classList.add('quartile-highlight', 'q2');
        const arrow = document.createElement('div');
        arrow.className = 'quartile-arrow q2';
        arrow.textContent = 'Q₂';
        valueElement.appendChild(arrow);
       } else if (Math.abs(value - q3) < 0.001) {
        valueElement.classList.add('quartile-highlight', 'q3');
        const arrow = document.createElement('div');
        arrow.className = 'quartile-arrow q3';
        arrow.textContent = 'Q₃';
        valueElement.appendChild(arrow);
       }

       container.appendChild(valueElement);
      });
     }

     else {
       solution.style.display = 'none';
      }
     }

     // Initialize with default data
     calculateQuartiles();