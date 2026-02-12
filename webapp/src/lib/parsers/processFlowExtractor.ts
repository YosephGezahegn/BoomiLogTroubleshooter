/**
 * Process Flow Extractor
 * Builds process flow diagram from log lines
 */

import {
    LogLine,
    ProcessNode,
    ProcessEdge,
    ProcessFlow,
    ProcessHierarchy,
    ShapeType,
} from '../types/analysis';
import {
    extractProcessName,
    extractShapeType,
    isProcessExecution,
    extractDocumentCount,
    extractExecutionTime,
} from './logLineParser';

/**
 * Extract process flow from log lines
 */
export function extractProcessFlow(lines: LogLine[]): ProcessFlow {
    const nodes: ProcessNode[] = [];
    const edges: ProcessEdge[] = [];
    const hierarchy: ProcessHierarchy[] = [];

    // Track process hierarchy
    const processStack: Array<{
        id: string;
        name: string;
        level: number;
    }> = [];

    // Track shape execution order
    let previousShapeId: string | null = null;
    const nodeMap = new Map<string, ProcessNode>();
    const shapeCounter = new Map<string, number>();

    for (const line of lines) {
        // Check for process execution
        if (isProcessExecution(line)) {
            const processName = extractProcessName(line.message);
            if (processName) {
                const processId = `process_${processName.replace(/\s+/g, '_')}`;
                const level = processStack.length;

                // Add to hierarchy
                const hierarchyNode: ProcessHierarchy = {
                    processId,
                    processName,
                    parentProcessId: processStack.length > 0 ? processStack[processStack.length - 1].id : undefined,
                    level,
                    children: [],
                };

                // Add to parent's children if exists
                if (processStack.length > 0) {
                    const parent = hierarchy.find((h) => h.processId === processStack[processStack.length - 1].id);
                    if (parent) {
                        parent.children.push(hierarchyNode);
                    }
                } else {
                    hierarchy.push(hierarchyNode);
                }

                // Push to stack
                processStack.push({
                    id: processId,
                    name: processName,
                    level,
                });

                // Add process node
                const processNode: ProcessNode = {
                    id: processId,
                    name: processName,
                    type: level === 0 ? 'process' : 'subprocess',
                    lineNumber: line.lineNumber,
                };

                if (!nodeMap.has(processId)) {
                    nodes.push(processNode);
                    nodeMap.set(processId, processNode);
                }

                // Create edge from previous shape to process
                if (previousShapeId) {
                    edges.push({
                        from: previousShapeId,
                        to: processId,
                    });
                }

                previousShapeId = processId;
            }
        }

        // Check for shape execution
        const shapeType = extractShapeType(line.message);
        if (shapeType || line.shapeName) {
            const shapeName = line.shapeName;

            // Create unique ID for this shape instance
            const count = (shapeCounter.get(shapeName) || 0) + 1;
            shapeCounter.set(shapeName, count);
            const shapeId = `${shapeName.replace(/\s+/g, '_')}_${count}`;

            // Get execution metrics
            const executionTime = extractExecutionTime(line.message);
            const documents = extractDocumentCount(line.message);

            // Determine status from log level
            let status: 'success' | 'error' | 'warning' | undefined;
            if (line.logLevel === 'SEVERE') {
                status = 'error';
            } else if (line.logLevel === 'WARNING') {
                status = 'warning';
            } else if (executionTime !== null) {
                status = 'success';
            }

            // Create shape node
            const shapeNode: ProcessNode = {
                id: shapeId,
                name: shapeName,
                type: 'shape',
                executionCount: 1,
                avgExecutionTime: executionTime || undefined,
                documents: documents || undefined,
                status,
                lineNumber: line.lineNumber,
            };

            // Check if we already have this shape (by name, not ID)
            const existingNode = Array.from(nodeMap.values()).find(
                (n) => n.name === shapeName && n.type === 'shape'
            );

            if (existingNode) {
                // Update existing node stats
                existingNode.executionCount = (existingNode.executionCount || 0) + 1;
                if (executionTime && existingNode.avgExecutionTime) {
                    existingNode.avgExecutionTime =
                        (existingNode.avgExecutionTime * (existingNode.executionCount - 1) + executionTime) /
                        existingNode.executionCount;
                }
                if (documents) {
                    existingNode.documents = (existingNode.documents || 0) + documents;
                }
                // Update status to worst case
                if (status === 'error' || existingNode.status !== 'error') {
                    existingNode.status = status;
                }
            } else {
                nodes.push(shapeNode);
                nodeMap.set(shapeId, shapeNode);
            }

            // Create edge from previous shape
            if (previousShapeId) {
                const existingEdge = edges.find(
                    (e) => e.from === previousShapeId && e.to === shapeId
                );

                if (!existingEdge) {
                    edges.push({
                        from: previousShapeId,
                        to: shapeId,
                        documents: documents || undefined,
                    });
                } else if (documents) {
                    existingEdge.documents = (existingEdge.documents || 0) + documents;
                }
            }

            previousShapeId = shapeId;
        }

        // Check for process end
        if (line.message.toLowerCase().includes('process execution completed')) {
            if (processStack.length > 0) {
                processStack.pop();
            }
        }
    }

    return {
        nodes,
        edges,
        hierarchy,
    };
}

