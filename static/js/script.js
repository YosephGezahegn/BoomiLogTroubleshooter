document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('upload-form');
    const fileUpload = document.getElementById('file-upload');
    const fileName = document.getElementById('file-name');
    const loading = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const results = document.getElementById('results');
    const resultCount = document.getElementById('result-count');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');

    // Update file name when a file is selected
    fileUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            fileName.textContent = this.files[0].name;
        } else {
            fileName.textContent = 'Choose a log file';
        }
    });

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Hide previous results and errors
        resultsContainer.classList.add('hidden');
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
        
        // Send the request to the server
        fetch('/process', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading spinner
            loading.classList.add('hidden');
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            displayResults(data.results);
        })
        .catch(error => {
            loading.classList.add('hidden');
            showError('An error occurred while processing the file: ' + error.message);
        });
    });

    // Function to display error messages
    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
    }

    // Function to display the results
    function displayResults(resultsData) {
        // Clear previous results
        results.innerHTML = '';
        
        if (!resultsData || resultsData.length === 0) {
            showError('No execution times found in the log file.');
            return;
        }
        
        // Update the result count
        resultCount.textContent = resultsData.length;
        
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
            
            const lineText = document.createElement('div');
            lineText.className = 'line-text';
            lineText.textContent = item.line_text;
            
            resultItem.appendChild(resultHeader);
            resultItem.appendChild(lineText);
            
            results.appendChild(resultItem);
        });
        
        // Show the results container
        resultsContainer.classList.remove('hidden');
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
});
