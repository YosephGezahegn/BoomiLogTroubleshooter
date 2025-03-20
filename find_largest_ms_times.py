#!/usr/bin/env python3
import os
import re
import heapq
from collections import defaultdict

def find_largest_ms_times(directory_path, top_n=10):
    """
    Scans all text files in the given directory for numbers followed by ' ms.'
    and returns the top N largest numbers along with their context.
    
    Args:
        directory_path: Path to the directory containing text files
        top_n: Number of top values to return (default: 10)
        
    Returns:
        List of tuples (number, context) sorted by number in descending order
    """
    # Regular expression to find numbers followed by " ms."
    # This captures the number in a group and looks for " ms." after it
    pattern = re.compile(r'(\d+)\s+ms\.')
    
    # Use a min heap to keep track of the top N largest numbers
    # We'll store negative values to make it a max heap
    largest_times = []
    
    # Dictionary to store the context for each time value
    contexts = defaultdict(list)
    
    # Walk through all files in the directory
    for root, _, files in os.walk(directory_path):
        for file_name in files:
            if file_name.endswith('.txt'):
                file_path = os.path.join(root, file_name)
                try:
                    with open(file_path, 'r', encoding='utf-8') as file:
                        for line_num, line in enumerate(file, 1):
                            matches = pattern.findall(line)
                            for match in matches:
                                time_value = int(match)
                                
                                # Store context information
                                context = {
                                    'file': file_name,
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
                except Exception as e:
                    print(f"Error processing file {file_path}: {e}")
    
    # Sort the results in descending order
    sorted_times = sorted(largest_times, reverse=True)
    
    # Prepare the results with context
    results = []
    for time_value in sorted_times:
        for context in contexts[time_value]:
            results.append((time_value, context))
            break  # Just take the first context for each time value
    
    return results

def format_time(ms):
    """
    Formats milliseconds into appropriate time units (ms, seconds, minutes)
    
    Args:
        ms: Time in milliseconds
        
    Returns:
        Formatted string with time in multiple units
    """
    seconds = ms / 1000
    minutes = seconds / 60
    
    if minutes >= 1:
        return f"{ms} ms ({seconds:.2f} seconds, {minutes:.2f} minutes)"
    elif seconds >= 1:
        return f"{ms} ms ({seconds:.2f} seconds)"
    else:
        return f"{ms} ms"

def main():
    # Get the directory containing the script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Find the top 10 largest ms times
    results = find_largest_ms_times(current_dir)
    
    # Print the results
    print(f"\nTop {len(results)} largest execution times:")
    print("-" * 80)
    for i, (time_value, context) in enumerate(results, 1):
        formatted_time = format_time(time_value)
        print(f"{i}. {formatted_time} - File: {context['file']}, Line: {context['line_number']}")
        print(f"   Context: {context['line_text']}")
        print("-" * 80)

if __name__ == "__main__":
    main()
