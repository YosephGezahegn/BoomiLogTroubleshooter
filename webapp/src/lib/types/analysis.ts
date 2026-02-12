/**
 * Type definitions for Boomi log parsing and analysis
 */

// ===== Log Line Types =====

export interface LogLine {
    timestamp: string; // ISO 8601 format
    logLevel: string; // INFO, WARNING, SEVERE, etc.
    shapeName: string; // Name of the shape being executed
    component: string; // Component details
    message: string; // Full log message
    lineNumber: number; // Original line number in file
}

// ===== Shape Execution Types =====

export interface ShapeExecution {
    shapeName: string;
    executionTime: number; // in milliseconds
    occurredAt: string; // timestamp
    component?: string;
    documents?: number; // number of documents processed
    lineNumber: number;
}

// ===== Error Types =====

export interface ErrorEntry {
    timestamp: string;
    shapeName: string;
    severity: 'WARNING' | 'SEVERE';
    errorType?: string; // HTTP 400, HTTP 500, etc.
    statusCode?: number; // HTTP status code if applicable
    message: string;
    component?: string;
    lineNumber: number;
}

export interface ErrorAnalysis {
    errors: ErrorEntry[];
    categorized: {
        byType: Record<string, ErrorEntry[]>;
        bySeverity: Record<string, ErrorEntry[]>;
        byStatusCode: Record<number, ErrorEntry[]>;
    };
    timeline: Array<{
        timestamp: string;
        count: number;
        severity: string;
    }>;
    summary: {
        total: number;
        severe: number;
        warnings: number;
        httpErrors: number;
        mostCommonType?: string;
    };
}

// ===== Connector Types =====

export interface ConnectorUsage {
    connectorId: string;
    connectorName: string;
    connectorType: string; // HTTP, Database, etc.
    operation?: string; // GET, POST, SELECT, etc.
    callCount: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    documents: number;
    lineNumbers: number[];
}

export interface ConnectorStats {
    connectors: ConnectorUsage[];
    summary: {
        totalConnectors: number;
        totalCalls: number;
        averageCallTime: number;
        byType: Record<string, number>;
    };
}

// ===== Process Flow Types =====

export interface ProcessNode {
    id: string;
    name: string;
    type: 'process' | 'subprocess' | 'shape';
    executionCount?: number;
    avgExecutionTime?: number;
    documents?: number;
    status?: 'success' | 'error' | 'warning';
    lineNumber?: number;
}

export interface ProcessEdge {
    from: string;
    to: string;
    documents?: number;
    condition?: string;
}

export interface ProcessFlow {
    nodes: ProcessNode[];
    edges: ProcessEdge[];
    hierarchy: ProcessHierarchy[];
}

export interface ProcessHierarchy {
    processId: string;
    processName: string;
    parentProcessId?: string;
    level: number; // 0 = main, 1 = first level sub, etc.
    children: ProcessHierarchy[];
}

// ===== Pagination Analysis =====

export interface PaginationData {
    detected: boolean;
    pattern?: string; // e.g., "f_0_0_0..."
    iterations: Array<{
        continuationId: string;
        timestamp: string;
        level: number; // Depth of pagination
    }>;
    summary: {
        totalIterations: number;
        maxDepth: number;
        efficiency?: string; // "Efficient" | "Inefficient"
    };
}

// ===== Summary Types =====

export interface ExecutionSummary {
    fileName: string;
    fileSize: number;
    lineCount: number;
    processName?: string;
    processId?: string;

    // Timing
    startTime?: string;
    endTime?: string;
    duration?: number; // in milliseconds

    // Execution stats
    totalShapes: number;
    documentsProcessed: number;

    // Error stats
    errorCount: number;
    warningCount: number;
    severeCount: number;

    // Performance
    averageShapeTime?: number;
    medianShapeTime?: number;

    // Environment
    environment?: 'Production' | 'Test' | 'Development';
}

// ===== Complete Analysis Result =====

export interface AnalysisResult {
    summary: ExecutionSummary;
    topSlowShapes: ShapeExecution[];
    errorAnalysis: ErrorAnalysis;
    processFlow?: ProcessFlow;
    connectorStats?: ConnectorStats;
    paginationData?: PaginationData;

    // Raw data for debugging
    rawMetrics?: {
        shapeExecutions: ShapeExecution[];
        allErrors: ErrorEntry[];
        connectorCalls: ConnectorUsage[];
    };
}

// ===== Parser Configuration =====

export interface ParsingConfig {
    topN: number; // Number of slowest shapes to return
    includeFlow: boolean; // Build process flow diagram
    includeConnectors: boolean; // Extract connector stats
    includePagination: boolean; // Detect pagination patterns
    minExecutionTime?: number; // Filter out shapes below this time (ms)
}

export const DEFAULT_PARSING_CONFIG: ParsingConfig = {
    topN: 10,
    includeFlow: true,
    includeConnectors: true,
    includePagination: true,
    minExecutionTime: 0,
};

// ===== Log Format Constants =====

export const LOG_PATTERNS = {
    // Tab-separated format: TIMESTAMP\tLOG_LEVEL\tSHAPE_NAME\tCOMPONENT\tMESSAGE
    LOG_LINE: /^([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t(.+)$/,

    // Execution time pattern: "X ms" or "... X ms"
    EXECUTION_TIME: /(\d+)\s*ms/i,

    // Document count: "X document(s)"
    DOCUMENT_COUNT: /(\d+)\s+document\(s\)/i,

    // Process execution
    PROCESS_START: /Executing Process (.+)/i,
    PROCESS_END: /Process execution completed/i,

    // Shapes
    SHAPE_EXECUTION: /Executing (\w+) Shape/i,

    // Connectors
    CONNECTOR_PATTERN: /\[Common\]\s+(.+?):\s+(.+?)\s+Connector/i,
    CONNECTOR_OPERATION: /\[.+?\]\s+(.+?)\s+Operation/i,

    // Pagination/Continuation
    CONTINUATION: /Continuation (f(?:_\d+)+)/i,

    // HTTP errors
    HTTP_ERROR: /HTTP[\/\s](\d{3})/i,

    // Severity
    SEVERE: /SEVERE/i,
    WARNING: /WARNING/i,

    // Timestamp (ISO 8601)
    TIMESTAMP: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/,
};

// ===== Helper Types =====

export type LogLevel = 'INFO' | 'WARNING' | 'SEVERE' | 'DEBUG' | 'TRACE';

export type ProcessStatus = 'success' | 'error' | 'warning' | 'running';

export type ShapeType =
    | 'Start'
    | 'Stop'
    | 'Branch'
    | 'Connector'
    | 'Message'
    | 'Map'
    | 'Business Rules'
    | 'Data Process'
    | 'Decision'
    | 'Notify'
    | 'Process Call'
    | 'Try/Catch'
    | 'Unknown';
