function generateScatterPlot() {
      const xInput = document.getElementById('x-data').value;
      const yInput = document.getElementById('y-data').value;

      const xValues = xInput.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      const yValues = yInput.split(',').map(y => parseFloat(y.trim())).filter(y => !isNaN(y));

      if (xValues.length !== yValues.length || xValues.length < 2) {
       alert('Please enter equal number of X and Y values (at least 2 pairs).');
       return;
      }

      // Calculate correlation coefficient
      const correlation = calculateCorrelation(xValues, yValues);
      const direction = correlation > 0 ? 'Positive' : correlation < 0 ? 'Negative' : 'None';
      const strength = Math.abs(correlation) >= 0.8 ? 'Strong' :
                      Math.abs(correlation) >= 0.6 ? 'Moderate' :
                      Math.abs(correlation) >= 0.3 ? 'Weak' : 'Very Weak';

      // Update scatter plot
      updateScatterPlot(xValues, yValues);

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
        <div class="value">${direction}</div>
        <div class="label">Direction</div>
       </div>
       <div class="correlation-stat">
        <div class="value">${strength}</div>
        <div class="label">Strength</div>
       </div>
      </div>`;

      // Re-render MathJax
      if (window.MathJax) {
       MathJax.typesetPromise([output]).catch(function(err) {
        console.log('MathJax re-render error:', err);
       });
      }
     }

     function calculateCorrelation(x, y) {
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

     function updateScatterPlot(xValues, yValues) {
      const container = document.getElementById('scatter-plot-container');

      // Clear previous plot
      const existingPoints = container.querySelectorAll('.data-point, .trend-line');
      existingPoints.forEach(point => point.remove());

      // Calculate ranges
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);

      const xRange = xMax - xMin || 1;
      const yRange = yMax - yMin || 1;

      // Plot points
      xValues.forEach((x, i) => {
       const y = yValues[i];
       const xPos = 50 + ((x - xMin) / xRange) * 300; // 50px margin, 300px plot area
       const yPos = 250 - ((y - yMin) / yRange) * 200; // 250px from top, 200px plot height

       const point = document.createElement('div');
       point.className = 'data-point';
       point.style.left = xPos + 'px';
       point.style.top = yPos + 'px';
       container.appendChild(point);
      });

      // Add trend line if correlation is significant
      const correlation = calculateCorrelation(xValues, yValues);
      if (Math.abs(correlation) > 0.3) {
       const slope = correlation * (yRange / xRange);
       const intercept = (yMax + yMin) / 2 - slope * (xMax + xMin) / 2;

       const x1 = xMin;
       const y1 = slope * x1 + intercept;
       const x2 = xMax;
       const y2 = slope * x2 + intercept;

       const x1Pos = 50 + ((x1 - xMin) / xRange) * 300;
       const y1Pos = 250 - ((y1 - yMin) / yRange) * 200;
       const x2Pos = 50 + ((x2 - xMin) / xRange) * 300;
       const y2Pos = 250 - ((y2 - yMin) / yRange) * 200;

       const length = Math.sqrt((x2Pos - x1Pos) ** 2 + (y2Pos - y1Pos) ** 2);
       const angle = Math.atan2(y2Pos - y1Pos, x2Pos - x1Pos) * 180 / Math.PI;

       const trendLine = document.createElement('div');
       trendLine.className = 'trend-line';
       trendLine.style.width = length + 'px';
       trendLine.style.left = x1Pos + 'px';
       trendLine.style.top = y1Pos + 'px';
       trendLine.style.transform = `rotate(${angle}deg)`;
       container.appendChild(trendLine);
      }
     }

     else {
       solution.style.display = 'none';
      }
     }

     // Initialize with default data
     generateScatterPlot();