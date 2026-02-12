/**
 * Error Extractor
 * Extracts, categorizes, and analyzes errors and warnings from log lines
 */

import {
    LogLine,
    ErrorEntry,
    ErrorAnalysis,
    LOG_PATTERNS,
} from '../types/analysis';
import { isError } from './logLineParser';

/**
 * Extract all errors and warnings from log lines
 */
export function extractErrors(lines: LogLine[]): ErrorEntry[] {
    const errors: ErrorEntry[] = [];

    for (const line of lines) {
        if (isError(line)) {
            const error = parseErrorEntry(line);
            if (error) {
                errors.push(error);
            }
        }
    }

    return errors;
}

/**
 * Parse a single error entry from a log line
 */
function parseErrorEntry(line: LogLine): ErrorEntry | null {
    if (!isError(line)) {
        return null;
    }

    const severity = line.logLevel === 'SEVERE' ? 'SEVERE' : 'WARNING';

    // Try to extract HTTP status code
    const httpMatch = line.message.match(LOG_PATTERNS.HTTP_ERROR);
    const statusCode = httpMatch ? parseInt(httpMatch[1], 10) : undefined;

    // Determine error type
    const errorType = determineErrorType(line.message, statusCode);

    return {
        timestamp: line.timestamp,
        shapeName: line.shapeName,
        severity,
        errorType,
        statusCode,
        message: line.message,
        component: line.component,
        lineNumber: line.lineNumber,
    };
}

/**
 * Determine error type from message content and status code
 */
function determineErrorType(message: string, statusCode?: number): string {
    // HTTP errors
    if (statusCode) {
        if (statusCode >= 400 && statusCode < 500) {
            return `HTTP ${statusCode} (Client Error)`;
        } else if (statusCode >= 500) {
            return `HTTP ${statusCode} (Server Error)`;
        }
    }

    // Common error patterns
    const messageUpper = message.toUpperCase();

    if (messageUpper.includes('TIMEOUT')) {
        return 'Timeout Error';
    } else if (messageUpper.includes('CONNECTION')) {
        return 'Connection Error';
    } else if (messageUpper.includes('AUTHENTICATION') || messageUpper.includes('UNAUTHORIZED')) {
        return 'Authentication Error';
    } else if (messageUpper.includes('PERMISSION') || messageUpper.includes('FORBIDDEN')) {
        return 'Permission Error';
    } else if (messageUpper.includes('NOT FOUND') || messageUpper.includes('404')) {
        return 'Not Found Error';
    } else if (messageUpper.includes('VALIDATION')) {
        return 'Validation Error';
    } else if (messageUpper.includes('DATABASE') || messageUpper.includes('SQL')) {
        return 'Database Error';
    } else if (messageUpper.includes('DISK') || messageUpper.includes('STORAGE')) {
        return 'Storage Error';
    } else if (messageUpper.includes('MEMORY')) {
        return 'Memory Error';
    } else if (messageUpper.includes('PARSE') || messageUpper.includes('SYNTAX')) {
        return 'Parse Error';
    } else if (messageUpper.includes('NULL')) {
        return 'Null Pointer Error';
    } else if (messageUpper.includes('CONFIGURATION') || messageUpper.includes('CONFIG')) {
        return 'Configuration Error';
    }

    // Default
    return 'General Error';
}

/**
 * Perform complete error analysis
 */
export function analyzeErrors(lines: LogLine[]): ErrorAnalysis {
    const errors = extractErrors(lines);

    if (errors.length === 0) {
        return {
            errors: [],
            categorized: {
                byType: {},
                bySeverity: {},
                byStatusCode: {},
            },
            timeline: [],
            summary: {
                total: 0,
                severe: 0,
                warnings: 0,
                httpErrors: 0,
            },
        };
    }

    // Categorize errors
    const byType: Record<string, ErrorEntry[]> = {};
    const bySeverity: Record<string, ErrorEntry[]> = {};
    const byStatusCode: Record<number, ErrorEntry[]> = {};

    let severeCount = 0;
    let warningCount = 0;
    let httpErrorCount = 0;

    for (const error of errors) {
        // By type
        if (!byType[error.errorType || 'Unknown']) {
            byType[error.errorType || 'Unknown'] = [];
        }
        byType[error.errorType || 'Unknown'].push(error);

        // By severity
        if (!bySeverity[error.severity]) {
            bySeverity[error.severity] = [];
        }
        bySeverity[error.severity].push(error);

        // By status code
        if (error.statusCode) {
            if (!byStatusCode[error.statusCode]) {
                byStatusCode[error.statusCode] = [];
            }
            byStatusCode[error.statusCode].push(error);
            httpErrorCount++;
        }

        // Count by severity
        if (error.severity === 'SEVERE') {
            severeCount++;
        } else {
            warningCount++;
        }
    }

    // Build timeline (group by time window)
    const timeline = buildErrorTimeline(errors);

    // Find most common error type
    const typeCounts = Object.entries(byType).map(([type, errs]) => ({
        type,
        count: errs.length,
    }));
    typeCounts.sort((a, b) => b.count - a.count);
    const mostCommonType = typeCounts[0]?.type;

    return {
        errors,
        categorized: {
            byType,
            bySeverity,
            byStatusCode,
        },
        timeline,
        summary: {
            total: errors.length,
            severe: severeCount,
            warnings: warningCount,
            httpErrors: httpErrorCount,
            mostCommonType,
        },
    };
}

