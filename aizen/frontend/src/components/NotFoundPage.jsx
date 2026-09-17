import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Frown } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        padding: '2rem',
      }}
    >
      <div className="animate-scale-in" style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Animated icon */}
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            animation: 'pulse-slow 2.5s ease-in-out infinite',
          }}
        >
          <Frown size={40} style={{ color: '#60a5fa' }} />
        </div>

        <div
          style={{
            fontSize: '5rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, var(--color-accent-soft), var(--color-accent-rose))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            color: 'var(--color-text)',
          }}
        >
          Page not found
        </h1>

        <p
          style={{
            color: 'var(--color-muted)',
            fontSize: '0.95rem',
            lineHeight: 1.65,
            marginBottom: '2rem',
          }}
        >
          The page you're looking for doesn't exist or was moved. Let's get
          you back to building something cool.
        </p>

        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 2rem',
            borderRadius: 14,
            background: 'var(--color-accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(59,130,246,0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.35)';
          }}
        >
          <Home size={16} />
          Go Home
        </button>
      </div>
    </div>
  );
}
