/**
 * Connector Extractor
 * Extracts and analyzes connector usage (HTTP, Database, etc.)
 */

import {
    LogLine,
    ConnectorUsage,
    ConnectorStats,
    LOG_PATTERNS,
} from '../types/analysis';
import { extractExecutionTime, extractDocumentCount } from './logLineParser';

/**
 * Extract connector information from a log line
 */
function parseConnectorInfo(line: LogLine): {
    connectorId: string;
    connectorName: string;
    connectorType: string;
    operation?: string;
} | null {
    // Try to match connector pattern: [Common] connectorName: connectorType Connector
    const connectorMatch = line.message.match(LOG_PATTERNS.CONNECTOR_PATTERN);

    if (connectorMatch) {
        const [, name, type] = connectorMatch;
        return {
            connectorId: `${type}_${name}`.replace(/\s+/g, '_'),
            connectorName: name.trim(),
            connectorType: type.trim(),
        };
    }

    // Try to match operation pattern
    const operationMatch = line.message.match(LOG_PATTERNS.CONNECTOR_OPERATION);
    if (operationMatch) {
        const operation = operationMatch[1].trim();
        return {
            connectorId: `${line.shapeName}_${operation}`.replace(/\s+/g, '_'),
            connectorName: line.shapeName,
            connectorType: detectConnectorType(line.shapeName, line.message),
            operation,
        };
    }

    // Check component field for connector info
    if (line.component && line.component.toLowerCase().includes('connector')) {
        return {
            connectorId: line.component.replace(/\s+/g, '_'),
            connectorName: line.component,
            connectorType: detectConnectorType(line.component, line.message),
        };
    }

    return null;
}

/**
 * Detect connector type from shape name or message
 */
function detectConnectorType(shapeName: string, message: string): string {
    const text = `${shapeName} ${message}`.toUpperCase();

    if (text.includes('HTTP') || text.includes('REST') || text.includes('API')) {
        return 'HTTP';
    } else if (text.includes('DATABASE') || text.includes('SQL') || text.includes('DB')) {
        return 'Database';
    } else if (text.includes('FTP') || text.includes('SFTP')) {
        return 'FTP';
    } else if (text.includes('SOAP') || text.includes('WSDL')) {
        return 'SOAP';
    } else if (text.includes('EMAIL') || text.includes('SMTP')) {
        return 'Email';
    } else if (text.includes('SALESFORCE') || text.includes('SFDC')) {
        return 'Salesforce';
    } else if (text.includes('SAP')) {
        return 'SAP';
    } else if (text.includes('NETSUITE')) {
        return 'NetSuite';
    } else if (text.includes('AWS') || text.includes('S3') || text.includes('LAMBDA')) {
        return 'AWS';
    } else if (text.includes('AZURE')) {
        return 'Azure';
    }

    return 'Generic';
}

/**
 * Extract operation type from message
 */
function extractOperation(message: string): string | undefined {
    const messageUpper = message.toUpperCase();

    // HTTP methods
    if (messageUpper.includes(' GET ')) return 'GET';
    if (messageUpper.includes(' POST ')) return 'POST';
    if (messageUpper.includes(' PUT ')) return 'PUT';
    if (messageUpper.includes(' DELETE ')) return 'DELETE';
    if (messageUpper.includes(' PATCH ')) return 'PATCH';

    // Database operations
    if (messageUpper.includes('SELECT')) return 'SELECT';
    if (messageUpper.includes('INSERT')) return 'INSERT';
    if (messageUpper.includes('UPDATE')) return 'UPDATE';
    if (messageUpper.includes('DELETE FROM')) return 'DELETE';

    // Generic operations
    if (messageUpper.includes('READ')) return 'READ';
    if (messageUpper.includes('WRITE')) return 'WRITE';
    if (messageUpper.includes('CREATE')) return 'CREATE';

    return undefined;
}

/**
 * Extract connector calls from log lines
 */