/**
 * Build error timeline (group errors by time window)
 */
function buildErrorTimeline(
    errors: ErrorEntry[],
    windowMs: number = 60000 // 1 minute windows
): Array<{
    timestamp: string;
    count: number;
    severity: string;
}> {
    if (errors.length === 0) {
        return [];
    }

    // Group errors by time window
    const windows = new Map<number, { severe: number; warning: number; timestamp: string }>();

    for (const error of errors) {
        const timestamp = new Date(error.timestamp).getTime();
        const window = Math.floor(timestamp / windowMs);

        if (!windows.has(window)) {
            windows.set(window, {
                severe: 0,
                warning: 0,
                timestamp: new Date(window * windowMs).toISOString(),
            });
        }

        const windowData = windows.get(window)!;
        if (error.severity === 'SEVERE') {
            windowData.severe++;
        } else {
            windowData.warning++;
        }
    }

    // Convert to array and format
    const timeline: Array<{
        timestamp: string;
        count: number;
        severity: string;
    }> = [];

    for (const [, data] of windows) {
        if (data.severe > 0) {
            timeline.push({
                timestamp: data.timestamp,
                count: data.severe,
                severity: 'SEVERE',
            });
        }
        if (data.warning > 0) {
            timeline.push({
                timestamp: data.timestamp,
                count: data.warning,
                severity: 'WARNING',
            });
        }
    }

    // Sort by timestamp
    timeline.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return timeline;
}

/**
 * Calculate error rate (errors per 1000 lines)
 */
export function calculateErrorRate(
    errorCount: number,
    totalLines: number
): number {
    if (totalLines === 0) return 0;
    return (errorCount / totalLines) * 1000;
}

/**
 * Find error patterns (recurring errors)
 */
export function findErrorPatterns(errors: ErrorEntry[]): Array<{
    pattern: string;
    count: number;
    firstOccurrence: string;
    lastOccurrence: string;
    severity: string;
    examples: ErrorEntry[];
}> {
    // Group by error message similarity (first 100 chars)
    const patterns = new Map<string, ErrorEntry[]>();

    for (const error of errors) {
        const pattern = error.message.substring(0, 100);
        if (!patterns.has(pattern)) {
            patterns.set(pattern, []);
        }
        patterns.get(pattern)!.push(error);
    }

    // Convert to result format
    const result = Array.from(patterns.entries())
        .map(([pattern, errs]) => ({
            pattern,
            count: errs.length,
            firstOccurrence: errs[0].timestamp,
            lastOccurrence: errs[errs.length - 1].timestamp,
            severity: errs[0].severity,
            examples: errs.slice(0, 3), // First 3 examples
        }))
        .filter((p) => p.count > 1) // Only recurring errors
        .sort((a, b) => b.count - a.count); // Sort by frequency

    return result;
}

/**
 * Get errors by shape name
 */
export function getErrorsByShape(
    errors: ErrorEntry[]
): Map<string, ErrorEntry[]> {
    const byShape = new Map<string, ErrorEntry[]>();

    for (const error of errors) {
        if (!byShape.has(error.shapeName)) {
            byShape.set(error.shapeName, []);
        }
        byShape.get(error.shapeName)!.push(error);
    }

    return byShape;
}

/**
 * Find shapes with most errors
 */
