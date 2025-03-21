#!/usr/bin/env python3
from flask import Flask, render_template, request, jsonify
import re
import heapq
from collections import defaultdict, OrderedDict
import os
import logging
import time
import traceback

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def find_largest_ms_times(file_content, top_n=10):
    """
    Analyzes the provided file content for numbers followed by ' ms.'
    and returns the top N largest numbers along with their context.
    Also extracts document counts when available.
    
    Args:
        file_content: Content of the text file as a string
        top_n: Number of top values to return (default: 10)
        
    Returns:
        List of dictionaries with time value, document count, and context information
    """
    # Regular expression to find numbers followed by " ms."
    pattern = re.compile(r'(\d+)\s+ms\.')
    
    # Regular expression to find document counts
    doc_pattern = re.compile(r'Executing .+ Shape with (\d+) document\(s\)')
    
    # Use a min heap to keep track of the top N largest numbers
    largest_times = []
    
    # Dictionary to store the context for each time value
    contexts = defaultdict(list)
    
    # Dictionary to track document counts by shape name
    shape_doc_counts = {}
    current_shape = None
    
    # Process the file content line by line
    lines = file_content.splitlines()
    for line_num, line in enumerate(lines, 1):
        # Check for document count information
        doc_match = doc_pattern.search(line)
        if doc_match:
            doc_count = int(doc_match.group(1))
            
            # Extract shape name using the new function
            shape_name = extract_shape_name(lines, line_num-1)
            if shape_name:
                shape_doc_counts[shape_name] = doc_count
                current_shape = shape_name
                logger.info(f"Found shape {shape_name} with {doc_count} documents at line {line_num}")
        
        # Check for execution time
        matches = pattern.findall(line)
        for match in matches:
            time_value = int(match)
            
            # Extract shape name using the new function
            shape_name = extract_shape_name(lines, line_num-1)
            
            # Get document count if available
            doc_count = None
            if shape_name and shape_name in shape_doc_counts:
                doc_count = shape_doc_counts[shape_name]
            elif current_shape and current_shape in shape_doc_counts:
                doc_count = shape_doc_counts[current_shape]
            
            # Store context information
            context = {
                'line_number': line_num,
                'line_text': line.strip(),
                'time_value': time_value,
                'document_count': doc_count,
                'shape_name': shape_name or current_shape
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
            
            result = {
                'time_value': time_value,
                'seconds': round(seconds, 2),
                'minutes': round(minutes, 2),
                'line_number': context['line_number'],
                'line_text': context['line_text'],
                'shape_name': context.get('shape_name')
            }
            
            # Add document count if available
            if context.get('document_count') is not None:
                result['document_count'] = context['document_count']
            
            results.append(result)
            break  # Just take the first context for each time value
    
    return results

def extract_shape_name(lines, line_index):
    """
    Extracts the shape name from a log line according to these rules:
    1. If shape has a name, extract it from the log line (e.g., "[Common] HTTP.01 HubSpot API")
    2. If shape doesn't have a name, check the line above for the type
       - e.g., "Executing Decision with X document(s)" -> "Decision"
       - e.g., "Data Process Execution (SCRIPTING)" -> "Data Process"
    
    Args:
        lines: List of all log lines
        line_index: Index of the current line
        
    Returns:
        Extracted shape name or None if not found
    """
    current_line = lines[line_index]
    
    # Case 1: Try to extract shape name from current line
    # Example: "INFO Connector [Common] HTTP.01 HubSpot API: http Connector"
    shape_match = re.search(r'INFO\s+\w+\s+(\[\w+\]\s+[\w\.\d]+\s+[^;]+)', current_line)
    if shape_match:
        return shape_match.group(1).strip()
    
    # If not found, try alternate format (just extract the shape name after INFO)
    shape_match = re.search(r'INFO\s+([^:]+?)\s+', current_line)
    shape_name = shape_match.group(1).strip() if shape_match else None
    
    # Case 2: If no shape name or shape name doesn't contain specific identifiers, check previous line
    if line_index > 0 and (not shape_name or not re.search(r'[\[\]:]', current_line)):
        previous_line = lines[line_index - 1]
        
        # Check for "Executing Decision with X document(s)"
        decision_match = re.search(r'Executing\s+(\w+)\s+with', previous_line)
        if decision_match:
            return decision_match.group(1).strip()
        
        # Check for "Data Process Execution (SCRIPTING)"
        process_match = re.search(r'(\w+\s+\w+)\s+Execution', previous_line)
        if process_match:
            return process_match.group(1).strip()
    
    return shape_name

def extract_process_flow(file_content):
    """
    Extracts the process flow from Boomi log content to visualize the sequence of operations.
    
    Args:
        file_content: Content of the log file as a string
        
    Returns:
        Dictionary with process flow information
    """
    start_time = time.time()
    logger.info("Starting process flow extraction")
    lines = file_content.splitlines()
    
    # Extract process name and steps
    process_name = None
    steps = []
    step_times = {}
    current_step = None
    connections = []
    
    # Track parent-child relationships for nested processes
    process_hierarchy = {}
    current_processes = []
    
    try:
        # Process all lines in the file
        for line_num, line in enumerate(lines, 1):
            # Check if processing is taking too long (every 5000 lines)
            if line_num % 5000 == 0:
                elapsed = time.time() - start_time
                logger.info(f"Processed {line_num} lines in {elapsed:.2f}s")
                if elapsed > 60:  # If processing takes more than 60 seconds, log a warning but continue
                    logger.warning(f"Process flow extraction taking a long time ({elapsed:.2f}s) at line {line_num}")
                    
            # Extract process name
            if "Executing Process" in line and process_name is None:
                match = re.search(r'Executing Process\s+(.+?)\s+', line)
                if match:
                    process_name = match.group(1)
                    logger.info(f"Found process name: {process_name}")
            
            # Extract steps and their execution times
            if "Executing" in line and "Shape" in line:
                match = re.search(r'INFO\s+(.+?)\s+', line)
                if match:
                    step_name = match.group(1).strip()
                    if step_name and step_name not in [s['name'] for s in steps]:
                        current_step = step_name
                        logger.info(f"Found step: {step_name}")
                        steps.append({
                            'name': step_name,
                            'line_number': line_num,
                            'type': 'step'
                        })
                        
                        # Add connection from previous step if exists
                        if len(steps) > 1:
                            connections.append({
                                'source': steps[-2]['name'],
                                'target': step_name
                            })
            
            # Extract execution times
            if "Shape executed successfully in" in line and current_step:
                match = re.search(r'in\s+(\d+)\s+ms', line)
                if match:
                    execution_time = int(match.group(1))
                    step_times[current_step] = execution_time
                    logger.info(f"Step {current_step} executed in {execution_time} ms")
                    
                    # Update the step with execution time
                    for step in steps:
                        if step['name'] == current_step:
                            step['execution_time'] = execution_time
                            break
            
            # Track process calls
            if "Executing process" in line:
                match = re.search(r'Executing process\s+\[(.+?)\]', line)
                if match and current_step:
                    subprocess_name = match.group(1)
                    current_processes.append(current_step)
                    process_hierarchy[subprocess_name] = current_step
                    logger.info(f"Found subprocess: {subprocess_name} called by {current_step}")
                    
                    # Add subprocess as a node
                    steps.append({
                        'name': subprocess_name,
                        'line_number': line_num,
                        'type': 'subprocess'
                    })
                    
                    # Add connection to subprocess
                    connections.append({
                        'source': current_step,
                        'target': subprocess_name
                    })
        
        # Update steps with execution times
        for i, step in enumerate(steps):
            if step['name'] in step_times:
                steps[i]['execution_time'] = step_times[step['name']]
            else:
                steps[i]['execution_time'] = 0
        
        # If no steps were found, add a placeholder
        if not steps:
            logger.warning("No steps found in the log file")
            steps.append({
                'name': 'No steps found',
                'line_number': 1,
                'type': 'step',
                'execution_time': 0
            })
        
        result = {
            'process_name': process_name or 'Unknown Process',
            'steps': steps,
            'connections': connections,
            'process_hierarchy': process_hierarchy
        }
        
        elapsed = time.time() - start_time
        logger.info(f"Process flow extraction complete: {len(steps)} steps, {len(connections)} connections in {elapsed:.2f}s")
        return result
    
    except Exception as e:
        logger.exception(f"Error in extract_process_flow: {str(e)}")
        # Return a minimal valid structure even if an error occurs
        return {
            'process_name': process_name or 'Error in Process',
            'steps': steps or [{'name': 'Error processing steps', 'line_number': 1, 'type': 'step', 'execution_time': 0}],
            'connections': connections,
            'process_hierarchy': process_hierarchy
        }

def extract_warnings_and_severe_logs(file_content):
    """
    Extracts WARNING and SEVERE log messages from the log file.
    
    Args:
        file_content: Content of the log file as a string
        
    Returns:
        List of dictionaries with timestamp, level, component, and message
    """
    # Regular expression to match log entries
    log_pattern = re.compile(r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s+(WARNING|SEVERE)\s+(\S+)\s+(.+)')
    
    warnings_and_severe = []
    
    # Process the file content line by line
    lines = file_content.splitlines()
    for line_num, line in enumerate(lines, 1):
        match = log_pattern.search(line)
        if match:
            timestamp, level, component, message = match.groups()
            
            warnings_and_severe.append({
                'timestamp': timestamp,
                'level': level,
                'component': component,
                'message': message,
                'line_number': line_num
            })
    
    return warnings_and_severe

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_file():
    start_time = time.time()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'})
    
    if file:
        try:
            # Check file extension
            filename = file.filename
            file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            
            if file_extension not in ['txt', 'log']:
                return jsonify({'error': 'Unsupported file type. Only .txt and .log files are supported.'})
            
            logger.info(f"Processing file: {filename} with extension: {file_extension}")
            file_content = file.read().decode('utf-8')
            
            # No longer limiting file size - process the entire file
            logger.info(f"File size: {len(file_content)} bytes")
            
            top_n = int(request.form.get('top_n', 10))
            
            # Find largest execution times
            results = find_largest_ms_times(file_content, top_n)
            logger.info(f"Found {len(results)} execution times")
            
            # Extract process flow information
            process_flow = extract_process_flow(file_content)
            
            # Extract warnings and severe logs
            warnings_and_severe = extract_warnings_and_severe_logs(file_content)
            
            response = {
                'results': results,
                'process_flow': process_flow,
                'warnings_and_severe': warnings_and_severe,
                'original_filename': filename,
                'file_extension': file_extension
            }
            
            elapsed = time.time() - start_time
            logger.info(f"Returning response to client after {elapsed:.2f}s")
            return jsonify(response)
        except Exception as e:
            logger.exception(f"Error processing file: {str(e)}")
            error_details = traceback.format_exc()
            return jsonify({
                'error': f"Error processing file: {str(e)}",
                'details': error_details
            })
    
    return jsonify({'error': 'Unknown error'})

if __name__ == '__main__':
    # Use a different port to avoid conflicts with AirPlay
    port = 5001
    logger.info(f"Starting server on port {port}")
    app.run(debug=True, port=port)
