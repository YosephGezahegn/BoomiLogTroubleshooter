'use client';

import { useState } from 'react';
import { ErrorAnalysis, ErrorEntry } from '@/lib/types/analysis';

interface ErrorsPanelProps {
    errorAnalysis: ErrorAnalysis;
}

export default function ErrorsPanel({ errorAnalysis }: ErrorsPanelProps) {
    const [filter, setFilter] = useState<string>('all');
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const { summary, categorized, errors } = errorAnalysis;

    if (summary.total === 0) {
        return (
            <div className="card">
                <div className="card__header">
                    <h3 className="card__title">Errors & Warnings</h3>
                </div>
                <div className="card__empty card__empty--success">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="20" stroke="var(--color-success)" strokeWidth="2" />
                        <path d="M16 24l6 6 10-10" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p>No errors or warnings detected</p>
                    <p className="text-secondary">This execution completed cleanly</p>
                </div>
            </div>
        );
    }

    const errorTypes = Object.keys(categorized.byType);
    const filteredErrors = filter === 'all'
        ? errors
        : filter === 'SEVERE' || filter === 'WARNING'
            ? errors.filter((e) => e.severity === filter)
            : errors.filter((e) => e.errorType === filter);

    const toggleExpanded = (index: number) => {
        const next = new Set(expanded);
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        setExpanded(next);
    };

    return (
        <div className="card">
            <div className="card__header">
                <h3 className="card__title">Errors & Warnings</h3>
                <div className="card__header-badges">
                    {summary.severe > 0 && (
                        <span className="badge badge--red">{summary.severe} severe</span>
                    )}
                    {summary.warnings > 0 && (
                        <span className="badge badge--yellow">{summary.warnings} warnings</span>
                    )}
                </div>
            </div>

            {/* Error Type Breakdown */}
            <div className="error-types">
                {errorTypes.map((type) => {
                    const count = categorized.byType[type].length;
                    const percentage = (count / summary.total) * 100;
                    return (
                        <div
                            key={type}
                            className={`error-type-bar ${filter === type ? 'error-type-bar--active' : ''}`}
                            onClick={() => setFilter(filter === type ? 'all' : type)}
                        >
                            <div className="error-type-bar__info">
                                <span className="error-type-bar__name">{type}</span>
                                <span className="error-type-bar__count">{count}</span>
                            </div>
                            <div className="error-type-bar__track">
                                <div
                                    className="error-type-bar__fill"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter Tabs */}
            <div className="error-filters">
                <button
                    className={`filter-tab ${filter === 'all' ? 'filter-tab--active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({summary.total})
                </button>
                {summary.severe > 0 && (
                    <button
                        className={`filter-tab filter-tab--red ${filter === 'SEVERE' ? 'filter-tab--active' : ''}`}
                        onClick={() => setFilter(filter === 'SEVERE' ? 'all' : 'SEVERE')}
                    >
                        Severe ({summary.severe})
                    </button>
                )}
                {summary.warnings > 0 && (
                    <button
                        className={`filter-tab filter-tab--yellow ${filter === 'WARNING' ? 'filter-tab--active' : ''}`}
                        onClick={() => setFilter(filter === 'WARNING' ? 'all' : 'WARNING')}
                    >
                        Warnings ({summary.warnings})
                    </button>
                )}
            </div>

            {/* Error List */}
            <div className="error-list">
                {filteredErrors.map((error, index) => (
                    <div
                        key={index}
                        className={`error-item error-item--${error.severity.toLowerCase()}`}
                    >
                        <div
                            className="error-item__header"
                            onClick={() => toggleExpanded(index)}
                        >
                            <div className="error-item__left">
                                <span className={`severity-dot severity-dot--${error.severity.toLowerCase()}`} />
                                <div>
                                    <span className="error-item__type">{error.errorType || 'Error'}</span>
                                    <span className="error-item__shape">{error.shapeName}</span>
                                </div>
                            </div>
                            <div className="error-item__right">
                                <span className="error-item__time">
                                    {new Date(error.timestamp).toLocaleTimeString()}
                                </span>
                                <svg
                                    className={`error-item__chevron ${expanded.has(index) ? 'error-item__chevron--open' : ''}`}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                >
                                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>

                        {expanded.has(index) && (
                            <div className="error-item__details">
                                <div className="error-detail">
                                    <span className="error-detail__label">Message</span>
                                    <p className="error-detail__value error-detail__value--mono">
                                        {error.message}
                                    </p>
                                </div>
                                {error.statusCode && (
                                    <div className="error-detail">
                                        <span className="error-detail__label">Status Code</span>
                                        <span className={`status-code status-code--${Math.floor(error.statusCode / 100)}xx`}>
                                            {error.statusCode}
                                        </span>
                                    </div>
                                )}
                                <div className="error-detail">
                                    <span className="error-detail__label">Line</span>
                                    <span className="error-detail__value">{error.lineNumber}</span>
                                </div>
                                {error.component && (
                                    <div className="error-detail">
                                        <span className="error-detail__label">Component</span>
                                        <span className="error-detail__value">{error.component}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
