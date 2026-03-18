function calculateMedian() {
            const input = document.getElementById('data-input').value;
            const values = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

            if (values.length === 0) {
            alert('Please enter valid numbers separated by commas.');
            return;
            }

            // Sort the values
            const sorted = [...values].sort((a, b) => a - b);
            let median;

            if (sorted.length % 2 === 1) {
            // Odd number of values
            const medianIndex = Math.floor(sorted.length / 2);
            median = sorted[medianIndex];
            } else {
            // Even number of values
            const mid1 = sorted[sorted.length / 2 - 1];
            const mid2 = sorted[sorted.length / 2];
            median = (mid1 + mid2) / 2;
            }

            // Update visualization
            updateVisualization(sorted, median);

            // Update output
            const output = document.getElementById('demo-output');
            const isEven = sorted.length % 2 === 0;
            const medianDesc = isEven
            ? `${sorted.length / 2}rd and ${sorted.length / 2 + 1}th values`
            : `${Math.floor(sorted.length / 2) + 1}th value`;

            output.innerHTML = `<strong>Current Data:</strong> [${values.join(', ')}]<br>
            <strong>Sorted Data:</strong> [${sorted.join(', ')}]<br>
            <strong>Number of values:</strong> ${sorted.length} (${isEven ? 'even' : 'odd'})<br>
            <strong>Median position:</strong> ${medianDesc}<br>
            <strong>Median:</strong> ${median}`;

            // Re-render MathJax
            if (window.MathJax) {
            MathJax.typesetPromise([output]).catch(function(err) {
                console.log('MathJax re-render error:', err);
            });
            }
            }

            function updateVisualization(sorted, median) {
            const container = document.getElementById('sorted-data');
            const positionIndicator = document.getElementById('position-indicator');

            // Clear previous content
            container.innerHTML = '';
            positionIndicator.innerHTML = '';

            // Create position indicators
            for (let i = 0; i < sorted.length; i++) {
            const pos = document.createElement('div');
            pos.className = 'position-number';
            pos.textContent = (i + 1);
            positionIndicator.appendChild(pos);
            }

            // Create data value elements
            sorted.forEach((value, index) => {
            const valueElement = document.createElement('div');
            valueElement.className = 'data-value';
            valueElement.textContent = value;

            // Highlight median values
            if (sorted.length % 2 === 1) {
                // Odd case - single median
                if (index === Math.floor(sorted.length / 2)) {
                valueElement.classList.add('median-highlight');
                const arrow = document.createElement('div');
                arrow.className = 'median-arrow';
                arrow.textContent = 'MEDIAN';
                valueElement.appendChild(arrow);
                }
            } else {
                // Even case - two middle values
                if (index === sorted.length / 2 - 1 || index === sorted.length / 2) {
                valueElement.classList.add('median-highlight');
                if (index === sorted.length / 2 - 1) {
                const arrow = document.createElement('div');
                arrow.className = 'median-arrow';
                arrow.textContent = 'MEDIAN';
                valueElement.appendChild(arrow);
                }
                }
            }

            container.appendChild(valueElement);
            });
            }

            else {
            solution.style.display = 'none';
            }
            }

            // Initialize with default data
            calculateMedian();