/**
 * Pagination Detector
 * Detects and analyzes pagination/continuation patterns in Boomi logs
 */

import {
    LogLine,
    PaginationData,
    LOG_PATTERNS,
} from '../types/analysis';

/**
 * Detect pagination patterns in log lines
 */
export function detectPagination(lines: LogLine[]): PaginationData {
    const iterations: Array<{
        continuationId: string;
        timestamp: string;
        level: number;
    }> = [];

    let detected = false;
    let pattern: string | undefined;

    for (const line of lines) {
        // Check for continuation pattern
        const match = line.message.match(LOG_PATTERNS.CONTINUATION);

        if (match) {
            detected = true;
            const continuationId = match[1]; // e.g., "f_0_0_0_1"

            // Calculate depth level (count underscores)
            const level = (continuationId.match(/_/g) || []).length;

            // Store pattern if first occurrence
            if (!pattern) {
                pattern = continuationId.split('_').slice(0, 2).join('_'); // e.g., "f_0"
            }

            iterations.push({
                continuationId,
                timestamp: line.timestamp,
                level,
            });
        }
    }

    if (!detected) {
        return {
            detected: false,
            iterations: [],
            summary: {
                totalIterations: 0,
                maxDepth: 0,
            },
        };
    }

    // Calculate summary
    const maxDepth = Math.max(...iterations.map((i) => i.level), 0);
    const efficiency = analyzePaginationEfficiency(iterations);

    return {
        detected: true,
        pattern,
        iterations,
        summary: {
            totalIterations: iterations.length,
            maxDepth,
            efficiency,
        },
    };
}

/**
 * Analyze pagination efficiency
 */
function analyzePaginationEfficiency(
    iterations: Array<{ continuationId: string; timestamp: string; level: number }>
): 'Efficient' | 'Inefficient' | 'Unknown' {
    if (iterations.length === 0) {
        return 'Unknown';
    }

    // Calculate time between iterations
    const timeDiffs: number[] = [];

    for (let i = 1; i < iterations.length; i++) {
        const prevTime = new Date(iterations[i - 1].timestamp).getTime();
        const currTime = new Date(iterations[i].timestamp).getTime();
        timeDiffs.push(currTime - prevTime);
    }

    if (timeDiffs.length === 0) {
        return 'Unknown';
    }

    // Calculate average time per iteration
    const avgTime = timeDiffs.reduce((sum, t) => sum + t, 0) / timeDiffs.length;

    // If average time is < 1 second, consider efficient
    // If > 5 seconds, consider inefficient
    if (avgTime < 1000) {
        return 'Efficient';
    } else if (avgTime > 5000) {
        return 'Inefficient';
    }

    return 'Unknown';
}

/**
 * Get pagination statistics
 */
export function getPaginationStats(data: PaginationData): {
    totalPages: number;
    avgIterationsPerLevel: number;
    deepestNesting: number;
    estimatedRecords?: number;
    timeSpan?: number;
} | null {
    if (!data.detected || data.iterations.length === 0) {
        return null;
    }

    // Group by level
    const byLevel = new Map<number, number>();
    for (const iteration of data.iterations) {
        byLevel.set(iteration.level, (byLevel.get(iteration.level) || 0) + 1);
    }

    const avgIterationsPerLevel =
        data.iterations.length / byLevel.size;

    // Calculate time span
    let timeSpan: number | undefined;
    if (data.iterations.length > 1) {
        const firstTime = new Date(data.iterations[0].timestamp).getTime();
        const lastTime = new Date(data.iterations[data.iterations.length - 1].timestamp).getTime();
        timeSpan = lastTime - firstTime;
    }

    // Estimate records (assuming typical Boomi page size of 100-1000)
    const estimatedRecords = data.iterations.length * 500; // Conservative estimate

    return {
        totalPages: data.iterations.length,
        avgIterationsPerLevel,
        deepestNesting: data.summary.maxDepth,
        estimatedRecords,
        timeSpan,
    };
}

