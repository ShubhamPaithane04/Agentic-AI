import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — catches any uncaught React render errors beneath it
 * and shows a polished fallback UI instead of a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-background)',
          color: 'var(--color-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem',
        }}
      >
        <div
          className="animate-scale-in"
          style={{
            maxWidth: 480,
            width: '100%',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 24,
            padding: '2.5rem',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <AlertTriangle size={28} style={{ color: '#f87171' }} />
          </div>

          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: 'var(--color-text)',
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-muted)',
              lineHeight: 1.6,
              marginBottom: '0.75rem',
            }}
          >
            Aizen encountered an unexpected error. Your workspace is safe —
            refresh the page to continue.
          </p>

          {this.state.error && (
            <pre
              style={{
                fontSize: '0.7rem',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 10,
                padding: '0.75rem',
                textAlign: 'left',
                color: '#fca5a5',
                overflowX: 'auto',
                marginBottom: '1.25rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.5rem',
              borderRadius: 12,
              background: 'var(--color-accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            Reload Aizen
          </button>
        </div>
      </div>
    );
  }
}
