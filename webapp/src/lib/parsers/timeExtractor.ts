/**
 * Time Extractor
 * Extracts and ranks shapes by execution time
 */

import { MinHeap } from '../utils/MinHeap';
import {
    LogLine,
    ShapeExecution,
    LOG_PATTERNS,
} from '../types/analysis';
import {
    extractExecutionTime,
    extractDocumentCount,
    isShapeExecution,
} from './logLineParser';

/**
 * Extract shape executions with timing from log lines
 */
export function extractShapeExecutions(lines: LogLine[]): ShapeExecution[] {
    const executions: ShapeExecution[] = [];

    for (const line of lines) {
        // Look for execution time in message
        const executionTime = extractExecutionTime(line.message);

        if (executionTime !== null && executionTime > 0) {
            const documents = extractDocumentCount(line.message);

            executions.push({
                shapeName: line.shapeName,
                executionTime,
                occurredAt: line.timestamp,
                component: line.component,
                documents: documents || undefined,
                lineNumber: line.lineNumber,
            });
        }
    }

    return executions;
}

/**
 * Get top N slowest shapes using MinHeap
 */
export function getTopSlowShapes(
    lines: LogLine[],
    n: number = 10
): ShapeExecution[] {
    const executions = extractShapeExecutions(lines);

    if (executions.length === 0) {
        return [];
    }

    // Use MinHeap for efficient top-N selection
    const heap = new MinHeap<ShapeExecution>(n);

    for (const execution of executions) {
        heap.insert(execution.executionTime, execution);
    }

    return heap.getAll();
}

/**
 * Calculate shape execution statistics
 */
export function calculateShapeStats(executions: ShapeExecution[]): {
    totalShapes: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    medianExecutionTime: number;
    min: number;
    max: number;
    documentsProcessed: number;
    percentiles: {
        p50: number;
        p75: number;
        p90: number;
        p95: number;
        p99: number;
    };
} {
    if (executions.length === 0) {
        return {
            totalShapes: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            medianExecutionTime: 0,
            min: 0,
            max: 0,
            documentsProcessed: 0,
            percentiles: { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
        };
    }

    // Sort execution times
    const times = executions.map((e) => e.executionTime).sort((a, b) => a - b);

    // Calculate total execution time
    const totalExecutionTime = times.reduce((sum, time) => sum + time, 0);

    // Calculate average
    const averageExecutionTime = totalExecutionTime / times.length;

    // Calculate median
    const medianIndex = Math.floor(times.length / 2);
    const medianExecutionTime =
        times.length % 2 === 0
            ? (times[medianIndex - 1] + times[medianIndex]) / 2
            : times[medianIndex];

    // Calculate percentiles
    const getPercentile = (p: number): number => {
        const index = Math.ceil((p / 100) * times.length) - 1;
        return times[Math.max(0, index)];
    };

    // Count documents
    const documentsProcessed = executions.reduce(
        (sum, e) => sum + (e.documents || 0),
        0
    );

    return {
        totalShapes: executions.length,
        totalExecutionTime,
        averageExecutionTime,
        medianExecutionTime,
        min: times[0],
        max: times[times.length - 1],
        documentsProcessed,
        percentiles: {
            p50: getPercentile(50),
            p75: getPercentile(75),
            p90: getPercentile(90),
            p95: getPercentile(95),
            p99: getPercentile(99),
        },
    };
}

/**
 * Group shape executions by shape name and calculate aggregates
 */
export function aggregateByShapeName(
    executions: ShapeExecution[]
): Map<
    string,
    {
        shapeName: string;
        count: number;
        totalTime: number;
        avgTime: number;
        minTime: number;
        maxTime: number;
        documents: number;
    }
> {
    const aggregated = new Map<
        string,
        {
            shapeName: string;
            count: number;
            totalTime: number;
            avgTime: number;
            minTime: number;
            maxTime: number;
            documents: number;
        }
    >();

    for (const execution of executions) {
        const existing = aggregated.get(execution.shapeName);

        if (existing) {
            existing.count += 1;
            existing.totalTime += execution.executionTime;
            existing.avgTime = existing.totalTime / existing.count;
            existing.minTime = Math.min(existing.minTime, execution.executionTime);
            existing.maxTime = Math.max(existing.maxTime, execution.executionTime);
            existing.documents += execution.documents || 0;
        } else {
            aggregated.set(execution.shapeName, {
                shapeName: execution.shapeName,
                count: 1,
                totalTime: execution.executionTime,
                avgTime: execution.executionTime,
                minTime: execution.executionTime,
                maxTime: execution.executionTime,
                documents: execution.documents || 0,
            });
        }
    }

    return aggregated;
}

/**
 * Find shapes that took longer than threshold
 */
export function findSlowShapes(
    executions: ShapeExecution[],
    thresholdMs: number
): ShapeExecution[] {
    return executions.filter((e) => e.executionTime >= thresholdMs);
}

/**
 * Calculate execution time distribution
 */
export function getTimeDistribution(executions: ShapeExecution[]): {
    buckets: Array<{
        range: string;
        count: number;
        percentage: number;
    }>;
} {
    if (executions.length === 0) {
        return { buckets: [] };
    }

    const times = executions.map((e) => e.executionTime);
    const max = Math.max(...times);
    const min = Math.min(...times);

    // Create buckets
    const bucketCount = 10;
    const bucketSize = (max - min) / bucketCount || 1;
    const buckets = Array(bucketCount).fill(0);

    // Fill buckets
    for (const time of times) {
        const bucketIndex = Math.min(
            Math.floor((time - min) / bucketSize),
            bucketCount - 1
        );
        buckets[bucketIndex]++;
    }

    // Format results
    return {
        buckets: buckets.map((count, index) => {
            const rangeStart = min + index * bucketSize;
            const rangeEnd = min + (index + 1) * bucketSize;
            return {
                range: `${Math.round(rangeStart)}-${Math.round(rangeEnd)} ms`,
                count,
                percentage: (count / executions.length) * 100,
            };
        }),
    };
}

/**
 * Format execution time for display
 */
export function formatExecutionTime(ms: number): string {
    if (ms < 1000) {
        return `${ms} ms`;
    } else if (ms < 60000) {
        return `${(ms / 1000).toFixed(2)} s`;
    } else {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
}

/**
 * Identify performance bottlenecks
 */
export function identifyBottlenecks(
    executions: ShapeExecution[],
    thresholdPercentile: number = 95
): {
    bottlenecks: ShapeExecution[];
    threshold: number;
    analysis: string;
} {
    const stats = calculateShapeStats(executions);
    const threshold = stats.percentiles.p95;

    const bottlenecks = executions.filter(
        (e) => e.executionTime >= threshold
    );

    const totalTime = stats.totalExecutionTime;
    const bottleneckTime = bottlenecks.reduce(
        (sum, e) => sum + e.executionTime,
        0
    );
    const bottleneckPercent = (bottleneckTime / totalTime) * 100;

    const analysis = `${bottlenecks.length} shapes (${((bottlenecks.length / executions.length) * 100).toFixed(1)}%) account for ${bottleneckPercent.toFixed(1)}% of total execution time`;

    return {
        bottlenecks,
        threshold,
        analysis,
    };
}
