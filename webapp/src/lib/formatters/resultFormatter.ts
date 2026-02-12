/**
 * Result Formatter
 * Formats analysis results for API responses and UI display
 */

import { AnalysisResult } from '../types/analysis';
import { formatExecutionTime } from '../parsers/timeExtractor';
import { formatErrorSummary } from '../parsers/errorExtractor';
import { formatConnectorSummary } from '../parsers/connectorExtractor';
import { formatPaginationSummary } from '../parsers/paginationDetector';

/**
 * Format analysis result for API response
 */
export function formatAnalysisResult(result: AnalysisResult): any {
    return {
        summary: formatSummary(result),
        performance: formatPerformance(result),
        errors: formatErrors(result),
        connectors: formatConnectors(result),
        flow: formatFlow(result),
        pagination: formatPagination(result),
    };
}

/**
 * Format summary section
 */
function formatSummary(result: AnalysisResult): any {
    const { summary } = result;

    return {
        file: {
            name: summary.fileName,
            size: formatFileSize(summary.fileSize),
            sizeBytes: summary.fileSize,
            lines: summary.lineCount,
        },
        execution: {
            process: summary.processName || 'Unknown',
            processId: summary.processId,
            environment: summary.environment || 'Unknown',
            startTime: summary.startTime,
            endTime: summary.endTime,
            duration: summary.duration ? formatExecutionTime(summary.duration) : 'Unknown',
            durationMs: summary.duration,
        },
        metrics: {
            totalShapes: summary.totalShapes,
            documentsProcessed: summary.documentsProcessed.toLocaleString(),
            averageShapeTime: summary.averageShapeTime
                ? `${summary.averageShapeTime.toFixed(2)}ms`
                : 'N/A',
            medianShapeTime: summary.medianShapeTime
                ? `${summary.medianShapeTime.toFixed(2)}ms`
                : 'N/A',
        },
        health: {
            status: getHealthStatus(result),
            errors: summary.errorCount,
            warnings: summary.warningCount,
            severe: summary.severeCount,
        },
    };
}

/**
 * Format performance section
 */
function formatPerformance(result: AnalysisResult): any {
    return {
        topSlowShapes: result.topSlowShapes.map((shape, index) => ({
            rank: index + 1,
            name: shape.shapeName,
            executionTime: formatExecutionTime(shape.executionTime),
            executionTimeMs: shape.executionTime,
            occurredAt: shape.occurredAt,
            documents: shape.documents,
            component: shape.component,
            lineNumber: shape.lineNumber,
        })),
        summary: {
            count: result.topSlowShapes.length,
            totalTime: result.topSlowShapes.reduce((sum, s) => sum + s.executionTime, 0),
            totalTimeFormatted: formatExecutionTime(
                result.topSlowShapes.reduce((sum, s) => sum + s.executionTime, 0)
            ),
        },
    };
}

/**
 * Format errors section
 */
function formatErrors(result: AnalysisResult): any {
    const { errorAnalysis } = result;

    return {
        summary: {
            total: errorAnalysis.summary.total,
            severe: errorAnalysis.summary.severe,
            warnings: errorAnalysis.summary.warnings,
            httpErrors: errorAnalysis.summary.httpErrors,
            mostCommonType: errorAnalysis.summary.mostCommonType,
            formatted: formatErrorSummary(errorAnalysis),
        },
        byType: Object.entries(errorAnalysis.categorized.byType).map(([type, errors]) => ({
            type,
            count: errors.length,
            percentage: ((errors.length / errorAnalysis.summary.total) * 100).toFixed(1),
        })),
        bySeverity: Object.entries(errorAnalysis.categorized.bySeverity).map(([severity, errors]) => ({
            severity,
            count: errors.length,
            percentage: ((errors.length / errorAnalysis.summary.total) * 100).toFixed(1),
        })),
        timeline: errorAnalysis.timeline,
        recentErrors: errorAnalysis.errors.slice(0, 10).map((error) => ({
            timestamp: error.timestamp,
            severity: error.severity,
            type: error.errorType,
            message: error.message.substring(0, 200), // Truncate long messages
            shapeName: error.shapeName,
            lineNumber: error.lineNumber,
        })),
    };
}

/**
 * Format connectors section
 */
