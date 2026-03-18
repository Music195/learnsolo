function calculateQuartileMeasures() {
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
      let q1, q3;

      if (n % 2 === 1) {
       q1 = getQuartileValue(sorted, q1Pos);
       q3 = getQuartileValue(sorted, q3Pos);
      } else {
       q1 = getQuartileValue(sorted, q1Pos);
       q3 = getQuartileValue(sorted, q3Pos);
      }

      const qr = q3 - q1;
      const qd = qr / 2;
      const totalRange = sorted[sorted.length - 1] - sorted[0];
      const median = n % 2 === 1 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

      // Update output
      const output = document.getElementById('demo-output');
      output.innerHTML = `<strong>Current Data:</strong> [${values.join(', ')}]<br>
      <strong>Sorted Data:</strong> [${sorted.join(', ')}]<br>
      <strong>Q₁ (25th percentile):</strong> ${q1}<br>
      <strong>Q₂ (50th percentile, Median):</strong> ${median}<br>
      <strong>Q₃ (75th percentile):</strong> ${q3}<br>
      <div class="deviation-summary">
       <div class="deviation-stat">
        <div class="value">${qr.toFixed(1)}</div>
        <div class="label">Quartile Range (QR)</div>
       </div>
       <div class="deviation-stat">
        <div class="value">${qd.toFixed(1)}</div>
        <div class="label">Quartile Deviation (QD)</div>
       </div>
       <div class="deviation-stat">
        <div class="value">${totalRange.toFixed(1)}</div>
        <div class="label">Total Range</div>
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

     else {
       solution.style.display = 'none';
      }
     }

     // Initialize with default data
     calculateQuartileMeasures();