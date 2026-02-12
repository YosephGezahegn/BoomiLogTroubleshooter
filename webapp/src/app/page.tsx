import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="analyze-page">
      <div className="analyze-container" style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
        {/* Hero */}
        <div style={{ maxWidth: '680px', margin: '0 auto', marginBottom: '3rem' }}>
          <h1 className="analyze-title" style={{ fontSize: '2.75rem', lineHeight: 1.15, marginBottom: '1rem' }}>
            Boomi Log<br />Troubleshooter
          </h1>
          <p style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}>
            Upload a Boomi process log and instantly identify bottlenecks,
            errors, and connector issues. Get actionable insights in seconds.
          </p>
          <Link href="/analyze" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1v10M9 11l-4-4M9 11l4-4M2 16h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Analyze Log File
          </Link>
        </div>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-6)',
          textAlign: 'left',
          maxWidth: '960px',
          margin: '0 auto',
        }}>
          {/* Feature 1 */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div className="metric-card__icon metric-card__icon--blue" style={{ marginBottom: 'var(--space-4)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17l4-6 4 4 6-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>Performance Analysis</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 0 }}>
              Find the slowest shapes and connectors. Get execution time statistics with percentile analysis.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div className="metric-card__icon metric-card__icon--red" style={{ marginBottom: 'var(--space-4)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L2 18h16L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M10 8v4M10 14v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>Error Detection</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 0 }}>
              Categorize errors by type, severity, and HTTP status code. Identify critical failures instantly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div className="metric-card__icon metric-card__icon--green" style={{ marginBottom: 'var(--space-4)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="15" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="15" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 9l6-3M7 11l6 3" stroke="currentColor" strokeWidth="1.5" /></svg>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>Connector Tracking</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 0 }}>
              Analyze HTTP, Database, FTP connector calls. Track latency and identify bottleneck operations.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div className="metric-card__icon metric-card__icon--purple" style={{ marginBottom: 'var(--space-4)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="6" cy="5" r="1.5" fill="currentColor" /><circle cx="12" cy="10" r="1.5" fill="currentColor" /><circle cx="8" cy="15" r="1.5" fill="currentColor" /></svg>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>Process Flows</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 0 }}>
              Visualize process execution hierarchy. Detect critical paths and branching points.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div className="metric-card__icon metric-card__icon--orange" style={{ marginBottom: 'var(--space-4)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l4 6-4 6M10 4l4 6-4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>Pagination Detection</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 0 }}>
              Detect continuation patterns and loop issues. Analyze pagination efficiency and performance.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div className="metric-card__icon metric-card__icon--gray" style={{ marginBottom: 'var(--space-4)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 1v9M7 10l-3-3M7 10l3-3M2 13h10M13 7v9M13 16l-3-3M13 16l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>Export & Compare</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 0 }}>
              Export results as JSON or CSV. Compare analyses to track performance trends over time.
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p style={{
          marginTop: '3rem',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-tertiary)',
        }}>
          Supports .log and .txt files up to 50MB • Built for Dell Boomi process logs
        </p>
      </div>
    </main>
  );
}
