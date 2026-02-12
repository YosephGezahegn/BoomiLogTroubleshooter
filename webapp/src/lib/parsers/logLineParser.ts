/**
 * Log Line Parser
 * Parses tab-separated Boomi log lines into structured data
 */

import { LogLine, LOG_PATTERNS } from '../types/analysis';

/**
 * Parse a single log line from Boomi log file
 * Format: TIMESTAMP\tLOG_LEVEL\tSHAPE_NAME\tCOMPONENT\tMESSAGE
 */
export function parseLogLine(line: string, lineNumber: number): LogLine | null {
    // Skip empty lines
    if (!line.trim()) {
        return null;
    }

    // Match tab-separated format
    const match = line.match(LOG_PATTERNS.LOG_LINE);

    if (!match) {
        // Log might have a different format, try to extract what we can
        console.warn(`Failed to parse line ${lineNumber}: ${line.substring(0, 100)}...`);
        return null;
    }

    const [, timestamp, logLevel, shapeName, component, message] = match;

    return {
        timestamp: timestamp.trim(),
        logLevel: logLevel.trim(),
        shapeName: shapeName.trim(),
        component: component.trim(),
        message: message.trim(),
        lineNumber,
    };
}

/**
 * Parse multiple log lines
 */
export function parseLogLines(lines: string[]): LogLine[] {
    const parsedLines: LogLine[] = [];

    for (let i = 0; i < lines.length; i++) {
        const parsed = parseLogLine(lines[i], i + 1);
        if (parsed) {
            parsedLines.push(parsed);
        }
    }

    return parsedLines;
}

/**
 * Parse log file content (handles different line endings)
 */
export function parseLogFile(content: string): LogLine[] {
    // Split by newlines (handles \n, \r\n, and \r)
    const lines = content.split(/\r?\n/);
    return parseLogLines(lines);
}

/**
 * Filter log lines by criteria
 */
export function filterLogLines(
    lines: LogLine[],
    criteria: {
        logLevel?: string | string[];
        shapeName?: string;
        messageContains?: string;
        startTime?: string;
        endTime?: string;
    }
): LogLine[] {
    return lines.filter((line) => {
        // Filter by log level
        if (criteria.logLevel) {
            const levels = Array.isArray(criteria.logLevel)
                ? criteria.logLevel
                : [criteria.logLevel];
            if (!levels.includes(line.logLevel)) {
                return false;
            }
        }

        // Filter by shape name
        if (criteria.shapeName && line.shapeName !== criteria.shapeName) {
            return false;
        }

        // Filter by message content
        if (criteria.messageContains && !line.message.includes(criteria.messageContains)) {
            return false;
        }

        // Filter by time range
        if (criteria.startTime && line.timestamp < criteria.startTime) {
            return false;
        }
        if (criteria.endTime && line.timestamp > criteria.endTime) {
            return false;
        }

        return true;
    });
}

/**
 * Get statistics about log lines
 */
export function getLogStats(lines: LogLine[]): {
    total: number;
    byLevel: Record<string, number>;
    timeRange: { start: string; end: string } | null;
    uniqueShapes: number;
} {
    const byLevel: Record<string, number> = {};
    const shapes = new Set<string>();

    let startTime: string | null = null;
    let endTime: string | null = null;

    for (const line of lines) {
        // Count by level
        byLevel[line.logLevel] = (byLevel[line.logLevel] || 0) + 1;

        // Track unique shapes
        shapes.add(line.shapeName);

        // Track time range
        if (!startTime || line.timestamp < startTime) {
            startTime = line.timestamp;
        }
        if (!endTime || line.timestamp > endTime) {
            endTime = line.timestamp;
        }
    }

    return {
        total: lines.length,
        byLevel,
        timeRange:
            startTime && endTime ? { start: startTime, end: endTime } : null,
        uniqueShapes: shapes.size,
    };
}

/**
 * Extract execution time from message
 * Examples: "... in 1234 ms", "1234 ms", "took 1234ms"
 */
export function extractExecutionTime(message: string): number | null {
    const match = message.match(LOG_PATTERNS.EXECUTION_TIME);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

/**
 * Extract document count from message
 * Example: "Processing 123 document(s)"
 */
export function extractDocumentCount(message: string): number | null {
    const match = message.match(LOG_PATTERNS.DOCUMENT_COUNT);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

/**
 * Check if log line represents a process execution
 */
export function isProcessExecution(line: LogLine): boolean {
    return LOG_PATTERNS.PROCESS_START.test(line.message);
}

/**
 * Check if log line represents a shape execution
 */
export function isShapeExecution(line: LogLine): boolean {
    return LOG_PATTERNS.SHAPE_EXECUTION.test(line.message);
}

/**
 * Check if log line represents an error
 */
export function isError(line: LogLine): boolean {
    return line.logLevel === 'SEVERE' || line.logLevel === 'WARNING';
}

/**
 * Extract process name from process execution message
 */
export function extractProcessName(message: string): string | null {
    const match = message.match(LOG_PATTERNS.PROCESS_START);
    return match ? match[1].trim() : null;
}

/**
 * Extract shape type from shape execution message
 */
export function extractShapeType(message: string): string | null {
    const match = message.match(LOG_PATTERNS.SHAPE_EXECUTION);
    return match ? match[1].trim() : null;
}

/**
 * Calculate duration between two timestamps
 */
export function calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return end - start;
}

/**
 * Group log lines by shape name
 */
export function groupByShape(lines: LogLine[]): Map<string, LogLine[]> {
    const grouped = new Map<string, LogLine[]>();

    for (const line of lines) {
        const existing = grouped.get(line.shapeName) || [];
        existing.push(line);
        grouped.set(line.shapeName, existing);
    }

    return grouped;
}

/**
 * Group log lines by time window
 */
export function groupByTimeWindow(
    lines: LogLine[],
    windowMs: number
): Map<number, LogLine[]> {
    const grouped = new Map<number, LogLine[]>();

    for (const line of lines) {
        const timestamp = new Date(line.timestamp).getTime();
        const window = Math.floor(timestamp / windowMs);

        const existing = grouped.get(window) || [];
        existing.push(line);
        grouped.set(window, existing);
    }

    return grouped;
}
