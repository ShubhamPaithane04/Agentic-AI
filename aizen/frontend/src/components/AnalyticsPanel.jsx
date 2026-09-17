import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart2, Loader2, TrendingUp, Layers, Zap, FileCode2 } from 'lucide-react';
import { fetchApi } from '../config/api';
import { useAuthStore } from '../store/authStore';

const LANG_COLORS = {
  JSX:  '#a78bfa',
  JS:   '#fcd34d',
  PY:   '#6ee7b7',
  HTML: '#fda4af',
  CSS:  '#67e8f9',
  TS:   '#38bdf8',
  TSX:  '#38bdf8',
  JSON: '#94a3b8',
  MD:   '#a3e635',
};
const FALLBACK_COLORS = ['#a78bfa', '#22d3ee', '#6ee7b7', '#fcd34d', '#fda4af', '#fb923c'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 12,
        color: 'var(--color-text)',
      }}
    >
      <div style={{ color: 'var(--color-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{payload[0].value} prompts</div>
    </div>
  );
};

export default function AnalyticsPanel() {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchApi('/api/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
        else setError(d.error || 'Failed to load analytics');
      })
      .catch(() => setError('Backend not reachable'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated) load();
    else setLoading(false);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <GuestPrompt />
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={22} className="animate-spin" style={{ color: 'var(--color-accent-soft)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{error}</p>
        <button
          onClick={load}
          style={{
            padding: '6px 16px',
            borderRadius: 10,
            background: 'rgba(139,92,246,0.14)',
            border: '1px solid rgba(139,92,246,0.35)',
            color: 'var(--color-accent-soft)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const totalPrompts = data?.total_prompts ?? 0;
  const dailyPrompts = data?.daily_prompts ?? [];
  const languages = data?.languages ?? [];
  const events = data?.events ?? {};

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Zap size={14} style={{ color: '#fcd34d' }} />} label="Total Prompts" value={totalPrompts} color="#fcd34d" />
        <StatCard icon={<FileCode2 size={14} style={{ color: '#6ee7b7' }} />} label="Files Edited" value={events.file_edited ?? 0} color="#6ee7b7" />
        <StatCard icon={<Layers size={14} style={{ color: '#a78bfa' }} />} label="Templates Used" value={events.template_used ?? 0} color="#a78bfa" />
        <StatCard icon={<TrendingUp size={14} style={{ color: '#22d3ee' }} />} label="Code Runs" value={events.code_executed ?? 0} color="#22d3ee" />
      </div>

      {/* Daily prompts bar chart */}
      <ChartCard title="Prompts — Last 7 Days">
        {dailyPrompts.every((d) => d.prompts === 0) ? (
          <EmptyChart message="No activity in the last 7 days yet." />
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={dailyPrompts} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
              <Bar dataKey="prompts" radius={[6, 6, 0, 0]} fill="#8b5cf6">
                {dailyPrompts.map((_, i) => (
                  <Cell key={i} fill={i === dailyPrompts.length - 1 ? '#22d3ee' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Language pie chart */}
      <ChartCard title="Workspace Languages">
        {languages.length === 0 ? (
          <EmptyChart message="Generate a project to see language breakdown." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={languages}
                cx="50%"
                cy="45%"
                innerRadius={44}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
              >
                {languages.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={LANG_COLORS[entry.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [`${v} files`, n]}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: 'var(--color-muted)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div
      className="rounded-2xl p-3 flex flex-col gap-2 card-hover"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-1.5" style={{ color: 'var(--color-muted)', fontSize: 11 }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--color-border)' }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div
      style={{
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-muted)',
        fontSize: 12,
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  );
}

function GuestPrompt() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
      <BarChart2 size={32} style={{ color: 'var(--color-muted)' }} />
      <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>
        Sign in to view your personal analytics dashboard.
      </p>
    </div>
  );
}
