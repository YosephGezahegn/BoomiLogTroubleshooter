/**
 * Main Log Analyzer
 * Orchestrates all parsing and analysis functions
 */

import {
    AnalysisResult,
    ExecutionSummary,
    ParsingConfig,
    DEFAULT_PARSING_CONFIG,
    LogLine,
} from '../types/analysis';
import { parseLogFile, getLogStats, calculateDuration } from '../parsers/logLineParser';
import { getTopSlowShapes, calculateShapeStats } from '../parsers/timeExtractor';
import { analyzeErrors, calculateErrorRate } from '../parsers/errorExtractor';
import { analyzeConnectors } from '../parsers/connectorExtractor';
import { extractProcessFlow, calculateFlowStats } from '../parsers/processFlowExtractor';
import { detectPagination } from '../parsers/paginationDetector';

/**
 * Main function to analyze a Boomi log file
 */
export async function analyzeLogFile(
    content: string,
    config: Partial<ParsingConfig> = {}
): Promise<AnalysisResult> {
    // Merge config with defaults
    const finalConfig: ParsingConfig = {
        ...DEFAULT_PARSING_CONFIG,
        ...config,
    };

    // Parse log file into structured lines
    const lines = parseLogFile(content);

    if (lines.length === 0) {
        throw new Error('No valid log lines found in file');
    }

    // Get basic stats
    const logStats = getLogStats(lines);

    // Extract execution summary
    const summary = buildExecutionSummary(content, lines, logStats);

    // Extract top slow shapes
    const topSlowShapes = getTopSlowShapes(lines, finalConfig.topN);

    // Analyze errors
    const errorAnalysis = analyzeErrors(lines);

    // Optional: Process flow
    let processFlow = undefined;
    if (finalConfig.includeFlow) {
        processFlow = extractProcessFlow(lines);
    }

    // Optional: Connector stats
    let connectorStats = undefined;
    if (finalConfig.includeConnectors) {
        connectorStats = analyzeConnectors(lines);
    }

    // Optional: Pagination detection
    let paginationData = undefined;
    if (finalConfig.includePagination) {
        paginationData = detectPagination(lines);
    }

    // Build result
    const result: AnalysisResult = {
        summary,
        topSlowShapes,
        errorAnalysis,
        processFlow,
        connectorStats,
        paginationData,
    };

    return result;
}

/**
 * Build execution summary from log data
 */
function buildExecutionSummary(
    content: string,
    lines: LogLine[],
    logStats: ReturnType<typeof getLogStats>
): ExecutionSummary {
    const fileSize = new TextEncoder().encode(content).length;
    const lineCount = content.split(/\r?\n/).length;

    // Extract timing
    let startTime: string | undefined;
    let endTime: string | undefined;
    let duration: number | undefined;

    if (logStats.timeRange) {
        startTime = logStats.timeRange.start;
        endTime = logStats.timeRange.end;
        duration = calculateDuration(startTime, endTime);
    }

    // Extract process info from first process execution
    let processName: string | undefined;
    let processId: string | undefined;

    for (const line of lines) {
        if (line.message.includes('Executing Process')) {
            const match = line.message.match(/Executing Process (.+)/);
            if (match) {
                processName = match[1].trim();
                // Try to extract process ID if available
                const idMatch = line.message.match(/Process ID: ([^\s]+)/);
                if (idMatch) {
                    processId = idMatch[1];
                }
                break;
            }
        }
    }

    // Calculate shape stats
    const shapeStats = calculateShapeStats(
        lines
            .map((line) => {
                const timeMatch = line.message.match(/(\d+)\s*ms/);
                if (timeMatch) {
                    return {
                        shapeName: line.shapeName,
                        executionTime: parseInt(timeMatch[1], 10),
                        occurredAt: line.timestamp,
                        lineNumber: line.lineNumber,
                    };
                }
                return null;
            })
            .filter((s): s is NonNullable<typeof s> => s !== null)
    );

    // Count errors
    const errorCount = logStats.byLevel['SEVERE'] || 0;
    const warningCount = logStats.byLevel['WARNING'] || 0;
    const severeCount = errorCount;

    // Detect environment (if mentioned in logs)
    let environment: 'Production' | 'Test' | 'Development' | undefined;
    for (const line of lines) {
        const msg = line.message.toUpperCase();
        if (msg.includes('PRODUCTION')) {
            environment = 'Production';
            break;
        } else if (msg.includes('TEST')) {
            environment = 'Test';
            break;
        } else if (msg.includes('DEVELOPMENT') || msg.includes('DEV')) {
            environment = 'Development';
            break;
        }
    }

    return {
        fileName: 'uploaded_log.log', // Will be overridden by API
        fileSize,
        lineCount,
        processName,
        processId,
        startTime,
        endTime,
        duration,
        totalShapes: shapeStats.totalShapes,
        documentsProcessed: shapeStats.documentsProcessed,
        errorCount,
        warningCount,
        severeCount,
        averageShapeTime: shapeStats.averageExecutionTime,
        medianShapeTime: shapeStats.medianExecutionTime,
        environment,
    };
}

/**
 * Analyze log file with progress callback
 */
