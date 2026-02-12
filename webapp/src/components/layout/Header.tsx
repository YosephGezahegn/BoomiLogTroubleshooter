'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const stored = localStorage.getItem('theme');
        const preferred = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(preferred as 'light' | 'dark');
        document.documentElement.setAttribute('data-theme', preferred);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        localStorage.setItem('theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    return (
        <header className="app-header">
            <div className="header-inner">
                <Link href="/" className="header-brand">
                    <svg className="header-logo" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
                        <path d="M8 16L14 10L20 16L14 22Z" fill="white" opacity="0.9" />
                        <path d="M14 16L20 10L26 16L20 22Z" fill="white" opacity="0.6" />
                        <defs>
                            <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                                <stop stopColor="hsl(210, 90%, 55%)" />
                                <stop offset="1" stopColor="hsl(250, 80%, 55%)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="header-title">Boomi Log Analyzer</span>
                </Link>

                <nav className="header-nav">
                    <Link href="/analyze" className="nav-link">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        New Analysis
                    </Link>
                    <Link href="/history" className="nav-link">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4v4l3 2M14 8a6 6 0 11-12 0 6 6 0 0112 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        History
                    </Link>
                </nav>

                <div className="header-actions">
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