/**
 * Simplify flow by merging duplicate shapes
 */
export function simplifyFlow(flow: ProcessFlow): ProcessFlow {
    const nodeMap = new Map<string, ProcessNode>();
    const simplifiedNodes: ProcessNode[] = [];
    const simplifiedEdges: ProcessEdge[] = [];

    // Merge nodes with same name
    for (const node of flow.nodes) {
        const existing = nodeMap.get(node.name);

        if (existing && node.type === 'shape') {
            // Merge stats
            existing.executionCount = (existing.executionCount || 0) + (node.executionCount || 1);

            if (node.avgExecutionTime && existing.avgExecutionTime) {
                existing.avgExecutionTime =
                    (existing.avgExecutionTime + node.avgExecutionTime) / 2;
            } else if (node.avgExecutionTime) {
                existing.avgExecutionTime = node.avgExecutionTime;
            }

            if (node.documents) {
                existing.documents = (existing.documents || 0) + node.documents;
            }

            // Keep worst status
            if (node.status === 'error' || (node.status === 'warning' && existing.status !== 'error')) {
                existing.status = node.status;
            }
        } else {
            nodeMap.set(node.name, node);
            simplifiedNodes.push(node);
        }
    }

    // Rebuild edges with simplified nodes
    const edgeMap = new Map<string, ProcessEdge>();

    for (const edge of flow.edges) {
        const fromNode = flow.nodes.find((n) => n.id === edge.from);
        const toNode = flow.nodes.find((n) => n.id === edge.to);

        if (fromNode && toNode) {
            const edgeKey = `${fromNode.name}_${toNode.name}`;
            const existing = edgeMap.get(edgeKey);

            if (existing) {
                if (edge.documents) {
                    existing.documents = (existing.documents || 0) + edge.documents;
                }
            } else {
                edgeMap.set(edgeKey, {
                    from: fromNode.name,
                    to: toNode.name,
                    documents: edge.documents,
                    condition: edge.condition,
                });
            }
        }
    }

    simplifiedEdges.push(...edgeMap.values());

    return {
        nodes: simplifiedNodes,
        edges: simplifiedEdges,
        hierarchy: flow.hierarchy,
    };
}

/**
 * Find critical path (longest execution path)
 */
export function findCriticalPath(flow: ProcessFlow): {
    path: ProcessNode[];
    totalTime: number;
} {
    const nodeMap = new Map<string, ProcessNode>();
    flow.nodes.forEach((n) => nodeMap.set(n.id, n));

    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    for (const edge of flow.edges) {
        if (!adjacency.has(edge.from)) {
            adjacency.set(edge.from, []);
        }
        adjacency.get(edge.from)!.push(edge.to);
    }

    // Find all paths using DFS
    const allPaths: Array<{ path: ProcessNode[]; totalTime: number }> = [];

    function dfs(nodeId: string, path: ProcessNode[], totalTime: number) {
        const node = nodeMap.get(nodeId);
        if (!node) return;

        const newPath = [...path, node];
        const newTime = totalTime + (node.avgExecutionTime || 0);

        const neighbors = adjacency.get(nodeId) || [];

        if (neighbors.length === 0) {
            // Leaf node, save path
            allPaths.push({ path: newPath, totalTime: newTime });
        } else {
            // Continue DFS
            for (const neighbor of neighbors) {
                dfs(neighbor, newPath, newTime);
            }
        }
    }

    // Start DFS from all root nodes (nodes with no incoming edges)
    const hasIncoming = new Set(flow.edges.map((e) => e.to));
    const rootNodes = flow.nodes.filter((n) => !hasIncoming.has(n.id));

    for (const root of rootNodes) {
        dfs(root.id, [], 0);
    }

    // Find longest path
    if (allPaths.length === 0) {
        return { path: [], totalTime: 0 };
    }

    const critical = allPaths.reduce((max, current) =>
        current.totalTime > max.totalTime ? current : max
    );

    return critical;
}