export function extractConnectorCalls(lines: LogLine[]): ConnectorUsage[] {
    // Group by connector ID
    const connectorMap = new Map<
        string,
        {
            info: ReturnType<typeof parseConnectorInfo>;
            calls: Array<{
                executionTime: number;
                documents: number;
                lineNumber: number;
            }>;
        }
    >();

    for (const line of lines) {
        const connectorInfo = parseConnectorInfo(line);

        if (connectorInfo) {
            const executionTime = extractExecutionTime(line.message);
            const documents = extractDocumentCount(line.message);
            const operation = extractOperation(line.message);

            // Merge operation into connector info
            if (operation && !connectorInfo.operation) {
                connectorInfo.operation = operation;
            }

            if (!connectorMap.has(connectorInfo.connectorId)) {
                connectorMap.set(connectorInfo.connectorId, {
                    info: connectorInfo,
                    calls: [],
                });
            }

            const connector = connectorMap.get(connectorInfo.connectorId)!;

            if (executionTime !== null) {
                connector.calls.push({
                    executionTime,
                    documents: documents || 0,
                    lineNumber: line.lineNumber,
                });
            }
        }
    }

    // Convert to ConnectorUsage array
    const connectorUsages: ConnectorUsage[] = [];

    for (const [connectorId, data] of connectorMap) {
        if (data.calls.length === 0) continue; // Skip if no timing data

        const executionTimes = data.calls.map((c) => c.executionTime);
        const totalExecutionTime = executionTimes.reduce((sum, t) => sum + t, 0);
        const totalDocuments = data.calls.reduce((sum, c) => sum + c.documents, 0);

        connectorUsages.push({
            connectorId,
            connectorName: data.info!.connectorName,
            connectorType: data.info!.connectorType,
            operation: data.info!.operation,
            callCount: data.calls.length,
            totalExecutionTime,
            averageExecutionTime: totalExecutionTime / data.calls.length,
            minExecutionTime: Math.min(...executionTimes),
            maxExecutionTime: Math.max(...executionTimes),
            documents: totalDocuments,
            lineNumbers: data.calls.map((c) => c.lineNumber),
        });
    }

    // Sort by total execution time (descending)
    connectorUsages.sort((a, b) => b.totalExecutionTime - a.totalExecutionTime);

    return connectorUsages;
}

/**
 * Analyze connector usage and generate statistics
 */
export function analyzeConnectors(lines: LogLine[]): ConnectorStats {
    const connectors = extractConnectorCalls(lines);

    if (connectors.length === 0) {
        return {
            connectors: [],
            summary: {
                totalConnectors: 0,
                totalCalls: 0,
                averageCallTime: 0,
                byType: {},
            },
        };
    }

    // Calculate summary stats
    const totalCalls = connectors.reduce((sum, c) => sum + c.callCount, 0);
    const totalTime = connectors.reduce((sum, c) => sum + c.totalExecutionTime, 0);
    const averageCallTime = totalTime / totalCalls;

    // Group by type
    const byType: Record<string, number> = {};
    for (const connector of connectors) {
        byType[connector.connectorType] = (byType[connector.connectorType] || 0) + 1;
    }

    return {
        connectors,
        summary: {
            totalConnectors: connectors.length,
            totalCalls,
            averageCallTime,
            byType,
        },
    };
}

/**
 * Get top N slowest connectors
 */
export function getTopSlowConnectors(
    connectors: ConnectorUsage[],
    n: number = 10
): ConnectorUsage[] {
    return [...connectors]
        .sort((a, b) => b.averageExecutionTime - a.averageExecutionTime)
        .slice(0, n);
}

/**
 * Get connectors by type
 */
export function getConnectorsByType(
    connectors: ConnectorUsage[]
): Map<string, ConnectorUsage[]> {
    const byType = new Map<string, ConnectorUsage[]>();

    for (const connector of connectors) {
        if (!byType.has(connector.connectorType)) {
            byType.set(connector.connectorType, []);
        }
        byType.get(connector.connectorType)!.push(connector);
    }

    return byType;
}

/**
 * Calculate connector performance metrics
 */
export function calculateConnectorMetrics(connectors: ConnectorUsage[]): {
    totalApiCalls: number;
    totalApiTime: number;
    avgCallsPerConnector: number;
    avgTimePerCall: number;
    slowestConnector: ConnectorUsage | null;
    fastestConnector: ConnectorUsage | null;
    mostUsedConnector: ConnectorUsage | null;
} {
    if (connectors.length === 0) {
        return {
            totalApiCalls: 0,
            totalApiTime: 0,
            avgCallsPerConnector: 0,
            avgTimePerCall: 0,
            slowestConnector: null,
            fastestConnector: null,
            mostUsedConnector: null,
        };
    }

    const totalApiCalls = connectors.reduce((sum, c) => sum + c.callCount, 0);
    const totalApiTime = connectors.reduce((sum, c) => sum + c.totalExecutionTime, 0);

    const slowest = [...connectors].sort(
        (a, b) => b.averageExecutionTime - a.averageExecutionTime
    )[0];

    const fastest = [...connectors].sort(
        (a, b) => a.averageExecutionTime - b.averageExecutionTime
    )[0];

    const mostUsed = [...connectors].sort((a, b) => b.callCount - a.callCount)[0];

    return {
        totalApiCalls,
        totalApiTime,
        avgCallsPerConnector: totalApiCalls / connectors.length,
        avgTimePerCall: totalApiTime / totalApiCalls,
        slowestConnector: slowest,
        fastestConnector: fastest,
        mostUsedConnector: mostUsed,
    };
}