function formatConnectors(result: AnalysisResult): any {
    if (!result.connectorStats) {
        return null;
    }

    const { connectorStats } = result;

    return {
        summary: {
            total: connectorStats.summary.totalConnectors,
            totalCalls: connectorStats.summary.totalCalls,
            averageCallTime: `${connectorStats.summary.averageCallTime.toFixed(2)}ms`,
            byType: connectorStats.summary.byType,
            formatted: formatConnectorSummary(connectorStats),
        },
        topConnectors: connectorStats.connectors.slice(0, 10).map((conn, index) => ({
            rank: index + 1,
            name: conn.connectorName,
            type: conn.connectorType,
            operation: conn.operation,
            calls: conn.callCount,
            totalTime: formatExecutionTime(conn.totalExecutionTime),
            avgTime: `${conn.averageExecutionTime.toFixed(2)}ms`,
            minTime: `${conn.minExecutionTime.toFixed(2)}ms`,
            maxTime: `${conn.maxExecutionTime.toFixed(2)}ms`,
            documents: conn.documents,
        })),
    };
}

/**
 * Format flow section
 */
function formatFlow(result: AnalysisResult): any {
    if (!result.processFlow) {
        return null;
    }

    const { processFlow } = result;

    return {
        summary: {
            nodes: processFlow.nodes.length,
            edges: processFlow.edges.length,
            processes: processFlow.nodes.filter((n) => n.type === 'process' || n.type === 'subprocess').length,
            shapes: processFlow.nodes.filter((n) => n.type === 'shape').length,
        },
        hierarchy: processFlow.hierarchy,
        // Note: Full nodes/edges available in raw result if needed
        // We don't include them here to keep response size manageable
    };
}

/**
 * Format pagination section
 */
function formatPagination(result: AnalysisResult): any {
    if (!result.paginationData) {
        return null;
    }

    const { paginationData } = result;

    if (!paginationData.detected) {
        return {
            detected: false,
            message: 'No pagination detected',
        };
    }

    return {
        detected: true,
        summary: {
            totalIterations: paginationData.summary.totalIterations,
            maxDepth: paginationData.summary.maxDepth,
            efficiency: paginationData.summary.efficiency,
            pattern: paginationData.pattern,
            formatted: formatPaginationSummary(paginationData),
        },
        recentIterations: paginationData.iterations.slice(0, 10).map((iter) => ({
            continuationId: iter.continuationId,
            timestamp: iter.timestamp,
            level: iter.level,
        })),
    };
}

/**
 * Get overall health status
 */
function getHealthStatus(result: AnalysisResult): 'healthy' | 'warning' | 'critical' {
    const { summary, errorAnalysis } = result;

    // Critical if severe errors
    if (summary.severeCount > 0) {
        return 'critical';
    }

    // Warning if warnings exist
    if (summary.warningCount > 5) {
        return 'warning';
    }

    // Healthy
    return 'healthy';
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}

/**
 * Create a summary text for quick overview
 */
export function createSummaryText(result: AnalysisResult): string {
    const { summary, errorAnalysis } = result;

    const parts: string[] = [];

    // Process info
    if (summary.processName) {
        parts.push(`Process: ${summary.processName}`);
    }

    // Duration
    if (summary.duration) {
        parts.push(`Duration: ${formatExecutionTime(summary.duration)}`);
    }

    // Status
    const status = getHealthStatus(result);
    const statusEmoji = status === 'healthy' ? '✅' : status === 'warning' ? '⚠️' : '🔴';
    parts.push(`Status: ${statusEmoji} ${status.toUpperCase()}`);

    // Documents
    if (summary.documentsProcessed > 0) {
        parts.push(`Documents: ${summary.documentsProcessed.toLocaleString()}`);
    }

    // Errors
    if (errorAnalysis.summary.total > 0) {
        parts.push(`Errors: ${errorAnalysis.summary.total} (${errorAnalysis.summary.severe} severe)`);
    }

    return parts.join(' | ');
}

/**
 * Export result as CSV (for top slow shapes)
 */
export function exportTopShapesAsCSV(result: AnalysisResult): string {
    const headers = ['Rank', 'Shape Name', 'Execution Time (ms)', 'Documents', 'Occurred At', 'Line Number'];
    const rows = result.topSlowShapes.map((shape, index) => [
        index + 1,
        shape.shapeName,
        shape.executionTime,
        shape.documents || 0,
        shape.occurredAt,
        shape.lineNumber,
    ]);

    const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csv;
}

/**
 * Export errors as CSV
 */
export function exportErrorsAsCSV(result: AnalysisResult): string {
    const headers = ['Timestamp', 'Severity', 'Type', 'Shape Name', 'Message', 'Line Number'];
    const rows = result.errorAnalysis.errors.map((error) => [
        error.timestamp,
        error.severity,
        error.errorType || 'Unknown',
        error.shapeName,
        `"${error.message.replace(/"/g, '""')}"`, // Escape quotes
        error.lineNumber,
    ]);

    const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csv;
}
