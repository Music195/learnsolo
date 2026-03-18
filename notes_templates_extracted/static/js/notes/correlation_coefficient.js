function calculateCorrelation() {
      const xInput = document.getElementById('x-data').value;
      const yInput = document.getElementById('y-data').value;

      const xValues = xInput.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      const yValues = yInput.split(',').map(y => parseFloat(y.trim())).filter(y => !isNaN(y));

      if (xValues.length !== yValues.length || xValues.length < 2) {
       alert('Please enter equal number of X and Y values (at least 2 pairs).');
       return;
      }

      // Calculate correlation coefficient
      const correlation = calculateCorrelationCoeff(xValues, yValues);
      const strength = Math.abs(correlation) >= 0.8 ? 'Strong' :
                      Math.abs(correlation) >= 0.6 ? 'Moderate' :
                      Math.abs(correlation) >= 0.3 ? 'Weak' : 'Very Weak';
      const direction = correlation > 0 ? 'Positive' : correlation < 0 ? 'Negative' : 'None';

      // Update output
      const output = document.getElementById('demo-output');
      output.innerHTML = `<strong>Current Data:</strong><br>
      X: [${xValues.join(', ')}]<br>
      Y: [${yValues.join(', ')}]<br>
      <div class="correlation-result">
       <div class="correlation-stat">
        <div class="value">${correlation.toFixed(3)}</div>
        <div class="label">Correlation (r)</div>
       </div>
       <div class="correlation-stat">
        <div class="value">${strength}</div>
        <div class="label">Strength</div>
       </div>
       <div class="correlation-stat">
        <div class="value">${direction}</div>
        <div class="label">Direction</div>
       </div>
      </div>`;

      // Re-render MathJax
      if (window.MathJax) {
       MathJax.typesetPromise([output]).catch(function(err) {
        console.log('MathJax re-render error:', err);
       });
      }
     }

     function calculateCorrelationCoeff(x, y) {
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

      return denominator === 0 ? 0 : numerator / denominator;
     }

     else {
       solution.style.display = 'none';
      }
     }

     // Initialize with default data
     calculateCorrelation();