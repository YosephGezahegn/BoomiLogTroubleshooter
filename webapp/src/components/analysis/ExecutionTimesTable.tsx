'use client';

import { useState } from 'react';
import { ShapeExecution } from '@/lib/types/analysis';

interface ExecutionTimesTableProps {
    shapes: ShapeExecution[];
    title?: string;
}

type SortKey = 'rank' | 'shapeName' | 'executionTime' | 'documents';
type SortDir = 'asc' | 'desc';

export default function ExecutionTimesTable({
    shapes,
    title = 'Slowest Shapes',
}: ExecutionTimesTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('rank');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir(key === 'executionTime' ? 'desc' : 'asc');
        }
    };

    const sorted = [...shapes].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        switch (sortKey) {
            case 'rank':
                return dir * (shapes.indexOf(a) - shapes.indexOf(b));
            case 'shapeName':
                return dir * a.shapeName.localeCompare(b.shapeName);
            case 'executionTime':
                return dir * (a.executionTime - b.executionTime);
            case 'documents':
                return dir * ((a.documents || 0) - (b.documents || 0));
            default:
                return 0;
        }
    });

    const copyName = (name: string, index: number) => {
        navigator.clipboard.writeText(name);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1500);
    };

    const formatTime = (ms: number): string => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    };

    const getSeverityClass = (ms: number): string => {
        if (ms >= 5000) return 'time--critical';
        if (ms >= 1000) return 'time--slow';
        if (ms >= 500) return 'time--moderate';
        return 'time--fast';
    };

    const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
        <span className={`sort-icon ${active ? 'sort-icon--active' : ''}`}>
            {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
    );

    if (shapes.length === 0) {
        return (
            <div className="card">
                <div className="card__header">
                    <h3 className="card__title">{title}</h3>
                </div>
                <div className="card__empty">
                    <p>No execution time data found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card__header">
                <h3 className="card__title">{title}</h3>
                <span className="card__badge">{shapes.length} shapes</span>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="data-table__th data-table__th--narrow" onClick={() => handleSort('rank')}>
                                # <SortIcon active={sortKey === 'rank'} dir={sortDir} />
                            </th>
                            <th className="data-table__th" onClick={() => handleSort('shapeName')}>
                                Shape Name <SortIcon active={sortKey === 'shapeName'} dir={sortDir} />
                            </th>
                            <th className="data-table__th data-table__th--right" onClick={() => handleSort('executionTime')}>
                                Time <SortIcon active={sortKey === 'executionTime'} dir={sortDir} />
                            </th>
                            <th className="data-table__th data-table__th--right data-table__th--hide-mobile" onClick={() => handleSort('documents')}>
                                Docs <SortIcon active={sortKey === 'documents'} dir={sortDir} />
                            </th>
                            <th className="data-table__th data-table__th--hide-mobile">
                                Line
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((shape, index) => (
                            <tr key={index} className="data-table__row">
                                <td className="data-table__td data-table__td--rank">
                                    <span className="rank-badge">{shapes.indexOf(shape) + 1}</span>
                                </td>
                                <td className="data-table__td">
                                    <div className="shape-cell">
                                        <span className="shape-name">{shape.shapeName}</span>
                                        <button
                                            className="copy-btn"
                                            onClick={() => copyName(shape.shapeName, index)}
                                            title="Copy shape name"
                                        >
                                            {copiedIndex === index ? (
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            ) : (
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="5" y="5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" /><path d="M3 9V3a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.2" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </td>
                                <td className="data-table__td data-table__td--right">
                                    <span className={`time-value ${getSeverityClass(shape.executionTime)}`}>
                                        {formatTime(shape.executionTime)}
                                    </span>
                                    <div className="time-bar">
                                        <div
                                            className={`time-bar__fill ${getSeverityClass(shape.executionTime)}`}
                                            style={{
                                                width: `${Math.min(100, (shape.executionTime / shapes[0].executionTime) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                </td>
                                <td className="data-table__td data-table__td--right data-table__td--hide-mobile">
                                    {shape.documents?.toLocaleString() || '—'}
                                </td>
                                <td className="data-table__td data-table__td--mono data-table__td--hide-mobile">
                                    {shape.lineNumber}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
