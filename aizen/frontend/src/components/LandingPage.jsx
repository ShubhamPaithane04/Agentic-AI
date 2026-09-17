import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart2,
  Boxes,
  Github,
  MessagesSquare,
  Rocket,
  Sparkles,
  Terminal,
  Wand2,
} from 'lucide-react';

// A varied accent palette — cycled across icons/stats instead of defaulting
// everything to the same violet/cyan neon pairing.
const ACCENTS = [
  { fg: 'var(--color-accent-soft)', bg: 'rgba(139,92,246,0.14)' },  // violet
  { fg: 'var(--color-accent-cyan)', bg: 'rgba(34,211,238,0.14)' },  // cyan
  { fg: 'var(--color-accent-amber)', bg: 'rgba(251,191,36,0.14)' }, // amber
  { fg: 'var(--color-accent-green)', bg: 'rgba(52,211,153,0.14)' }, // emerald
];

const featureCards = [
  {
    icon: Wand2,
    title: 'Intent-first generation',
    body: 'Aizen reads your prompt, decides whether you want a chat reply or a new build, and picks the right project blueprint automatically.',
  },
  {
    icon: Boxes,
    title: 'Workspace visibility',
    body: 'Every generated file is browsable in the same session — inspect, edit, and re-run without leaving the conversation.',
  },
  {
    icon: Terminal,
    title: 'Run it right here',
    body: 'Execute Python and JavaScript, preview HTML/CSS/JS output live, and search across your generated files instantly.',
  },
  {
    icon: Github,
    title: 'Ship in one click',
    body: 'Export your workspace as a ZIP or push it straight to a new GitHub repository — no terminal required.',
  },
];

const steps = [
  { label: '01', title: 'Describe what you want', body: 'Type a plain-language request — an app, an API, a landing page, or just a question.' },
  { label: '02', title: 'Aizen scaffolds it', body: 'A blueprint is chosen, files are generated, and the result streams into the chat in real time.' },
  { label: '03', title: 'Inspect, run, ship', body: 'Browse the file tree, preview it live, run the code, then export or push to GitHub.' },
];

const stats = [
  { value: '3', label: 'project templates', color: '#a78bfa' },
  { value: '10s', label: 'sandboxed exec limit', color: '#22d3ee' },
  { value: '1', label: 'click GitHub deploy', color: '#fbbf24' },
  { value: '0', label: 'config required', color: '#fb7185' },
];

const MAX_TILT = 6; // degrees