export function getTopErrorShapes(
    errors: ErrorEntry[],
    n: number = 10
): Array<{
    shapeName: string;
    errorCount: number;
    severeCount: number;
    warningCount: number;
    errors: ErrorEntry[];
}> {
    const byShape = getErrorsByShape(errors);

    const result = Array.from(byShape.entries())
        .map(([shapeName, errs]) => ({
            shapeName,
            errorCount: errs.length,
            severeCount: errs.filter((e) => e.severity === 'SEVERE').length,
            warningCount: errs.filter((e) => e.severity === 'WARNING').length,
            errors: errs,
        }))
        .sort((a, b) => b.errorCount - a.errorCount)
        .slice(0, n);

    return result;
}

/**
 * Check if errors indicate a critical failure
 */
export function isCriticalFailure(analysis: ErrorAnalysis): {
    isCritical: boolean;
    reason?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
} {
    const { summary } = analysis;

    // Critical: High number of severe errors
    if (summary.severe > 10) {
        return {
            isCritical: true,
            reason: `${summary.severe} severe errors detected`,
            severity: 'critical',
        };
    }

    // Critical: Multiple HTTP 500 errors
    const http500s = Object.keys(analysis.categorized.byStatusCode)
        .filter((code) => parseInt(code) >= 500)
        .reduce((sum, code) => sum + analysis.categorized.byStatusCode[parseInt(code)].length, 0);

    if (http500s > 5) {
        return {
            isCritical: true,
            reason: `${http500s} server errors (HTTP 500+)`,
            severity: 'critical',
        };
    }

    // High: Some severe errors
    if (summary.severe > 0) {
        return {
            isCritical: false,
            reason: `${summary.severe} severe error(s)`,
            severity: 'high',
        };
    }

    // Medium: Many warnings
    if (summary.warnings > 20) {
        return {
            isCritical: false,
            reason: `${summary.warnings} warnings`,
            severity: 'medium',
        };
    }

    // Low: Few warnings
    if (summary.warnings > 0) {
        return {
            isCritical: false,
            severity: 'low',
        };
    }

    // No issues
    return {
        isCritical: false,
        severity: 'low',
    };
}

/**
 * Format error summary for display
 */
export function formatErrorSummary(analysis: ErrorAnalysis): string {
    const { summary } = analysis;

    if (summary.total === 0) {
        return '✅ No errors or warnings detected';
    }

    const parts: string[] = [];

    if (summary.severe > 0) {
        parts.push(`🔴 ${summary.severe} severe error${summary.severe > 1 ? 's' : ''}`);
    }

    if (summary.warnings > 0) {
        parts.push(`⚠️  ${summary.warnings} warning${summary.warnings > 1 ? 's' : ''}`);
    }

    if (summary.mostCommonType) {
        parts.push(`Most common: ${summary.mostCommonType}`);
    }

    return parts.join(' | ');
}

/**
 * Get error details for a specific line number
 */
export function getErrorAtLine(
    errors: ErrorEntry[],
    lineNumber: number
): ErrorEntry | undefined {
    return errors.find((e) => e.lineNumber === lineNumber);
}

/**
 * Filter errors by time range
 */
export function filterErrorsByTimeRange(
    errors: ErrorEntry[],
    startTime: string,
    endTime: string
): ErrorEntry[] {
    return errors.filter(
        (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );
}

/**
 * Get error density (errors per time window)
 */
export function getErrorDensity(
    errors: ErrorEntry[],
    windowMs: number = 300000 // 5 minutes
): Array<{
    windowStart: string;
    windowEnd: string;
    errorCount: number;
    errorsPerMinute: number;
}> {
    if (errors.length === 0) {
        return [];
    }

    const windows = new Map<number, ErrorEntry[]>();

    for (const error of errors) {
        const timestamp = new Date(error.timestamp).getTime();
        const window = Math.floor(timestamp / windowMs);

        if (!windows.has(window)) {
            windows.set(window, []);
        }
        windows.get(window)!.push(error);
    }

    const result = Array.from(windows.entries())
        .map(([window, errs]) => {
            const windowStart = new Date(window * windowMs);
            const windowEnd = new Date((window + 1) * windowMs);
            const minutesInWindow = windowMs / 60000;

            return {
                windowStart: windowStart.toISOString(),
                windowEnd: windowEnd.toISOString(),
                errorCount: errs.length,
                errorsPerMinute: errs.length / minutesInWindow,
            };
        })
        .sort((a, b) => a.windowStart.localeCompare(b.windowStart));

    return result;
}