/**
 * Identify connector bottlenecks
 */
export function identifyConnectorBottlenecks(
    connectors: ConnectorUsage[],
    thresholdMs: number = 1000
): Array<{
    connector: ConnectorUsage;
    reason: string;
    impact: 'high' | 'medium' | 'low';
}> {
    const bottlenecks: Array<{
        connector: ConnectorUsage;
        reason: string;
        impact: 'high' | 'medium' | 'low';
    }> = [];

    for (const connector of connectors) {
        // High average execution time
        if (connector.averageExecutionTime > thresholdMs * 2) {
            bottlenecks.push({
                connector,
                reason: `Average execution time ${connector.averageExecutionTime.toFixed(0)}ms exceeds threshold`,
                impact: 'high',
            });
        } else if (connector.averageExecutionTime > thresholdMs) {
            bottlenecks.push({
                connector,
                reason: `Average execution time ${connector.averageExecutionTime.toFixed(0)}ms above threshold`,
                impact: 'medium',
            });
        }

        // High max execution time (outliers)
        if (connector.maxExecutionTime > connector.averageExecutionTime * 3) {
            bottlenecks.push({
                connector,
                reason: `Max time ${connector.maxExecutionTime.toFixed(0)}ms is 3x average (outliers detected)`,
                impact: 'medium',
            });
        }

        // High call count with slow performance
        if (connector.callCount > 100 && connector.averageExecutionTime > 500) {
            bottlenecks.push({
                connector,
                reason: `${connector.callCount} calls with avg ${connector.averageExecutionTime.toFixed(0)}ms (high frequency + slow)`,
                impact: 'high',
            });
        }
    }

    // Sort by impact (high first)
    bottlenecks.sort((a, b) => {
        const impactOrder = { high: 0, medium: 1, low: 2 };
        return impactOrder[a.impact] - impactOrder[b.impact];
    });

    return bottlenecks;
}

/**
 * Format connector summary for display
 */
export function formatConnectorSummary(stats: ConnectorStats): string {
    const { summary } = stats;

    if (summary.totalConnectors === 0) {
        return 'No connectors detected';
    }

    const parts: string[] = [];

    parts.push(`${summary.totalConnectors} connector${summary.totalConnectors > 1 ? 's' : ''}`);
    parts.push(`${summary.totalCalls} total calls`);
    parts.push(`${summary.averageCallTime.toFixed(0)}ms avg/call`);

    // Top connector types
    const topTypes = Object.entries(summary.byType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);

    if (topTypes.length > 0) {
        parts.push(`Types: ${topTypes.join(', ')}`);
    }

    return parts.join(' | ');
}

/**
 * Calculate connector throughput (documents per second)
 */
export function calculateConnectorThroughput(
    connector: ConnectorUsage
): number {
    if (connector.totalExecutionTime === 0) return 0;
    return (connector.documents / (connector.totalExecutionTime / 1000));
}

/**
 * Compare connector performance
 */
export function compareConnectors(
    connector1: ConnectorUsage,
    connector2: ConnectorUsage
): {
    faster: ConnectorUsage;
    slower: ConnectorUsage;
    timeDifference: number;
    percentageDifference: number;
} {
    const faster =
        connector1.averageExecutionTime < connector2.averageExecutionTime
            ? connector1
            : connector2;
    const slower =
        connector1.averageExecutionTime < connector2.averageExecutionTime
            ? connector2
            : connector1;

    const timeDifference = slower.averageExecutionTime - faster.averageExecutionTime;
    const percentageDifference =
        (timeDifference / faster.averageExecutionTime) * 100;

    return {
        faster,
        slower,
        timeDifference,
        percentageDifference,
    };
}
