'use client';

import { useState } from 'react';

export default function TestAnalyzer() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setError('Please select a file');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('topN', '10');
            formData.append('includeFlow', 'true');
            formData.append('includeConnectors', 'true');
            formData.append('includePagination', 'true');

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Boomi Log Analyzer - Test Page
            </h1>

            <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label
                        htmlFor="file"
                        style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '500',
                        }}
                    >
                        Upload Log File (.log or .txt)
                    </label>
                    <input
                        type="file"
                        id="file"
                        accept=".log,.txt"
                        onChange={handleFileChange}
                        style={{
                            display: 'block',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100%',
                            maxWidth: '500px',
                        }}
                    />
                    {file && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!file || loading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: loading ? '#ccc' : '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Analyzing...' : 'Analyze Log File'}
                </button>
            </form>

            {error && (
                <div
                    style={{
                        padding: '1rem',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '4px',
                        marginBottom: '2rem',
                    }}
                >
                    <strong style={{ color: '#c00' }}>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        Analysis Results
                    </h2>

                    {/* Summary */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            Summary
                        </h3>
                        <div
                            style={{
                                backgroundColor: '#f9f9f9',
                                padding: '1rem',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            <p><strong>File:</strong> {result.summary.fileName}</p>
                            <p><strong>Lines:</strong> {result.summary.lineCount.toLocaleString()}</p>
                            <p><strong>Process:</strong> {result.summary.processName || 'Unknown'}</p>
                            <p><strong>Duration:</strong> {result.summary.duration ? `${(result.summary.duration / 1000).toFixed(2)}s` : 'N/A'}</p>
                            <p><strong>Total Shapes:</strong> {result.summary.totalShapes.toLocaleString()}</p>
                            <p><strong>Documents:</strong> {result.summary.documentsProcessed.toLocaleString()}</p>
                            <p><strong>Errors:</strong> {result.errorAnalysis.summary.total} ({result.errorAnalysis.summary.severe} severe, {result.errorAnalysis.summary.warnings} warnings)</p>
                        </div>
                    </section>

                    {/* Top Slow Shapes */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            Top {result.topSlowShapes.length} Slowest Shapes
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    border: '1px solid #e0e0e0',
                                }}
                            >
                                <thead>
                                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Rank</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Shape Name</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ccc' }}>Time (ms)</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ccc' }}>Documents</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Occurred At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.topSlowShapes.map((shape: any, index: number) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                            <td style={{ padding: '0.75rem' }}>{index + 1}</td>
                                            <td style={{ padding: '0.75rem' }}>{shape.shapeName}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{shape.executionTime.toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{shape.documents || '-'}</td>
                                            <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{new Date(shape.occurredAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Errors */}
                    {result.errorAnalysis.summary.total > 0 && (
                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                Errors by Type
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        border: '1px solid #e0e0e0',
                                    }}
                                >
                                    <thead>
                                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Error Type</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ccc' }}>Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(result.errorAnalysis.categorized.byType).map(([type, errors]: [string, any]) => (
                                            <tr key={type} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                                <td style={{ padding: '0.75rem' }}>{type}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{errors.length}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Connectors */}
                    {result.connectorStats && result.connectorStats.summary.totalConnectors > 0 && (
                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                Top Connectors
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        border: '1px solid #e0e0e0',
                                    }}
                                >
                                    <thead>
                                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Connector</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Type</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ccc' }}>Calls</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ccc' }}>Avg Time (ms)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.connectorStats.connectors.slice(0, 10).map((conn: any, index: number) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                                <td style={{ padding: '0.75rem' }}>{conn.connectorName}</td>
                                                <td style={{ padding: '0.75rem' }}>{conn.connectorType}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{conn.callCount}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{conn.averageExecutionTime.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Pagination */}
                    {result.paginationData?.detected && (
                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                Pagination Detected
                            </h3>
                            <div
                                style={{
                                    backgroundColor: '#f9f9f9',
                                    padding: '1rem',
                                    borderRadius: '4px',
                                    border: '1px solid #e0e0e0',
                                }}
                            >
                                <p><strong>Total Iterations:</strong> {result.paginationData.summary.totalIterations}</p>
                                <p><strong>Max Depth:</strong> {result.paginationData.summary.maxDepth}</p>
                                <p><strong>Efficiency:</strong> {result.paginationData.summary.efficiency}</p>
                                <p><strong>Pattern:</strong> {result.paginationData.pattern}</p>
                            </div>
                        </section>
                    )}

                    {/* Raw JSON */}
                    <details style={{ marginTop: '2rem' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '0.5rem' }}>
                            View Raw JSON
                        </summary>
                        <pre
                            style={{
                                backgroundColor: '#f5f5f5',
                                padding: '1rem',
                                borderRadius: '4px',
                                overflow: 'auto',
                                fontSize: '0.875rem',
                                maxHeight: '400px',
                            }}
                        >
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
}
