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
      let modeType = '';
      if (modes.length === 1 && maxFreq > 1) {
       modeType = 'Unimodal';
      } else if (modes.length === 2) {
       modeType = 'Bimodal';
      } else if (modes.length > 2) {
       modeType = 'Multimodal';
      } else {
       modeType = 'No mode';
       modes.length = 0; // Clear modes if no mode exists
      }

      // Update visualization
      updateVisualization(values, frequency, modes);

      // Create frequency table HTML
      let tableHTML = '<table><tr><th>Value</th><th>Frequency</th></tr>';
      Object.keys(frequency).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(value => {
       const isMode = modes.includes(parseFloat(value));
       const rowClass = isMode ? 'mode-row' : '';
       tableHTML += `<tr class="${rowClass}"><td>${value}</td><td>${frequency[value]}</td></tr>`;
      });
      tableHTML += '</table>';

      // Update output
      const output = document.getElementById('demo-output');
      output.innerHTML = `<strong>Current Data:</strong> [${values.join(', ')}]<br>
      <strong>Frequency Table:</strong><br>
      <div class="frequency-table" style="margin: 10px 0;">${tableHTML}</div>
      <strong>Mode:</strong> ${modes.length > 0 ? modes.join(', ') + ` (appears ${maxFreq} time${maxFreq > 1 ? 's' : ''})` : 'No mode'}<br>
      <strong>Mode Type:</strong> ${modeType}`;

      // Re-render MathJax
      if (window.MathJax) {
       MathJax.typesetPromise([output]).catch(function(err) {
        console.log('MathJax re-render error:', err);
       });
      }
     }

     function updateVisualization(values, frequency, modes) {
      const container = document.getElementById('data-frequency');

      // Clear previous content
      container.innerHTML = '';

      // Get unique values and sort them
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

      // Create data items
      uniqueValues.forEach(value => {
       const item = document.createElement('div');
       item.className = 'data-item';
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

     else {
       solution.style.display = 'none';
      }
     }

     // Initialize with default data
     calculateMode();