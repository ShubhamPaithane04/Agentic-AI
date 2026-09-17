import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, Plus, Settings, X, Activity, Zap, Calendar, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../config/api';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

export default function Sidebar({ isOpen, setIsOpen, onNewChat }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { toggleSettingsModal } = useUIStore();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [profileStats, setProfileStats] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setHistory([]);
      setProfileStats(null);
      return;
    }

    // Fetch history
    fetchApi('/api/history')
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => setHistory([]));

    // Fetch profile stats (me endpoint for created_at)
    fetchApi('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProfileStats(data.user);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Format member-since date
  const memberSince = profileStats?.created_at
    ? new Date(profileStats.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-[280px] md:w-[248px]
          flex flex-col h-full shrink-0
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ background: 'var(--color-sidebar)', borderRight: '1px solid var(--color-border)' }}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1 55%, #22d3ee)', boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-[0.14em] uppercase font-display" style={{ color: 'var(--color-text)' }}>
                Aizen
              </h1>
              <div className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                AI coding assistant
              </div>
            </div>
          </div>
          <button
            className="md:hidden"
            style={{ color: 'var(--color-muted)' }}
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-4 pb-4">
          <button
            onClick={() => {
              onNewChat?.();
              setIsOpen(false);
            }}
            className="w-full rounded-xl py-2.5 px-4 flex items-center justify-between transition-all text-sm font-semibold hover:border-[var(--color-accent)]"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <span>New Chat</span>
            <Plus size={15} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 space-y-6 text-sm">

          {/* Profile Stats — only when logged in */}
          {isAuthenticated && (
            <Section title="Your Stats">
              <div
                className="rounded-2xl p-3 space-y-2.5"
                style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid var(--color-border)' }}
              >
                <StatRow
                  icon={<Zap size={13} style={{ color: 'var(--color-accent-amber)' }} />}
                  label="Total Prompts"
                  value={history.length >= 20 ? '20+' : history.length}
                />
                <StatRow
                  icon={<Activity size={13} style={{ color: 'var(--color-accent-green)' }} />}
                  label="Recent Projects"
                  value={history.filter((h) => h.project_name).length}
                />
                {memberSince && (
                  <StatRow
                    icon={<Calendar size={13} style={{ color: 'var(--color-accent-cyan)' }} />}
                    label="Member since"
                    value={memberSince}
                  />
                )}
              </div>
            </Section>
          )}

          {/* Try Asking */}
          <Section title="Try Asking">
            {['Full-stack SaaS dashboard', 'Flask API with auth', 'Make a portfolio website'].map((name) => (
              <button
                key={name}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-2xl text-left transition-all hover:bg-white/[0.04]"
                style={{ background: 'rgba(255,255,255,0.025)', color: 'var(--color-text)' }}
              >
                <span
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: 'rgba(139,92,246,0.14)', color: 'var(--color-accent-soft)' }}
                >
                  +
                </span>
                <span className="truncate">{name}</span>
              </button>
            ))}
          </Section>

          {/* Recent Chats */}
          <Section title="Recent Chats">
            {history.length === 0 && (
              <div
                className="px-3 py-3 text-xs rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.025)', color: 'var(--color-muted)' }}
              >
                {isAuthenticated
                  ? 'Your latest prompts will appear here.'
                  : 'Sign in to keep conversation history.'}
              </div>
            )}
            {history.map((item) => (
              <div
                key={`${item.timestamp}-${item.prompt}`}
                className="px-3 py-3 rounded-2xl transition-colors hover:bg-white/[0.04]"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                <div className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {item.project_name || item.blueprint}
                </div>
                <div className="truncate text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                  {item.prompt}
                </div>
              </div>
            ))}
          </Section>
        </div>

        {/* Footer / Profile */}
        <div
          className="mt-auto p-3 shrink-0 relative"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {isProfileMenuOpen && (
            <div
              className="absolute bottom-[74px] left-3 w-[calc(100%-1.5rem)] rounded-xl overflow-hidden py-1 z-50 shadow-lg animate-scale-in"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <button
                onClick={toggleSettingsModal}
                className="w-full text-left px-4 py-3 text-sm flex items-center space-x-2 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,92,246,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Settings size={14} />
                <span>Settings</span>
              </button>

              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-sm flex items-center space-x-2 transition-colors"
                  style={{
                    color: 'var(--color-accent-rose)',
                    borderTop: '1px solid var(--color-border)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(251,113,133,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full text-left px-4 py-3 text-sm flex items-center space-x-2 transition-colors"
                  style={{
                    color: 'var(--color-accent-cyan)',
                    borderTop: '1px solid var(--color-border)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(34,211,238,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogIn size={14} />
                  <span>Log In / Sign Up</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full flex items-center justify-between px-2 py-2 rounded-xl transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                style={{
                  background: isAuthenticated ? 'rgba(139,92,246,0.16)' : 'var(--color-surface)',
                  border: `1px solid ${isAuthenticated ? 'rgba(139,92,246,0.4)' : 'var(--color-border)'}`,
                  color: isAuthenticated ? 'var(--color-accent-soft)' : 'var(--color-text)',
                }}
              >
                {isAuthenticated ? user?.username?.[0]?.toUpperCase() || 'U' : 'G'}
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                  {isAuthenticated ? user?.username || 'User' : 'Guest'}
                </span>
                <span className="text-[11px] truncate" style={{ color: 'var(--color-muted)' }}>
                  {isAuthenticated ? 'History enabled' : 'Sign in to sync'}
                </span>
              </div>
            </div>
            <Settings size={15} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
          </button>
        </div>
      </div>
    </>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2" style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
        {icon}
        <span>{label}</span>
      </div>
      <span style={{ color: 'var(--color-text)', fontSize: '0.75rem', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2
        className="text-[10px] font-bold px-3 mb-2 uppercase tracking-[0.1em]"
        style={{ color: 'var(--color-muted)' }}
      >
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
