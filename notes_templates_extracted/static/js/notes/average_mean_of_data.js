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
      updateVisualization(values, mean);

      // Update output
      const output = document.getElementById('demo-output');
      output.innerHTML = `<strong>Current Data:</strong> [${values.join(', ')}]<br>
      <strong>Sum:</strong> ${sum.toFixed(2)}<br>
      <strong>Count:</strong> ${values.length}<br>
      <strong>Mean:</strong> ${mean.toFixed(2)}<br>
      <div class="stats-summary">
       <div class="stat-item">
        <div class="stat-value">${mean.toFixed(2)}</div>
        <div class="stat-label">Mean</div>
       </div>
       <div class="stat-item">
        <div class="stat-value">${sum.toFixed(2)}</div>
        <div class="stat-label">Total Sum</div>
       </div>
       <div class="stat-item">
        <div class="stat-value">${values.length}</div>
        <div class="stat-label">Data Points</div>
       </div>
       <div class="stat-item">
        <div class="stat-value">${variance.toFixed(2)}</div>
        <div class="stat-label">Variance</div>
       </div>
      </div>`;

      // Re-render MathJax
      if (window.MathJax) {
       MathJax.typesetPromise([output]).catch(function(err) {
        console.log('MathJax re-render error:', err);
       });
      }
     }

     function updateVisualization(values, mean) {
      const container = document.getElementById('data-points');
      const meanIndicator = document.getElementById('mean-indicator');
      const meanLabel = document.getElementById('mean-label');

      // Clear previous points
      container.innerHTML = '';

      // Create data points
      values.forEach((value, index) => {
       const point = document.createElement('div');
       point.className = 'data-point';
       point.textContent = value;
       point.style.left = `${index * 60 + 20}px`;
       point.style.top = `${100 - value * 5}px`;
       container.appendChild(point);
      });

      // Position mean line
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const range = maxValue - minValue;
      const meanPosition = 100 - mean * 5;

      meanIndicator.style.display = 'block';
      meanIndicator.style.left = '20px';
      meanIndicator.style.top = `${meanPosition}px`;
      meanIndicator.style.width = `${values.length * 60}px`;

      meanLabel.style.display = 'block';
      meanLabel.style.left = `${values.length * 60 + 30}px`;
      meanLabel.style.top = `${meanPosition - 25}px`;
      meanLabel.textContent = `Mean: ${mean.toFixed(2)}`;
     }

     else {
       solution.style.display = 'none';
      }
     }

     // Initialize with default data
     calculateMean();