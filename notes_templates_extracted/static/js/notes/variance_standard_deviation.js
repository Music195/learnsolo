function calculateVarianceSD() {
      const input = document.getElementById('data-input').value;
      const values = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

      if (values.length < 2) {
       alert('Please enter at least 2 values.');
       return;
      }

      const calculationType = document.getElementById('calculation-type').value;
      const n = values.length;

      // Calculate mean
      const mean = values.reduce((sum, val) => sum + val, 0) / n;

      // Calculate deviations and squared deviations
      const deviations = values.map(val => val - mean);
      const squaredDeviations = deviations.map(dev => dev * dev);
      const sumSquaredDeviations = squaredDeviations.reduce((sum, val) => sum + val, 0);

      // Calculate variance
      const divisor = calculationType === 'sample' ? n - 1 : n;
      const variance = sumSquaredDeviations / divisor;

      // Calculate standard deviation
      const stdDev = Math.sqrt(variance);

      // Calculate range
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;

      // Update visualization
      updateDeviationVisualization(values, mean, deviations);

      // Update output
      const output = document.getElementById('demo-output');
      output.innerHTML = `<strong>Current Data:</strong> [${values.join(', ')}]<br>
      <strong>Mean (${calculationType === 'sample' ? 'x̄' : 'μ'}):</strong> ${mean.toFixed(2)}<br>
      <strong>Calculation Type:</strong> ${calculationType.charAt(0).toUpperCase() + calculationType.slice(1)}<br>
      <div class="statistics-summary">
       <div class="stat-item">
        <div class="value">${variance.toFixed(2)}</div>
        <div class="label">Variance (${calculationType === 'sample' ? 's²' : 'σ²'})</div>
       </div>
       <div class="stat-item">
        <div class="value">${stdDev.toFixed(2)}</div>
        <div class="label">Std Dev (${calculationType === 'sample' ? 's' : 'σ'})</div>
       </div>
       <div class="stat-item">
        <div class="value">${range}</div>
        <div class="label">Range</div>
       </div>
       <div class="stat-item">
        <div class="value">${min}</div>
        <div class="label">Min</div>
       </div>
       <div class="stat-item">
        <div class="value">${max}</div>
        <div class="label">Max</div>
       </div>
      </div>`;

      // Re-render MathJax
      if (window.MathJax) {
       MathJax.typesetPromise([output]).catch(function(err) {
        console.log('MathJax re-render error:', err);
       });
      }
     }

     function updateDeviationVisualization(values, mean, deviations) {
      const container = document.getElementById('data-deviations');

      // Clear previous content
      container.innerHTML = '';

      // Create data items
      values.forEach((value, index) => {
       const item = document.createElement('div');
       item.className = 'deviation-item';
       item.textContent = value;

       // Add deviation label
       const label = document.createElement('div');
       label.className = 'deviation-label';
       label.textContent = deviations[index].toFixed(1);
       item.appendChild(label);

       // Highlight mean
       if (Math.abs(value - mean) < 0.001) {
        item.classList.add('mean');
       }

       container.appendChild(item);
      });
     }

     else {
       solution.style.display = 'none';
      }
     }

     // Initialize with default data
     calculateVarianceSD();