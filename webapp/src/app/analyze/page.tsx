'use client';

import { useState, useCallback } from 'react';
import FileUploader from '@/components/common/FileUploader';
import ResultsSummary from '@/components/analysis/ResultsSummary';
import ExecutionTimesTable from '@/components/analysis/ExecutionTimesTable';
import ErrorsPanel from '@/components/analysis/ErrorsPanel';
import { AnalysisResult } from '@/lib/types/analysis';

export default function AnalyzePage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analysisTime, setAnalysisTime] = useState<number>(0);

    // Options
    const [topN, setTopN] = useState(10);
    const [includeFlow, setIncludeFlow] = useState(true);
    const [includeConnectors, setIncludeConnectors] = useState(true);
    const [includePagination, setIncludePagination] = useState(true);

    const handleFileSelect = useCallback((selectedFile: File) => {
        setFile(selectedFile);
        setError(null);
        setResult(null);
    }, []);

    const handleAnalyze = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('topN', topN.toString());
            formData.append('includeFlow', includeFlow.toString());
            formData.append('includeConnectors', includeConnectors.toString());
            formData.append('includePagination', includePagination.toString());

            const startTime = performance.now();
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            const elapsed = performance.now() - startTime;
            setAnalysisTime(elapsed);

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Analysis failed');
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleExportJSON = () => {
        if (!result) return;
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        if (!result) return;
        const headers = ['Rank', 'Shape Name', 'Execution Time (ms)', 'Documents', 'Line Number'];
        const rows = result.topSlowShapes.map((s, i) =>
            [i + 1, `"${s.shapeName}"`, s.executionTime, s.documents || 0, s.lineNumber].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slowest-shapes-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="analyze-page">
            <div className="analyze-container">
                {/* Header */}
                <div className="analyze-header">
                    <h1 className="analyze-title">Analyze Log File</h1>
                    <p className="analyze-subtitle">
                        Upload a Boomi process log to identify bottlenecks and errors
                    </p>
                </div>

                {/* Upload Section */}
                {!result && (
                    <section className="upload-section">
                        <FileUploader
                            onFileSelect={handleFileSelect}
                            isLoading={loading}
                        />

                        {/* Analysis Options */}
                        {file && !loading && (
                            <>
                                <div className="analyze-options">
                                    <div className="option-group">
                                        <label htmlFor="topN">Top Results</label>
                                        <select
                                            id="topN"
                                            value={topN}
                                            onChange={(e) => setTopN(parseInt(e.target.value))}
                                        >
                                            <option value="5">Top 5</option>
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>

                                    <div className="option-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={includeFlow}
                                                onChange={(e) => setIncludeFlow(e.target.checked)}
                                            />{' '}
                                            Process Flow
                                        </label>
                                    </div>

                                    <div className="option-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={includeConnectors}
                                                onChange={(e) => setIncludeConnectors(e.target.checked)}
                                            />{' '}
                                            Connectors
                                        </label>
                                    </div>

                                    <div className="option-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={includePagination}
                                                onChange={(e) => setIncludePagination(e.target.checked)}
                                            />{' '}
                                            Pagination
                                        </label>
                                    </div>
                                </div>

                                <div className="analyze-submit">
                                    <button
                                        className="btn-primary"
                                        onClick={handleAnalyze}
                                        disabled={loading}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                            <path d="M3 15l4-6 3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Analyze Log File
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="file-error" style={{ marginTop: '1rem' }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                {error}
                            </div>
                        )}
                    </section>
                )}

                {/* Results Section */}
                {result && (
                    <section className="results-section">
                        {/* Analysis Time */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 0 }}>
                                Analysis completed in {(analysisTime / 1000).toFixed(2)}s
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                <button className="btn-outline" onClick={() => { setResult(null); setFile(null); }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M1 7a6 6 0 0111.2-3M13 7A6 6 0 011.8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M12 1v3h-3M2 13v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    New Analysis
                                </button>
                                <button className="btn-outline" onClick={handleExportJSON}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M7 1v9M7 10l-3-3M7 10l3-3M2 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    JSON
                                </button>
                                <button className="btn-outline" onClick={handleExportCSV}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M7 1v9M7 10l-3-3M7 10l3-3M2 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    CSV
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <ResultsSummary result={result} />

                        {/* Two-column layout */}
                        <div className="results-grid">
                            {/* Left: Execution Times */}
                            <div>
                                <ExecutionTimesTable
                                    shapes={result.topSlowShapes}
                                    title={`Top ${result.topSlowShapes.length} Slowest Shapes`}
                                />
                            </div>

                            {/* Right: Errors */}
                            <div>
                                <ErrorsPanel errorAnalysis={result.errorAnalysis} />
                            </div>
                        </div>

                        {/* Connectors */}
                        {result.connectorStats && result.connectorStats.summary.totalConnectors > 0 && (
                            <div className="card">
                                <div className="card__header">
                                    <h3 className="card__title">Connector Performance</h3>
                                    <span className="card__badge">{result.connectorStats.summary.totalConnectors} connectors</span>
                                </div>
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th className="data-table__th">Connector</th>
                                                <th className="data-table__th">Type</th>
                                                <th className="data-table__th data-table__th--right">Calls</th>
                                                <th className="data-table__th data-table__th--right">Avg Time</th>
                                                <th className="data-table__th data-table__th--right data-table__th--hide-mobile">Total Time</th>
                                                <th className="data-table__th data-table__th--right data-table__th--hide-mobile">Documents</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.connectorStats.connectors.slice(0, 10).map((conn, i) => (
                                                <tr key={i} className="data-table__row">
                                                    <td className="data-table__td">
                                                        <span className="shape-name">{conn.connectorName}</span>
                                                    </td>
                                                    <td className="data-table__td">
                                                        <span className="badge badge--blue">{conn.connectorType}</span>
                                                    </td>
                                                    <td className="data-table__td data-table__td--right">{conn.callCount}</td>
                                                    <td className="data-table__td data-table__td--right">
                                                        <span className={`time-value ${conn.averageExecutionTime > 1000 ? 'time--slow' : conn.averageExecutionTime > 500 ? 'time--moderate' : 'time--fast'}`}>
                                                            {conn.averageExecutionTime.toFixed(0)}ms
                                                        </span>
                                                    </td>
                                                    <td className="data-table__td data-table__td--right data-table__td--hide-mobile">
                                                        {(conn.totalExecutionTime / 1000).toFixed(1)}s
                                                    </td>
                                                    <td className="data-table__td data-table__td--right data-table__td--hide-mobile">
                                                        {conn.documents.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {result.paginationData?.detected && (
                            <div className="card">
                                <div className="card__header">
                                    <h3 className="card__title">Pagination Detected</h3>
                                    <span className="badge badge--yellow">
                                        {result.paginationData.summary.totalIterations} iterations
                                    </span>
                                </div>
                                <div style={{ padding: 'var(--space-5) var(--space-6)' }}>
                                    <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                                        <div className="metric-card">
                                            <div className="metric-card__content">
                                                <p className="metric-card__value">{result.paginationData.summary.totalIterations}</p>
                                                <p className="metric-card__label">Total Iterations</p>
                                            </div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="metric-card__content">
                                                <p className="metric-card__value">{result.paginationData.summary.maxDepth}</p>
                                                <p className="metric-card__label">Max Depth</p>
                                            </div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="metric-card__content">
                                                <p className="metric-card__value">{result.paginationData.summary.efficiency || 'N/A'}</p>
                                                <p className="metric-card__label">Efficiency</p>
                                            </div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="metric-card__content">
                                                <p className="metric-card__value">{result.paginationData.pattern || 'N/A'}</p>
                                                <p className="metric-card__label">Pattern</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Raw JSON Viewer */}
                        <details className="card" style={{ cursor: 'pointer' }}>
                            <summary className="card__header" style={{ listStyle: 'none' }}>
                                <h3 className="card__title">Raw JSON Data</h3>
                                <span className="card__badge">Toggle</span>
                            </summary>
                            <pre style={{
                                padding: 'var(--space-4) var(--space-6)',
                                fontSize: 'var(--font-size-xs)',
                                fontFamily: 'var(--font-family-mono)',
                                overflow: 'auto',
                                maxHeight: '400px',
                                margin: 0,
                                backgroundColor: 'var(--color-surface)',
                            }}>
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>
                    </section>
                )}
            </div>
        </div>
    );
}