/**
 * Detect pagination loops (same continuation ID appearing multiple times)
 */
export function detectPaginationLoops(data: PaginationData): Array<{
    continuationId: string;
    occurrences: number;
    timestamps: string[];
    warning: string;
}> {
    if (!data.detected) {
        return [];
    }

    const idMap = new Map<string, string[]>();

    for (const iteration of data.iterations) {
        if (!idMap.has(iteration.continuationId)) {
            idMap.set(iteration.continuationId, []);
        }
        idMap.get(iteration.continuationId)!.push(iteration.timestamp);
    }

    const loops: Array<{
        continuationId: string;
        occurrences: number;
        timestamps: string[];
        warning: string;
    }> = [];

    for (const [id, timestamps] of idMap) {
        if (timestamps.length > 1) {
            loops.push({
                continuationId: id,
                occurrences: timestamps.length,
                timestamps,
                warning: `Continuation ID "${id}" appeared ${timestamps.length} times - possible infinite loop`,
            });
        }
    }

    // Sort by occurrence count (descending)
    loops.sort((a, b) => b.occurrences - a.occurrences);

    return loops;
}

/**
 * Analyze pagination performance
 */
export function analyzePaginationPerformance(
    data: PaginationData
): {
    avgTimePerPage: number;
    minTimePerPage: number;
    maxTimePerPage: number;
    totalPaginationTime: number;
    pagesPerSecond: number;
    performance: 'Fast' | 'Normal' | 'Slow';
} | null {
    if (!data.detected || data.iterations.length < 2) {
        return null;
    }

    const timeDiffs: number[] = [];

    for (let i = 1; i < data.iterations.length; i++) {
        const prevTime = new Date(data.iterations[i - 1].timestamp).getTime();
        const currTime = new Date(data.iterations[i].timestamp).getTime();
        timeDiffs.push(currTime - prevTime);
    }

    const avgTimePerPage = timeDiffs.reduce((sum, t) => sum + t, 0) / timeDiffs.length;
    const minTimePerPage = Math.min(...timeDiffs);
    const maxTimePerPage = Math.max(...timeDiffs);

    const firstTime = new Date(data.iterations[0].timestamp).getTime();
    const lastTime = new Date(data.iterations[data.iterations.length - 1].timestamp).getTime();
    const totalPaginationTime = lastTime - firstTime;

    const pagesPerSecond = (data.iterations.length / (totalPaginationTime / 1000));

    // Determine performance
    let performance: 'Fast' | 'Normal' | 'Slow';
    if (avgTimePerPage < 500) {
        performance = 'Fast';
    } else if (avgTimePerPage < 2000) {
        performance = 'Normal';
    } else {
        performance = 'Slow';
    }

    return {
        avgTimePerPage,
        minTimePerPage,
        maxTimePerPage,
        totalPaginationTime,
        pagesPerSecond,
        performance,
    };
}

/**
 * Get pagination timeline (iterations over time)
 */
export function getPaginationTimeline(
    data: PaginationData,
    bucketMs: number = 60000 // 1 minute buckets
): Array<{
    timestamp: string;
    iterationCount: number;
    avgLevel: number;
}> {
    if (!data.detected || data.iterations.length === 0) {
        return [];
    }

    const buckets = new Map<
        number,
        {
            timestamp: string;
            iterations: Array<{ level: number }>;
        }
    >();

    for (const iteration of data.iterations) {
        const time = new Date(iteration.timestamp).getTime();
        const bucket = Math.floor(time / bucketMs);

        if (!buckets.has(bucket)) {
            buckets.set(bucket, {
                timestamp: new Date(bucket * bucketMs).toISOString(),
                iterations: [],
            });
        }

        buckets.get(bucket)!.iterations.push({ level: iteration.level });
    }

    const timeline = Array.from(buckets.values()).map((bucket) => {
        const avgLevel =
            bucket.iterations.reduce((sum, i) => sum + i.level, 0) /
            bucket.iterations.length;

        return {
            timestamp: bucket.timestamp,
            iterationCount: bucket.iterations.length,
            avgLevel,
        };
    });

    // Sort by timestamp
    timeline.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return timeline;
}