/** Reusable mouse-tracked 3D tilt + spotlight wrapper. */
function TiltWrap({ children, className = '', maxTilt = MAX_TILT, spotlightSize = 500, style }) {
  const ref = useRef(null);
  const [t, setT] = useState({ rx: 0, ry: 0, mx: 50, my: 50 });

  const onMove = (event) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setT({
      rx: (0.5 - py) * maxTilt * 2,
      ry: (px - 0.5) * maxTilt * 2,
      mx: Math.min(100, Math.max(0, px * 100)),
      my: Math.min(100, Math.max(0, py * 100)),
    });
  };
  const onLeave = () => setT({ rx: 0, ry: 0, mx: 50, my: 50 });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className}`}
      style={{ transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`, ...style }}
    >
      <div
        className="tilt-spotlight"
        style={{ background: `radial-gradient(${spotlightSize}px circle at ${t.mx}% ${t.my}%, rgba(255,255,255,0.09), transparent 45%)` }}
      />
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>
      {/* Ambient background — violet, cyan, rose, amber layered instead of one neon pair */}
      <div className="absolute inset-0 pointer-events-none grid-bg" />
      <div
        className="glow-orb w-[32rem] h-[32rem] -top-40 -left-32 animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)' }}
      />
      <div
        className="glow-orb w-[28rem] h-[28rem] top-40 -right-20 animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.28), transparent 70%)', animationDelay: '1.5s' }}
      />
      <div
        className="glow-orb w-[24rem] h-[24rem] bottom-0 left-1/3 animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(251,113,133,0.16), transparent 70%)', animationDelay: '3s' }}
      />
      <div
        className="glow-orb w-[20rem] h-[20rem] bottom-10 right-1/4 animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.14), transparent 70%)', animationDelay: '4.5s' }}
      />

      {/* Nav */}
      <nav className="relative z-10 w-full flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center space-x-3">
          <div className="cube3d-scene relative" style={{ '--cube-size': '40px' }}>
            <div className="cube3d">
              <div className="cube3d-face front" />
              <div className="cube3d-face back" />
              <div className="cube3d-face right" />
              <div className="cube3d-face left" />
              <div className="cube3d-face top" />
              <div className="cube3d-face bottom" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Sparkles size={15} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }} />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold tracking-[0.14em] uppercase font-display">Aizen</div>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>AI coding workspace</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-full border text-sm font-medium transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Log in
          </Link>
          <Link
            to="/chat"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold btn-3d-sm"
          >
            Start building
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <main className="relative z-10 px-6 md:px-10 pt-6 pb-20">
        {/* Hero */}
        <section className="max-w-7xl mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center min-h-[calc(100vh-7rem)]">
          <div className="py-10 animate-stagger-in">
            <p className="uppercase tracking-[0.32em] text-xs mb-5 flex items-center gap-2" style={{ color: 'var(--color-accent-soft)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: 'var(--color-accent-cyan)' }} />
              Project generation, but sharper
            </p>
            <h1 className="text-5xl md:text-7xl font-bold leading-[0.98] tracking-tight max-w-4xl font-display">
              Type one command.
              <br />
              <span className="gradient-text">Get a workspace that feels alive.</span>
            </h1>
            <p className="text-lg md:text-xl leading-8 max-w-2xl mt-6" style={{ color: 'var(--color-muted)' }}>
              Aizen sits between idea and implementation. Ask for an app, an API, a landing page, or a starter
              tool, and it scaffolds the files, streams the result into chat, and keeps every step visible.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {['Build a SaaS dashboard with auth', 'Create a Flask API for invoices', 'Make a launch page for an AI startup'].map((prompt, index) => (
                <div
                  key={prompt}
                  className="px-4 py-3 rounded-2xl text-sm font-mono glass-panel card-hover"
                  style={{ color: 'var(--color-text)', borderLeft: `2px solid ${ACCENTS[index % ACCENTS.length].fg}` }}
                >
                  {prompt}
                </div>
              ))}
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-bold font-display" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live shell mockup — tilting 3D card with aurora frame + floating shards */}
          <div className="tilt-stage relative">
            <div className="hidden lg:block shard-3d w-16 h-16 -top-8 -left-8" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(34,211,238,0.12))' }} />
            <div className="hidden lg:block shard-3d w-10 h-10 -bottom-6 right-10" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.4), rgba(251,113,133,0.1))', animationDelay: '2s' }} />

            <TiltWrap className="aurora-frame animate-float" maxTilt={5}>
              <div
                className="rounded-[31px] overflow-hidden border relative"
                style={{ borderColor: 'var(--color-border-soft)', background: 'linear-gradient(180deg, rgba(139,92,246,0.06), rgba(34,211,238,0.02)), var(--color-panel-soft)' }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em]" style={{ color: 'var(--color-accent-soft)' }}>Live shell</div>
                    <div className="text-lg font-semibold font-display">Aizen Workspace</div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5" style={{ background: 'rgba(52,211,153,0.14)', color: '#6ee7b7' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
                    Ready
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-xs mb-1 flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }}>
                      <MessagesSquare size={12} /> Prompt
                    </div>
                    <div className="font-medium text-sm">Build a full-stack SaaS dashboard with auth and billing.</div>
                  </div>

                  <div className="grid gap-3">
                    <Metric label="Blueprint" value="fullstack" accent="#a78bfa" />
                    <Metric label="Files" value="12 created" accent="#22d3ee" />
                    <Metric label="Output" value="Workspace populated" accent="#34d399" />
                  </div>

                  <div className="rounded-2xl p-4 font-mono text-sm space-y-1" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: '#6ee7b7' }}>backend/app.py</div>
                    <div style={{ color: 'var(--color-muted)' }}>frontend/src/App.jsx</div>
                    <div style={{ color: 'var(--color-accent-cyan)' }}>manifest.json</div>
                    <div style={{ color: '#fbbf24' }}>README.md</div>
                  </div>
                </div>
              </div>
            </TiltWrap>
          </div>
        </section>

        {/* Feature cards — each gets its own accent + a light 3D tilt */}
        <section className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {featureCards.map((card, index) => {
            const Icon = card.icon;
            const accent = ACCENTS[index % ACCENTS.length];
            return (
              <TiltWrap
                key={card.title}
                maxTilt={4}
                spotlightSize={320}
                className="glass-panel rounded-[28px] card-hover animate-stagger-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="p-6">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: accent.bg, color: accent.fg, boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset' }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 font-display">{card.title}</h3>
                  <p className="leading-6 text-sm" style={{ color: 'var(--color-muted)' }}>{card.body}</p>
                </div>
              </TiltWrap>
            );
          })}
        </section>

        {/* How it works */}
        <section className="max-w-7xl mx-auto mt-20">
          <div className="flex items-center gap-2 mb-8">
            <Rocket size={16} style={{ color: 'var(--color-accent-cyan)' }} />
            <span className="text-xs uppercase tracking-[0.28em]" style={{ color: 'var(--color-muted)' }}>How it works</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={step.label} className="relative pl-2">
                <div className="text-4xl font-bold font-display mb-3" style={{ color: ACCENTS[index % ACCENTS.length].fg, opacity: 0.55 }}>{step.label}</div>
                <h3 className="text-xl font-semibold mb-2 font-display">{step.title}</h3>
                <p className="leading-7 text-sm" style={{ color: 'var(--color-muted)' }}>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA footer — warm amber/rose accent instead of another violet card */}
        <section className="max-w-5xl mx-auto mt-20">
          <div className="aurora-frame-warm aurora-frame">
            <div className="rounded-[31px] p-10 md:p-14 text-center relative overflow-hidden" style={{ background: 'var(--color-panel-soft)', backdropFilter: 'blur(20px) saturate(140%)' }}>
              <div
                className="glow-orb w-64 h-64 -top-20 left-1/2 -translate-x-1/2"
                style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.32), transparent 70%)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-1.5 mb-4" style={{ color: '#fbbf24' }}>
                  <BarChart2 size={14} />
                  <span className="text-xs uppercase tracking-[0.28em]">Free to run locally</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
                  Your next prompt could be a working project.
                </h2>
                <p className="max-w-xl mx-auto mb-8" style={{ color: 'var(--color-muted)' }}>
                  No sign-up required to try it. Start a chat, describe what you want, and watch the workspace fill in.
                </p>
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold btn-3d"
                >
                  Start building for free
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderLeft: accent ? `2px solid ${accent}` : undefined }}>
      <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