export async function analyzeLogFileWithProgress(
    content: string,
    config: Partial<ParsingConfig> = {},
    onProgress?: (stage: string, progress: number) => void
): Promise<AnalysisResult> {
    const finalConfig: ParsingConfig = {
        ...DEFAULT_PARSING_CONFIG,
        ...config,
    };

    // Stage 1: Parse
    onProgress?.('Parsing log file', 10);
    const lines = parseLogFile(content);

    if (lines.length === 0) {
        throw new Error('No valid log lines found in file');
    }

    // Stage 2: Basic stats
    onProgress?.('Calculating statistics', 20);
    const logStats = getLogStats(lines);
    const summary = buildExecutionSummary(content, lines, logStats);

    // Stage 3: Extract shapes
    onProgress?.('Extracting shape executions', 35);
    const topSlowShapes = getTopSlowShapes(lines, finalConfig.topN);

    // Stage 4: Analyze errors
    onProgress?.('Analyzing errors', 50);
    const errorAnalysis = analyzeErrors(lines);

    // Stage 5: Process flow (optional)
    let processFlow = undefined;
    if (finalConfig.includeFlow) {
        onProgress?.('Building process flow', 65);
        processFlow = extractProcessFlow(lines);
    }

    // Stage 6: Connectors (optional)
    let connectorStats = undefined;
    if (finalConfig.includeConnectors) {
        onProgress?.('Analyzing connectors', 80);
        connectorStats = analyzeConnectors(lines);
    }

    // Stage 7: Pagination (optional)
    let paginationData = undefined;
    if (finalConfig.includePagination) {
        onProgress?.('Detecting pagination', 90);
        paginationData = detectPagination(lines);
    }

    // Stage 8: Complete
    onProgress?.('Finalizing analysis', 100);

    return {
        summary,
        topSlowShapes,
        errorAnalysis,
        processFlow,
        connectorStats,
        paginationData,
    };
}

/**
 * Quick analysis (minimal features for fast results)
 */
export async function quickAnalyze(content: string): Promise<AnalysisResult> {
    return analyzeLogFile(content, {
        topN: 5,
        includeFlow: false,
        includeConnectors: false,
        includePagination: false,
    });
}

/**
 * Deep analysis (all features enabled)
 */
export async function deepAnalyze(content: string): Promise<AnalysisResult> {
    return analyzeLogFile(content, {
        topN: 20,
        includeFlow: true,
        includeConnectors: true,
        includePagination: true,
    });
}

/**
 * Validate log file before analysis
 */
export function validateLogFile(content: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if empty
    if (!content || content.trim().length === 0) {
        errors.push('File is empty');
        return { isValid: false, errors, warnings };
    }

    // Check file size (warn if > 50MB)
    const sizeBytes = new TextEncoder().encode(content).length;
    const sizeMB = sizeBytes / (1024 * 1024);

    if (sizeMB > 50) {
        warnings.push(`Large file (${sizeMB.toFixed(1)}MB) - analysis may take longer`);
    }

    // Try to parse a few lines
    const lines = content.split(/\r?\n/).slice(0, 100);
    let validLines = 0;

    for (const line of lines) {
        if (line.trim() && line.includes('\t')) {
            validLines++;
        }
    }

    // Check if at least some lines are valid
    if (validLines === 0) {
        errors.push('No valid Boomi log lines detected (expected tab-separated format)');
        return { isValid: false, errors, warnings };
    }

    // Warn if low valid line percentage
    const validPercentage = (validLines / lines.length) * 100;
    if (validPercentage < 50) {
        warnings.push(
            `Only ${validPercentage.toFixed(0)}% of lines match expected format`
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Get analysis metadata (without full analysis)
 */
export function getLogMetadata(content: string): {
    fileSize: number;
    lineCount: number;
    estimatedAnalysisTime: number; // in seconds
    hasValidFormat: boolean;
} {
    const fileSize = new TextEncoder().encode(content).length;
    const lineCount = content.split(/\r?\n/).length;

    // Estimate analysis time (rough: 50K lines per second)
    const estimatedAnalysisTime = Math.max(1, Math.ceil(lineCount / 50000));

    // Quick format check
    const firstLines = content.split(/\r?\n/).slice(0, 10);
    const hasValidFormat = firstLines.some((line) => line.includes('\t'));

    return {
        fileSize,
        lineCount,
        estimatedAnalysisTime,
        hasValidFormat,
    };
}

/**
 * Compare two analysis results
 */
export function compareAnalyses(
    current: AnalysisResult,
    previous: AnalysisResult
): {
    durationChange: number;
    errorChange: number;
    performanceChange: number;
    newErrors: string[];
    resolvedErrors: string[];
    summary: string;
} {
    const durationChange =
        (current.summary.duration || 0) - (previous.summary.duration || 0);

    const errorChange =
        current.errorAnalysis.summary.total - previous.errorAnalysis.summary.total;

    const performanceChange =
        (current.summary.averageShapeTime || 0) -
        (previous.summary.averageShapeTime || 0);

    // Find new and resolved errors
    const currentErrorTypes = new Set(
        Object.keys(current.errorAnalysis.categorized.byType)
    );
    const previousErrorTypes = new Set(
        Object.keys(previous.errorAnalysis.categorized.byType)
    );

    const newErrors = Array.from(currentErrorTypes).filter(
        (type) => !previousErrorTypes.has(type)
    );
    const resolvedErrors = Array.from(previousErrorTypes).filter(
        (type) => !currentErrorTypes.has(type)
    );

    // Build summary
    const parts: string[] = [];

    if (durationChange !== 0) {
        const sign = durationChange > 0 ? '+' : '';
        parts.push(`Duration: ${sign}${(durationChange / 1000).toFixed(1)}s`);
    }

    if (errorChange !== 0) {
        const sign = errorChange > 0 ? '+' : '';
        parts.push(`Errors: ${sign}${errorChange}`);
    }

    if (performanceChange !== 0) {
        const sign = performanceChange > 0 ? '+' : '';
        parts.push(`Avg time: ${sign}${performanceChange.toFixed(0)}ms`);
    }

    const summary = parts.length > 0 ? parts.join(' | ') : 'No significant changes';

    return {
        durationChange,
        errorChange,
        performanceChange,
        newErrors,
        resolvedErrors,
        summary,
    };
}
