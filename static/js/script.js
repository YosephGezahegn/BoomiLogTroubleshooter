document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('upload-form');
    const fileUpload = document.getElementById('file-upload');
    const fileName = document.getElementById('file-name');
    const loading = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const processFlowContainer = document.getElementById('process-flow-container');
    const results = document.getElementById('results');
    const resultCount = document.getElementById('result-count');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const processName = document.getElementById('process-name');
    const flowVisualization = document.getElementById('flow-visualization');
    
    // Visualization controls
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const resetView = document.getElementById('reset-view');
    
    // Visualization variables
    let svg, g, zoom;
    let processFlowData = null;
    let fetchTimeout = null;

    // Debug flag
    const DEBUG = true;
    
    // Debug function
    function debug(message, data) {
        if (DEBUG) {
            if (data) {
                console.log(`[DEBUG] ${message}`, data);
            } else {
                console.log(`[DEBUG] ${message}`);
            }
        }
    }

    debug('DOM loaded, initializing app');

    // Update file name when a file is selected
    fileUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            if (fileExtension !== 'txt' && fileExtension !== 'log') {
                showError('Unsupported file type. Only .txt and .log files are supported.');
                this.value = ''; // Clear the file input
                fileName.textContent = 'Choose a log file';
                return;
            }
            
            fileName.textContent = file.name;
            debug('File selected:', file.name);
        } else {
            fileName.textContent = 'Choose a log file';
            debug('No file selected');
        }
    });
    
    // Zoom controls
    if (zoomIn && zoomOut && resetView) {
        zoomIn.addEventListener('click', () => {
            debug('Zoom in clicked');
            if (zoom) zoom.scaleBy(svg.transition().duration(750), 1.2);
        });
        
        zoomOut.addEventListener('click', () => {
            debug('Zoom out clicked');
            if (zoom) zoom.scaleBy(svg.transition().duration(750), 0.8);
        });
        
        resetView.addEventListener('click', () => {
            debug('Reset view clicked');
            if (zoom) {
                svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity.translate(flowVisualization.clientWidth / 2, 100).scale(0.8)
                );
            }
        });
    }

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        debug('Form submitted');
        
        // Hide previous results and errors
        resultsContainer.classList.add('hidden');
        processFlowContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        
        // Check if a file was selected
        if (!fileUpload.files || !fileUpload.files[0]) {
            showError('Please select a log file to analyze.');
            return;
        }
        
        // Show loading spinner
        loading.classList.remove('hidden');
        
        // Create form data for submission
        const formData = new FormData(form);
        
        debug('Sending request to server');
        
        // Clear any existing timeout
        if (fetchTimeout) {
            clearTimeout(fetchTimeout);
        }
        
        // Set a timeout to prevent hanging
        fetchTimeout = setTimeout(() => {
            loading.classList.add('hidden');
            showError('Request timed out. The server took too long to respond.');
            debug('Request timed out');
        }, 30000); // 30 second timeout
        
        // Send the request to the server
        fetch('/process', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // Clear the timeout since we got a response
            clearTimeout(fetchTimeout);
            fetchTimeout = null;
            
            debug('Received response from server', { status: response.status });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide loading spinner
            loading.classList.add('hidden');
            
            debug('Parsed response data', data);
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            try {
                // Display file information
                let fileInfo = '';
                if (data.file_extension === 'log') {
                    fileInfo = `Processed file: ${data.original_filename} (converted from .log to .txt)`;
                } else {
                    fileInfo = `Processed file: ${data.original_filename}`;
                }
                
                // Create file info element
                const fileInfoElement = document.createElement('div');
                fileInfoElement.className = 'file-info';
                fileInfoElement.textContent = fileInfo;
                
                // Display execution times
                displayResults(data.results);
                
                // Add file info at the top of results
                results.insertBefore(fileInfoElement, results.firstChild);
                
                // Display warnings and severe logs
                if (data.warnings_and_severe) {
                    displayWarningsAndSevere(data.warnings_and_severe);
                }
                
                // Hide process flow container since we're removing this visualization
                processFlowContainer.classList.add('hidden');
            } catch (error) {
                showError('Error processing data: ' + error.message);
                console.error('Error processing data:', error);
            }
        })
        .catch(error => {
            // Clear the timeout if there was an error
            if (fetchTimeout) {
                clearTimeout(fetchTimeout);
                fetchTimeout = null;
            }
            
            loading.classList.add('hidden');
            showError('An error occurred while processing the file: ' + error.message);
            console.error('Error:', error);
            debug('Fetch error', error);
        });
    });

    // Function to display error messages
    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
        debug('Showing error:', message);
    }

    // Function to display the results
    function displayResults(resultsData) {
        debug('Displaying results', { count: resultsData ? resultsData.length : 0 });
        
        // Clear previous results
        results.innerHTML = '';
        
        if (!resultsData || resultsData.length === 0) {
            showError('No execution times found in the log file.');
            return;
        }
        
        // Update the result count
        resultCount.textContent = resultsData.length;
        
        // Calculate total execution time (sum of all time values)
        const totalExecutionTime = resultsData.reduce((total, item) => total + item.time_value, 0);
        const totalSeconds = totalExecutionTime / 1000;
        const totalMinutes = totalSeconds / 60;
        
        // Create total execution time element
        const totalTimeElement = document.createElement('div');
        totalTimeElement.className = 'total-execution-time';
        totalTimeElement.textContent = `Total Execution Time: ${totalExecutionTime.toLocaleString()} ms (${totalSeconds.toFixed(2)} seconds, ${totalMinutes.toFixed(2)} minutes)`;
        results.appendChild(totalTimeElement);
        
        // Create result items
        resultsData.forEach((item, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            const resultHeader = document.createElement('div');
            resultHeader.className = 'result-header';
            
            const rankAndTime = document.createElement('div');
            rankAndTime.className = 'time-value';
            
            // Format the time display to include ms, seconds, and minutes
            let timeDisplay = `${index + 1}. ${item.time_value.toLocaleString()} ms`;
            
            // Add seconds if available
            if (item.seconds) {
                timeDisplay += ` (${item.seconds} seconds`;
                
                // Add minutes if significant
                if (item.minutes && item.minutes >= 0.01) {
                    timeDisplay += `, ${item.minutes} minutes`;
                }
                
                timeDisplay += `)`;
            }
            
            rankAndTime.textContent = timeDisplay;
            
            const lineNumber = document.createElement('div');
            lineNumber.className = 'line-number';
            lineNumber.textContent = `Line: ${item.line_number}`;
            
            resultHeader.appendChild(rankAndTime);
            resultHeader.appendChild(lineNumber);
            
            // Create document count display if available
            if (item.document_count !== undefined) {
                const docCount = document.createElement('div');
                docCount.className = 'document-count';
                docCount.textContent = `Documents processed: ${item.document_count.toLocaleString()}`;
                resultHeader.appendChild(docCount);
            }
            
            // Create shape name display with copy icon if available
            if (item.shape_name) {
                const shapeNameContainer = document.createElement('div');
                shapeNameContainer.className = 'shape-name-container';
                
                const shapeName = document.createElement('div');
                shapeName.className = 'shape-name';
                shapeName.textContent = `Shape: ${item.shape_name}`;
                
                const copyIcon = document.createElement('span');
                copyIcon.className = 'copy-icon';
                copyIcon.innerHTML = '📋';
                copyIcon.title = 'Copy shape name';
                copyIcon.style.cursor = 'pointer';
                copyIcon.style.marginLeft = '5px';
                
                // Add click event to copy the shape name
                copyIcon.addEventListener('click', function() {
                    navigator.clipboard.writeText(item.shape_name)
                        .then(() => {
                            // Show a temporary "Copied!" message
                            const originalText = copyIcon.innerHTML;
                            copyIcon.innerHTML = '✓';
                            setTimeout(() => {
                                copyIcon.innerHTML = originalText;
                            }, 1000);
                        })
                        .catch(err => {
                            console.error('Failed to copy text: ', err);
                        });
                });
                
                shapeNameContainer.appendChild(shapeName);
                shapeNameContainer.appendChild(copyIcon);
                resultItem.appendChild(shapeNameContainer);
            }
            
            const lineText = document.createElement('div');
            lineText.className = 'line-text';
            lineText.textContent = item.line_text;
            
            resultItem.appendChild(resultHeader);
            resultItem.appendChild(lineText);
            
            results.appendChild(resultItem);
        });
        
        // Show the results container
        resultsContainer.classList.remove('hidden');
        debug('Results displayed successfully');
    }
    
    // Function to display warnings and severe logs
    function displayWarningsAndSevere(warningsData) {
        debug('Displaying warnings and severe logs', { count: warningsData ? warningsData.length : 0 });
        
        if (!warningsData || warningsData.length === 0) {
            debug('No warnings or severe logs found');
            return;
        }
        
        // Create warnings container
        const warningsContainer = document.createElement('div');
        warningsContainer.className = 'warnings-container';
        
        // Create header
        const warningsHeader = document.createElement('h2');
        warningsHeader.textContent = 'Warnings and Severe Logs';
        warningsContainer.appendChild(warningsHeader);
        
        // Create warnings list
        warningsData.forEach(warning => {
            const warningItem = document.createElement('div');
            warningItem.className = 'warning-item';
            
            if (warning.level === 'SEVERE') {
                warningItem.classList.add('severe');
            }
            
            const warningHeader = document.createElement('div');
            warningHeader.className = 'warning-header';
            
            const timestamp = document.createElement('span');
            timestamp.className = 'warning-timestamp';
            timestamp.textContent = warning.timestamp;
            
            const level = document.createElement('span');
            level.className = 'warning-level';
            level.textContent = warning.level;
            
            const component = document.createElement('span');
            component.className = 'warning-component';
            component.textContent = warning.component;
            
            warningHeader.appendChild(timestamp);
            warningHeader.appendChild(level);
            warningHeader.appendChild(component);
            
            const message = document.createElement('div');
            message.className = 'warning-message';
            message.textContent = warning.message;
            
            warningItem.appendChild(warningHeader);
            warningItem.appendChild(message);
            
            warningsContainer.appendChild(warningItem);
        });
        
        // Add warnings container to results
        results.appendChild(warningsContainer);
    }
});
