'use client';

import { useState, useRef, useCallback } from 'react';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
    accept?: string;
    maxSizeMB?: number;
}

export default function FileUploader({
    onFileSelect,
    isLoading = false,
    accept = '.log,.txt',
    maxSizeMB = 50,
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = useCallback(
        (file: File): string | null => {
            const maxBytes = maxSizeMB * 1024 * 1024;
            if (file.size > maxBytes) {
                return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: ${maxSizeMB}MB`;
            }
            const ext = file.name.toLowerCase().split('.').pop();
            if (!['log', 'txt'].includes(ext || '')) {
                return 'Invalid file type. Please upload a .log or .txt file';
            }
            return null;
        },
        [maxSizeMB]
    );

    const handleFile = useCallback(
        (file: File) => {
            const err = validateFile(file);
            if (err) {
                setError(err);
                setSelectedFile(null);
                return;
            }
            setError(null);
            setSelectedFile(file);
            onFileSelect(file);
        },
        [validateFile, onFileSelect]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    const estimateTime = (bytes: number): string => {
        const lines = bytes / 100; // rough estimate
        const seconds = Math.max(1, Math.ceil(lines / 50000));
        if (seconds < 60) return `~${seconds}s`;
        return `~${Math.ceil(seconds / 60)}min`;
    };

    return (
        <div className="file-uploader">
            <div
                className={`drop-zone ${isDragging ? 'drop-zone--dragging' : ''} ${selectedFile ? 'drop-zone--has-file' : ''} ${isLoading ? 'drop-zone--loading' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isLoading && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload log file"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="drop-zone__input"
                    disabled={isLoading}
                />

                {isLoading ? (
                    <div className="drop-zone__loading">
                        <div className="spinner" />
                        <p className="drop-zone__text">Analyzing log file...</p>
                        <p className="drop-zone__hint">This may take a moment for large files</p>
                    </div>
                ) : selectedFile ? (
                    <div className="drop-zone__selected">
                        <div className="file-icon">
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <rect x="4" y="2" width="24" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="var(--color-primary-50)" />
                                <path d="M28 2v8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <rect x="28" y="2" width="8" height="8" rx="2" fill="var(--color-primary-100)" stroke="currentColor" strokeWidth="2" />
                                <line x1="10" y1="16" x2="26" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                                <line x1="10" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                                <line x1="10" y1="24" x2="24" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                                <line x1="10" y1="28" x2="18" y2="28" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                            </svg>
                        </div>
                        <div className="file-details">
                            <p className="file-details__name">{selectedFile.name}</p>
                            <p className="file-details__meta">
                                {formatSize(selectedFile.size)}
                                {selectedFile.size > 10 * 1024 * 1024 && (
                                    <span className="file-details__estimate">
                                        &nbsp;• Est. {estimateTime(selectedFile.size)}
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            className="file-details__change"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                                setError(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                        >
                            Change
                        </button>
                    </div>
                ) : (
                    <div className="drop-zone__empty">
                        <div className="drop-zone__icon">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <path d="M24 32V16M24 16l-6 6M24 16l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 32v4a4 4 0 004 4h24a4 4 0 004-4v-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <p className="drop-zone__text">
                            Drag & drop your Boomi log file here
                        </p>
                        <p className="drop-zone__hint">
                            or click to browse • .log, .txt up to {maxSizeMB}MB
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div className="file-error">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {error}
                </div>
            )}
        </div>
    );
}
