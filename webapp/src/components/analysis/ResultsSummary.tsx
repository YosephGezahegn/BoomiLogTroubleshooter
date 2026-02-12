'use client';

import { AnalysisResult } from '@/lib/types/analysis';

interface ResultsSummaryProps {
    result: AnalysisResult;
}

export default function ResultsSummary({ result }: ResultsSummaryProps) {
    const { summary, errorAnalysis } = result;

    const healthStatus = summary.severeCount > 0
        ? 'critical'
        : summary.warningCount > 5
            ? 'warning'
            : 'healthy';

    const healthLabel = {
        healthy: 'Healthy',
        warning: 'Warnings',
        critical: 'Critical',
    }[healthStatus];

    const formatDuration = (ms: number): string => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${m}m ${s}s`;
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    return (
        <div className="results-summary">
            {/* Health Status Banner */}
            <div className={`health-banner health-banner--${healthStatus}`}>
                <div className="health-banner__indicator">
                    <span className={`health-dot health-dot--${healthStatus}`} />
                    <span className="health-label">{healthLabel}</span>
                </div>
                {summary.processName && (
                    <span className="health-process">{summary.processName}</span>
                )}
                {summary.environment && (
                    <span className={`env-badge env-badge--${summary.environment.toLowerCase()}`}>
                        {summary.environment}
                    </span>
                )}
            </div>

            {/* Metric Cards Grid */}
            <div className="metrics-grid">
                {/* Duration */}
                <div className="metric-card">
                    <div className="metric-card__icon metric-card__icon--blue">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </div>
                    <div className="metric-card__content">
                        <p className="metric-card__value">
                            {summary.duration ? formatDuration(summary.duration) : 'N/A'}
                        </p>
                        <p className="metric-card__label">Duration</p>
                    </div>
                </div>

                {/* Total Shapes */}
                <div className="metric-card">
                    <div className="metric-card__icon metric-card__icon--purple">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </div>
                    <div className="metric-card__content">
                        <p className="metric-card__value">{summary.totalShapes.toLocaleString()}</p>
                        <p className="metric-card__label">Shapes Executed</p>
                    </div>
                </div>

                {/* Documents */}
                <div className="metric-card">
                    <div className="metric-card__icon metric-card__icon--green">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4a2 2 0 012-2h6l4 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" /><path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </div>
                    <div className="metric-card__content">
                        <p className="metric-card__value">{summary.documentsProcessed.toLocaleString()}</p>
                        <p className="metric-card__label">Documents</p>
                    </div>
                </div>

                {/* Errors */}
                <div className="metric-card">
                    <div className={`metric-card__icon ${summary.severeCount > 0 ? 'metric-card__icon--red' : summary.warningCount > 0 ? 'metric-card__icon--yellow' : 'metric-card__icon--green'}`}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L2 18h16L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M10 8v4M10 14v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </div>
                    <div className="metric-card__content">
                        <p className="metric-card__value">{errorAnalysis.summary.total}</p>
                        <p className="metric-card__label">
                            {summary.severeCount > 0
                                ? `${summary.severeCount} severe`
                                : summary.warningCount > 0
                                    ? `${summary.warningCount} warnings`
                                    : 'No Errors'}
                        </p>
                    </div>
                </div>

                {/* Avg Shape Time */}
                <div className="metric-card">
                    <div className="metric-card__icon metric-card__icon--orange">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17l4-6 4 4 6-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div className="metric-card__content">
                        <p className="metric-card__value">
                            {summary.averageShapeTime ? `${summary.averageShapeTime.toFixed(0)}ms` : 'N/A'}
                        </p>
                        <p className="metric-card__label">Avg Shape Time</p>
                    </div>
                </div>

                {/* File Info */}
                <div className="metric-card">
                    <div className="metric-card__icon metric-card__icon--gray">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </div>
                    <div className="metric-card__content">
                        <p className="metric-card__value">{formatSize(summary.fileSize)}</p>
                        <p className="metric-card__label">{summary.lineCount.toLocaleString()} lines</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
