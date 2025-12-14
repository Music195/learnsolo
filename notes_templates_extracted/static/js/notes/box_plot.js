function generateBoxPlot() {
      const input = document.getElementById('data-input').value;
      const values = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

      if (values.length < 5) {
       alert('Please enter at least 5 values to create a meaningful box plot.');
       return;
      }

      // Sort the values
      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;

      // Calculate quartiles
      const q1 = getQuartileValue(sorted, (n + 1) / 4);
      const median = n % 2 === 1 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      const q3 = getQuartileValue(sorted, 3 * (n + 1) / 4);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const iqr = q3 - q1;

      // Calculate outlier boundaries
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;

      // Find actual whiskers (excluding outliers)
      const lowerWhisker = Math.max(min, lowerFence);
      const upperWhisker = Math.min(max, upperFence);

      // Find outliers
      const outliers = sorted.filter(x => x < lowerFence || x > upperFence);

      // Update statistics display
      const output = document.getElementById('demo-output');
      output.innerHTML = `<strong>Current Data:</strong> [${values.join(', ')}]<br>
      <strong>Sorted Data:</strong> [${sorted.join(', ')}]<br>
      <div class="statistics-summary">
       <div class="stat-item">
        <div class="value">${min}</div>
        <div class="label">Min</div>
       </div>
       <div class="stat-item">
        <div class="value">${q1.toFixed(1)}</div>
        <div class="label">Q₁</div>
       </div>
       <div class="stat-item">
        <div class="value">${median.toFixed(1)}</div>
        <div class="label">Median</div>
       </div>
       <div class="stat-item">
        <div class="value">${q3.toFixed(1)}</div>
        <div class="label">Q₃</div>
       </div>
       <div class="stat-item">
        <div class="value">${max}</div>
        <div class="label">Max</div>
       </div>
       <div class="stat-item">
        <div class="value">${iqr.toFixed(1)}</div>
        <div class="label">IQR</div>
       </div>
      </div>
      ${outliers.length > 0 ? `<strong>Outliers:</strong> [${outliers.join(', ')}]<br>` : '<strong>No outliers detected</strong><br>'}
      <div id="boxplot-viz" style="text-align: center; margin: 20px 0;">
       ${createBoxPlotSVG(min, q1, median, q3, max, lowerWhisker, upperWhisker, outliers)}
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
      const lowerIndex = Math.floor(position) - 1;
      const upperIndex = Math.ceil(position) - 1;

      if (lowerIndex === upperIndex) {
       return sorted[lowerIndex];
      } else {
       const lowerValue = sorted[lowerIndex];
       const upperValue = sorted[upperIndex];
       const fraction = position - Math.floor(position);
       return lowerValue + fraction * (upperValue - lowerValue);
      }
     }

     function createBoxPlotSVG(min, q1, median, q3, max, lowerWhisker, upperWhisker, outliers) {
      // Scale values to SVG coordinates (assuming data range fits in 400 units)
      const dataRange = max - min;
      const scale = dataRange > 0 ? 400 / dataRange : 1;
      const offset = 50;

      const scaleX = (value) => offset + (value - min) * scale;

      const q1X = scaleX(q1);
      const medianX = scaleX(median);
      const q3X = scaleX(q3);
      const lowerWhiskerX = scaleX(lowerWhisker);
      const upperWhiskerX = scaleX(upperWhisker);

      let svg = `<svg width="500" height="120" viewBox="0 0 500 120">
       <!-- Whiskers -->
       <line stroke="#222" stroke-width="2" x1="${lowerWhiskerX}" y1="60" x2="${q1X}" y2="60"></line>
       <line stroke="#222" stroke-width="2" x1="${q3X}" y1="60" x2="${upperWhiskerX}" y2="60"></line>

       <!-- Whisker caps -->
       <line stroke="#222" stroke-width="2" x1="${lowerWhiskerX}" y1="45" x2="${lowerWhiskerX}" y2="75"></line>
       <line stroke="#222" stroke-width="2" x1="${upperWhiskerX}" y1="45" x2="${upperWhiskerX}" y2="75"></line>

       <!-- Box -->
       <rect fill="#fff" stroke="#222" stroke-width="2" x="${q1X}" y="30" width="${q3X - q1X}" height="60"></rect>

       <!-- Median line -->
       <line stroke="#ff7043" stroke-width="3" x1="${medianX}" y1="30" x2="${medianX}" y2="90"></line>

       <!-- Outliers -->
       ${outliers.map(outlier => {
        const outlierX = scaleX(outlier);
        return `<circle cx="${outlierX}" cy="60" r="4" fill="#e74c3c" stroke="#222" stroke-width="1"></circle>`;
       }).join('')}

       <!-- Labels -->
       <text x="${lowerWhiskerX}" y="105" text-anchor="middle" font-size="12">${lowerWhisker.toFixed(1)}</text>
       <text x="${q1X}" y="105" text-anchor="middle" font-size="12">${q1.toFixed(1)}</text>
       <text x="${medianX}" y="105" text-anchor="middle" font-size="12">${median.toFixed(1)}</text>
       <text x="${q3X}" y="105" text-anchor="middle" font-size="12">${q3.toFixed(1)}</text>
       <text x="${upperWhiskerX}" y="105" text-anchor="middle" font-size="12">${upperWhisker.toFixed(1)}</text>
      </svg>`;

      return svg;
     }

     function compareDatasets() {
      const input1 = document.getElementById('dataset1').value;
      const input2 = document.getElementById('dataset2').value;

      const values1 = input1.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      const values2 = input2.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

      if (values1.length < 3 || values2.length < 3) {
       alert('Please enter at least 3 values for each dataset.');
       return;
      }

      // Calculate statistics for both datasets
      const stats1 = calculateStats(values1);
      const stats2 = calculateStats(values2);

      const output = document.getElementById('comparison-output');
      output.innerHTML = `
       <h4>Dataset Comparison</h4>
       <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
         <h5>Dataset A</h5>
         <div class="statistics-summary">
          <div class="stat-item"><div class="value">${stats1.min}</div><div class="label">Min</div></div>
          <div class="stat-item"><div class="value">${stats1.q1.toFixed(1)}</div><div class="label">Q₁</div></div>
          <div class="stat-item"><div class="value">${stats1.median.toFixed(1)}</div><div class="label">Median</div></div>
          <div class="stat-item"><div class="value">${stats1.q3.toFixed(1)}</div><div class="label">Q₃</div></div>
          <div class="stat-item"><div class="value">${stats1.max}</div><div class="label">Max</div></div>
          <div class="stat-item"><div class="value">${stats1.iqr.toFixed(1)}</div><div class="label">IQR</div></div>
         </div>
        </div>
        <div>
         <h5>Dataset B</h5>
         <div class="statistics-summary">
          <div class="stat-item"><div class="value">${stats2.min}</div><div class="label">Min</div></div>
          <div class="stat-item"><div class="value">${stats2.q1.toFixed(1)}</div><div class="label">Q₁</div></div>
          <div class="stat-item"><div class="value">${stats2.median.toFixed(1)}</div><div class="label">Median</div></div>
          <div class="stat-item"><div class="value">${stats2.q3.toFixed(1)}</div><div class="label">Q₃</div></div>
          <div class="stat-item"><div class="value">${stats2.max}</div><div class="label">Max</div></div>
          <div class="stat-item"><div class="value">${stats2.iqr.toFixed(1)}</div><div class="label">IQR</div></div>
         </div>
        </div>
       </div>
      `;
     }

     function calculateStats(values) {
      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;
      const q1 = getQuartileValue(sorted, (n + 1) / 4);
      const median = n % 2 === 1 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      const q3 = getQuartileValue(sorted, 3 * (n + 1) / 4);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const iqr = q3 - q1;

      return { min, q1, median, q3, max, iqr };
     }

     else {
       solution.style.display = 'none';
      }
     }

     // Initialize with default data
     generateBoxPlot();