/**
 * Detect branching points in flow
 */
export function detectBranches(flow: ProcessFlow): Array<{
    node: ProcessNode;
    branches: ProcessNode[];
    branchCount: number;
}> {
    const branches: Array<{
        node: ProcessNode;
        branches: ProcessNode[];
        branchCount: number;
    }> = [];

    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    for (const edge of flow.edges) {
        if (!adjacency.has(edge.from)) {
            adjacency.set(edge.from, []);
        }
        adjacency.get(edge.from)!.push(edge.to);
    }

    // Find nodes with multiple outgoing edges
    for (const [nodeId, neighbors] of adjacency) {
        if (neighbors.length > 1) {
            const node = flow.nodes.find((n) => n.id === nodeId);
            const branchNodes = neighbors
                .map((nId) => flow.nodes.find((n) => n.id === nId))
                .filter((n): n is ProcessNode => n !== undefined);

            if (node) {
                branches.push({
                    node,
                    branches: branchNodes,
                    branchCount: neighbors.length,
                });
            }
        }
    }

    return branches;
}

/**
 * Calculate flow statistics
 */
export function calculateFlowStats(flow: ProcessFlow): {
    totalNodes: number;
    totalEdges: number;
    processCount: number;
    shapeCount: number;
    avgExecutionTime: number;
    totalDocuments: number;
    errorNodes: number;
    warningNodes: number;
    maxDepth: number;
} {
    const processCount = flow.nodes.filter((n) => n.type === 'process' || n.type === 'subprocess').length;
    const shapeCount = flow.nodes.filter((n) => n.type === 'shape').length;

    const executionTimes = flow.nodes
        .map((n) => n.avgExecutionTime || 0)
        .filter((t) => t > 0);

    const avgExecutionTime =
        executionTimes.length > 0
            ? executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length
            : 0;

    const totalDocuments = flow.nodes.reduce((sum, n) => sum + (n.documents || 0), 0);

    const errorNodes = flow.nodes.filter((n) => n.status === 'error').length;
    const warningNodes = flow.nodes.filter((n) => n.status === 'warning').length;

    const maxDepth = flow.hierarchy.reduce(
        (max, h) => Math.max(max, getHierarchyDepth(h)),
        0
    );

    return {
        totalNodes: flow.nodes.length,
        totalEdges: flow.edges.length,
        processCount,
        shapeCount,
        avgExecutionTime,
        totalDocuments,
        errorNodes,
        warningNodes,
        maxDepth,
    };
}

/**
 * Get depth of hierarchy tree
 */
function getHierarchyDepth(node: ProcessHierarchy): number {
    if (node.children.length === 0) {
        return node.level + 1;
    }
    return Math.max(...node.children.map((c) => getHierarchyDepth(c)));
}

/**
 * Convert flow to Mermaid diagram syntax
 */
export function flowToMermaid(flow: ProcessFlow): string {
    const lines: string[] = ['graph TD'];

    // Add nodes
    for (const node of flow.nodes) {
        const shape = getNodeShape(node.type);
        const label = formatNodeLabel(node);
        lines.push(`  ${node.id}${shape.start}${label}${shape.end}`);
    }

    // Add edges
    for (const edge of flow.edges) {
        const label = edge.documents ? `|${edge.documents} docs|` : '';
        lines.push(`  ${edge.from} --${label}--> ${edge.to}`);
    }

    return lines.join('\n');
}

/**
 * Get Mermaid shape syntax for node type
 */
function getNodeShape(type: string): { start: string; end: string } {
    switch (type) {
        case 'process':
            return { start: '[[', end: ']]' }; // Subprocess shape
        case 'subprocess':
            return { start: '[', end: ']' }; // Rectangle
        case 'shape':
        default:
            return { start: '(', end: ')' }; // Rounded rectangle
    }
}

/**
 * Format node label for diagram
 */
function formatNodeLabel(node: ProcessNode): string {
    let label = node.name;

    if (node.avgExecutionTime) {
        label += `<br/>${node.avgExecutionTime.toFixed(0)}ms`;
    }

    if (node.documents) {
        label += `<br/>${node.documents} docs`;
    }

    return label;
}

/**
 * Export flow to JSON for visualization libraries
 */
export function flowToJSON(flow: ProcessFlow): string {
    return JSON.stringify(flow, null, 2);
}
