#!/usr/bin/env python3
from flask import Flask, render_template, request, jsonify
import re
import heapq
from collections import defaultdict
import os

app = Flask(__name__)

def find_largest_ms_times(file_content, top_n=10):
    """
    Analyzes the provided file content for numbers followed by ' ms.'
    and returns the top N largest numbers along with their context.
    
    Args:
        file_content: Content of the text file as a string
        top_n: Number of top values to return (default: 10)
        
    Returns:
        List of dictionaries with time value and context information
    """
    # Regular expression to find numbers followed by " ms."
    pattern = re.compile(r'(\d+)\s+ms\.')
    
    # Use a min heap to keep track of the top N largest numbers
    largest_times = []
    
    # Dictionary to store the context for each time value
    contexts = defaultdict(list)
    
    # Process the file content line by line
    for line_num, line in enumerate(file_content.splitlines(), 1):
        matches = pattern.findall(line)
        for match in matches:
            time_value = int(match)
            
            # Store context information
            context = {
                'line_number': line_num,
                'line_text': line.strip(),
                'time_value': time_value
            }
            contexts[time_value].append(context)
            
            # Update the heap with the largest values
            if len(largest_times) < top_n:
                heapq.heappush(largest_times, time_value)
            elif time_value > largest_times[0]:
                heapq.heappushpop(largest_times, time_value)
    
    # Sort the results in descending order
    sorted_times = sorted(largest_times, reverse=True)
    
    # Prepare the results with context
    results = []
    for time_value in sorted_times:
        for context in contexts[time_value]:
            # Calculate time in seconds and minutes
            seconds = time_value / 1000
            minutes = seconds / 60
            
            results.append({
                'time_value': time_value,
                'seconds': round(seconds, 2),
                'minutes': round(minutes, 2),
                'line_number': context['line_number'],
                'line_text': context['line_text']
            })
            break  # Just take the first context for each time value
    
    return results

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    
    if file:
        try:
            file_content = file.read().decode('utf-8')
            top_n = int(request.form.get('top_n', 10))
            results = find_largest_ms_times(file_content, top_n)
            return jsonify({'results': results})
        except Exception as e:
            return jsonify({'error': str(e)})
    
    return jsonify({'error': 'Unknown error'})

if __name__ == '__main__':
    app.run(debug=True)