/**
 * Detect nested pagination (pagination within pagination)
 */
export function detectNestedPagination(data: PaginationData): {
    hasNesting: boolean;
    nestingLevels: number;
    nestedGroups: Array<{
        parentLevel: number;
        childLevel: number;
        count: number;
    }>;
} {
    if (!data.detected || data.iterations.length === 0) {
        return {
            hasNesting: false,
            nestingLevels: 0,
            nestedGroups: [],
        };
    }

    const levels = new Set(data.iterations.map((i) => i.level));
    const nestingLevels = levels.size;
    const hasNesting = nestingLevels > 1;

    // Group by parent-child relationships
    const nestedGroups: Array<{
        parentLevel: number;
        childLevel: number;
        count: number;
    }> = [];

    const levelArray = Array.from(levels).sort((a, b) => a - b);

    for (let i = 0; i < levelArray.length - 1; i++) {
        const parentLevel = levelArray[i];
        const childLevel = levelArray[i + 1];
        const count = data.iterations.filter((it) => it.level === childLevel).length;

        nestedGroups.push({
            parentLevel,
            childLevel,
            count,
        });
    }

    return {
        hasNesting,
        nestingLevels,
        nestedGroups,
    };
}

/**
 * Format pagination summary for display
 */
export function formatPaginationSummary(data: PaginationData): string {
    if (!data.detected) {
        return 'No pagination detected';
    }

    const parts: string[] = [];

    parts.push(`${data.summary.totalIterations} page${data.summary.totalIterations > 1 ? 's' : ''}`);

    if (data.summary.maxDepth > 0) {
        parts.push(`Max depth: ${data.summary.maxDepth}`);
    }

    if (data.summary.efficiency) {
        parts.push(`Efficiency: ${data.summary.efficiency}`);
    }

    if (data.pattern) {
        parts.push(`Pattern: ${data.pattern}`);
    }

    return parts.join(' | ');
}

/**
 * Estimate total records processed based on pagination
 */
export function estimateTotalRecords(
    data: PaginationData,
    avgPageSize: number = 500
): number {
    if (!data.detected) {
        return 0;
    }

    return data.summary.totalIterations * avgPageSize;
}

/**
 * Check if pagination is causing performance issues
 */
export function isPaginationBottleneck(data: PaginationData): {
    isBottleneck: boolean;
    reason?: string;
    recommendation?: string;
} {
    if (!data.detected) {
        return { isBottleneck: false };
    }

    const perf = analyzePaginationPerformance(data);
    const loops = detectPaginationLoops(data);

    // Check for infinite loops
    if (loops.length > 0) {
        return {
            isBottleneck: true,
            reason: `Detected ${loops.length} pagination loop(s)`,
            recommendation: 'Review continuation logic to prevent infinite loops',
        };
    }

    // Check for slow pagination
    if (perf && perf.performance === 'Slow') {
        return {
            isBottleneck: true,
            reason: `Slow pagination: ${perf.avgTimePerPage.toFixed(0)}ms per page`,
            recommendation: 'Consider increasing page size or optimizing query performance',
        };
    }

    // Check for excessive iterations
    if (data.summary.totalIterations > 1000) {
        return {
            isBottleneck: true,
            reason: `Excessive pagination: ${data.summary.totalIterations} iterations`,
            recommendation: 'Consider batch processing or increasing page size',
        };
    }

    // Check for deep nesting
    if (data.summary.maxDepth > 5) {
        return {
            isBottleneck: true,
            reason: `Deep pagination nesting: ${data.summary.maxDepth} levels`,
            recommendation: 'Review pagination logic for unnecessary nesting',
        };
    }

    return { isBottleneck: false };
}
