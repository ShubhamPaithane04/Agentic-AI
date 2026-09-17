import React, { useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Loader2, Sparkles, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const MAX_TILT = 7; // degrees

export default function LoginScreen({ defaultIsLogin = true }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup } = useAuthStore();

  // ── 3D tilt + spotlight tracking ────────────────────────────────────────
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50 });

  const handlePointerMove = (event) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * MAX_TILT * 2,
      ry: (px - 0.5) * MAX_TILT * 2,
      mx: Math.min(100, Math.max(0, px * 100)),
      my: Math.min(100, Math.max(0, py * 100)),
    });
  };

  const handlePointerLeave = () => setTilt({ rx: 0, ry: 0, mx: 50, my: 50 });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = isLogin ? await login(username, password) : await signup(username, password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      navigate('/chat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="absolute inset-0 pointer-events-none grid-bg" />
      <div
        className="glow-orb w-[26rem] h-[26rem] -top-24 -left-24 animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.32), transparent 70%)' }}
      />
      <div
        className="glow-orb w-[24rem] h-[24rem] bottom-0 -right-16 animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.24), transparent 70%)', animationDelay: '2s' }}
      />
      <div
        className="glow-orb w-[18rem] h-[18rem] bottom-1/4 left-1/3 animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(251,113,133,0.16), transparent 70%)', animationDelay: '3.5s' }}
      />

      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-sm px-3 py-2 rounded-full transition-colors hover:bg-white/5"
        style={{ color: 'var(--color-muted)' }}
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      {/* ── Perspective stage + floating shards ─────────────────────────── */}
      <div className="tilt-stage w-full max-w-5xl relative z-10">
        <div className="hidden lg:block shard-3d w-20 h-20 -top-10 left-16" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(34,211,238,0.12))', animationDelay: '0s' }} />
        <div className="hidden lg:block shard-3d w-12 h-12 top-1/3 -right-7" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.35), rgba(139,92,246,0.1))', animationDelay: '1.6s' }} />
        <div className="hidden lg:block shard-3d w-9 h-9 -bottom-6 left-1/4" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.4), rgba(139,92,246,0.1))', animationDelay: '3.2s' }} />

        <div
          ref={cardRef}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          className="tilt-card aurora-frame"
          style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
        >
          <div className="rounded-[31px] overflow-hidden grid lg:grid-cols-[0.95fr_1.05fr] relative" style={{ background: 'var(--color-panel-soft)', backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)' }}>
            <div
              className="tilt-spotlight"
              style={{ background: `radial-gradient(560px circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.10), transparent 45%)` }}
            />

            {/* ── Left: brand / pitch panel ─────────────────────────────── */}
            <div className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r relative" style={{ borderColor: 'var(--color-border)' }}>
              <div className="cube3d-scene relative mb-2">
                <div className="cube3d">
                  <div className="cube3d-face front" />
                  <div className="cube3d-face back" />
                  <div className="cube3d-face right" />
                  <div className="cube3d-face left" />
                  <div className="cube3d-face top" />
                  <div className="cube3d-face bottom" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Sparkles size={18} className="text-white" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))' }} />
                </div>
              </div>

              <p className="uppercase tracking-[0.3em] text-xs mt-8 mb-4" style={{ color: 'var(--color-accent-soft)' }}>
                Aizen workspace
              </p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight font-display">
                {isLogin ? (
                  <>Return to your <span className="gradient-text">build desk</span>.</>
                ) : (
                  <>Create your <span className="gradient-text">build desk</span>.</>
                )}
              </h1>
              <p className="mt-5 leading-7 max-w-md" style={{ color: 'var(--color-muted)' }}>
                {isLogin
                  ? 'Sign in to access your recent prompts, generated files, and the latest workspace state.'
                  : 'Create an account to keep your build history and make the product feel persistent instead of disposable.'}
              </p>

              <div className="mt-8 space-y-3">
                {['Builds stay visible', 'Recent prompts are saved', 'Workspace output is one click away'].map((item) => (
                  <div key={item} className="feature-row-3d flex items-center gap-2.5 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--color-text)' }}>
                    <span
                      className="flex items-center justify-center shrink-0 rounded-full"
                      style={{ width: 22, height: 22, background: 'rgba(52,211,153,0.14)', boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset' }}
                    >
                      <CheckCircle2 size={13} style={{ color: 'var(--color-accent-green)' }} />
                    </span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: form panel ─────────────────────────────────────── */}
            <div className="p-8 md:p-10 relative">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-semibold mb-2 font-display">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                  {isLogin ? 'Pick up where your last prompt left off.' : 'A few fields, then your workspace is ready.'}
                </p>

                {error && (
                  <div
                    className="mb-4 p-3 rounded-2xl text-sm animate-shake"
                    style={{ background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.28)', color: '#fda4af' }}
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>Username</label>
                    <div className="relative">
                      <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted)' }} />
                      <input
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="choose-a-name"
                        className="input-3d w-full rounded-2xl pl-11 pr-4 py-3"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 6 characters"
                        className="input-3d w-full rounded-2xl pl-11 pr-11 py-3"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-white/5"
                        style={{ color: 'var(--color-muted)' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !username || !password}
                    className={`w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 ${
                      isLoading || !username || !password ? '' : 'btn-3d'
                    }`}
                    style={
                      isLoading || !username || !password
                        ? { background: 'var(--color-surface-2)', color: 'var(--color-muted)', cursor: 'not-allowed' }
                        : undefined
                    }
                  >
                    {isLoading && <Loader2 size={18} className="animate-spin" />}
                    <span>{isLogin ? 'Log in' : 'Create account'}</span>
                  </button>
                </form>

                <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                    }}
                    className="font-semibold"
                    style={{ color: 'var(--color-accent-soft)' }}
                  >
                    {isLogin ? 'Sign up' : 'Log in'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
