# Boomi Log Troubleshooter

Analyze Boomi execution logs to find performance hotspots, visualize process flow, and extract warnings/severe events.

## Features
- **Top slow operations**: Largest execution times (ms) with context and optional document counts.
- **Process flow outline**: Ordered steps, execution times, and links (including subprocess calls).
- **Warnings/Severe extraction**: ISO timestamp, level, component, and message.

## How it works
- **UI**: `GET /` serves `templates/index.html` with a file picker and drag-and-drop upload.
- **API**: `POST /process`
  - Accepts `.txt` or `.log` file and optional `top_n` (default 10).
  - Parses the file and returns JSON with `results`, `process_flow`, `warnings_and_severe`, and original file metadata.

## Key logic
- `find_largest_ms_times(file_content, top_n=10)`
  - Finds numbers followed by `ms` using regex; keeps top N via a min-heap.
  - Adds context: line number, text, inferred shape name, and document count (if present).

- `extract_shape_name(lines, line_index)`
  - Parses shape identifiers on the current line; falls back to previous line patterns like “Executing Decision with X document(s)” or “Data Process Execution (SCRIPTING)”.

- `extract_process_flow(file_content)`
  - Extracts process name, detects steps and their execution times, and connects subprocess calls to parent steps.

- `extract_warnings_and_severe_logs(file_content)`
  - Regex for ISO timestamp + level (WARNING|SEVERE) + component + message.

## API
- **Request**: `POST /process`
  - Form-data: `file` (required), `top_n` (optional integer)
  - Only `.txt` and `.log` are accepted. Invalid uploads return HTTP 400.

- **Response (JSON)**
  - `results`: array of slow timings with context
  - `process_flow`: steps, connections, hierarchy
  - `warnings_and_severe`: extracted events
  - `original_filename`, `file_extension`

### Example
```bash
curl -X POST http://localhost:5001/process \
  -F "file=@/path/to/boomi.log" \
  -F "top_n=10"
```

## Operational notes
- **Logging**: Uses Python `logging` to trace progress; warns if flow extraction is slow.
- **Performance**: Keeps only top N times in memory via a heap.
- **Server**: Runs on port `5001` in debug mode.

## Roadmap (ideas)
- **Process run identity**: Execution ID, Process ID/Name, Environment, Node, Account.
- **Retries/backoff**: Detect retry patterns and outcomes per connector.
- **Connector outcomes**: HTTP status, operation names, response sizes, throttling/timeouts.
- **Document lifecycle**: Counts in/out per shape; throughput (docs/sec).
- **Hierarchy & Gantt**: Collapsible subprocess tree and per-step timeline.
- **Queue/wait time**: Quantify idle vs execution time.
- **Parsing robustness**: Multiple log formats, encodings, and gz support.
- **Anomaly detection**: Simple z-score/MAD vs historical in the file.
- **Export**: CSV/JSON data; PNG/SVG of graphs.
- **Configurable patterns**: Pluggable regex profiles per Boomi version.

## Development
1. Create and activate a local virtual environment.
2. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the app:
   ```bash
   python app.py
   ```
4. Open `http://localhost:5001` and upload a `.txt` or `.log` file (drag-and-drop supported).

