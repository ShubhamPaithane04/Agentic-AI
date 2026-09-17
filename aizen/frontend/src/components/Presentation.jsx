import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Play, RefreshCw, Layers, ShieldCheck, 
  Terminal, BarChart3, ChevronRight, Sparkles, Home, Cpu, GitPullRequest
} from 'lucide-react';

export default function Presentation() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState('next'); // 'next' or 'prev'
  const [animating, setAnimating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [typedCode, setTypedCode] = useState('');
  const touchStartX = useRef(0);

  const totalSlides = 10;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  // Touch controls
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  // Wheel controls (debounced)
  const lastWheelTime = useRef(0);
  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 800) return;
    if (Math.abs(e.deltaY) > 20) {
      lastWheelTime.current = now;
      if (e.deltaY > 0) nextSlide();
      else prevSlide();
    }
  };

  const nextSlide = () => {
    if (animating) return;
    setDirection('next');
    setAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setTimeout(() => setAnimating(false), 600);
  };

  const prevSlide = () => {
    if (animating) return;
    setDirection('prev');
    setAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setTimeout(() => setAnimating(false), 600);
  };

  const goToSlide = (idx) => {
    if (animating || idx === currentSlide) return;
    setDirection(idx > currentSlide ? 'next' : 'prev');
    setAnimating(true);
    setCurrentSlide(idx);
    setTimeout(() => setAnimating(false), 600);
  };

  // Dynamic typing animation for Slide 3
  useEffect(() => {
    if (currentSlide !== 2) {
      setTypedCode('');
      return;
    }
    const fullText = `"Build a full-stack SaaS dashboard with JWT auth, user analytics, and a REST API in Flask + React"`;
    let curIndex = 0;
    const interval = setInterval(() => {
      setTypedCode((prev) => prev + fullText[curIndex]);
      curIndex++;
      if (curIndex >= fullText.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [currentSlide]);

  // Self-running timer for active agent step (Slide 6)
  useEffect(() => {
    if (currentSlide !== 5) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  // CSS classes for slide transition animation
  const getSlideClass = (idx) => {
    if (idx === currentSlide) return 'opacity-100 translate-x-0 scale-100 pointer-events-auto z-10';
    if (direction === 'next') {
      return idx === (currentSlide - 1 + totalSlides) % totalSlides
        ? 'opacity-0 -translate-x-[50px] scale-95 pointer-events-none z-0'
        : 'opacity-0 translate-x-[50px] scale-95 pointer-events-none z-0';
    } else {
      return idx === (currentSlide + 1) % totalSlides
        ? 'opacity-0 translate-x-[50px] scale-95 pointer-events-none z-0'
        : 'opacity-0 -translate-x-[50px] scale-95 pointer-events-none z-0';
    }
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col font-sans select-none"
      style={{ 
        background: 'radial-gradient(ellipse 80% 80% at 50% -20%, #15152a, #0b0b14)',
        color: '#f0f0f8'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      {/* Top Bar / Header */}
      <header className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-8 z-50">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20">
            AI
          </div>
          <span className="text-lg font-bold tracking-[0.16em] uppercase bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Aizen
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/chat')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all active:scale-95"
          >
            <Home size={13} />
            <span>Launch Workspace</span>
          </button>
        </div>
      </header>

      {/* Slides Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center px-6 relative h-full">
        
        {/* ── Slide 1: Hero ── */}
        <div className={`absolute inset-0 flex flex-col justify-center items-center text-center transition-all duration-500 ease-out ${getSlideClass(0)}`}>
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-black text-3xl text-white shadow-2xl shadow-blue-500/30 mb-8 border border-white/20 relative group">
            AI
            <span className="absolute inset-0 rounded-3xl bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <h1 className="text-6xl font-black tracking-tight leading-none bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-4">
            Aizen
          </h1>
          <p className="text-xl max-w-2xl text-gray-400 font-light leading-relaxed mb-8">
            An agentic AI coding workspace that transforms prompts into complete, runnable projects with interactive previews, file modification, and direct deployment.
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-blue-500/25 bg-blue-500/10 text-blue-300">🐍 Flask Backend</span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-violet-500/25 bg-violet-500/10 text-violet-300">⚛️ React + Vite</span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">🤖 Groq Llama 3.3</span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-amber-500/25 bg-amber-500/10 text-amber-300">🔐 JWT Security</span>
          </div>
        </div>

        {/* ── Slide 2: Problem ── */}
        <div className={`absolute inset-x-6 flex flex-col justify-center transition-all duration-500 ease-out ${getSlideClass(1)}`}>
          <div className="text-center mb-10">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-red-500/15 border border-red-500/30 text-red-400">The Problem</span>
            <h2 className="text-4xl font-extrabold mt-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Friction in the Coding Cycle</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all hover:-translate-y-1">
              <span className="text-3xl block mb-4">⏱️</span>
              <h3 className="text-lg font-bold mb-2">Tedious Boilerplate Setup</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Starting a project requires writing folders, configurations, scripts, and initial components manually before coding your logic.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all hover:-translate-y-1">
              <span className="text-3xl block mb-4">🔁</span>
              <h3 className="text-lg font-bold mb-2">Extreme Context Switching</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Jumping constantly between documentation websites, code editors, stack overflows, and terminal sessions ruins focus.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all hover:-translate-y-1">
              <span className="text-3xl block mb-4">🧩</span>
              <h3 className="text-lg font-bold mb-2">Scattered Code Ecosystem</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Generating, running, editing, testing, and deploying are handled by separate products, making collaboration slow.</p>
            </div>
          </div>
        </div>

        {/* ── Slide 3: Solution ── */}
        <div className={`absolute inset-x-6 flex flex-col justify-center transition-all duration-500 ease-out ${getSlideClass(2)}`}>
          <div className="text-center mb-8">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-blue-500/15 border border-blue-500/30 text-blue-400">The Solution</span>
            <h2 className="text-4xl font-extrabold mt-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Conversational Coding Workspace</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">User input prompt</span>
                <div className="font-mono text-sm text-blue-300 min-h-[48px]">
                  {typedCode}<span className="animate-pulse">|</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 pl-4">
                <div className="w-1.5 h-12 bg-gradient-to-b from-blue-500 to-violet-500 rounded-full" />
                <p className="text-sm text-gray-400 leading-relaxed">
                  Aizen interprets the request, chooses the correct blueprint, compiles initial files, and boots up a live interactive editor workspace.
                </p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Generated Assets</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                  <span className="text-xs font-mono text-blue-200">🐍 backend/app.py</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">14 endpoints</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                  <span className="text-xs font-mono text-violet-200">⚛️ frontend/src/App.jsx</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold">Auth routing</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <span className="text-xs font-mono text-emerald-200">📄 package.json & README</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Setup scripts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Slide 4: Technical Stack ── */}
        <div className={`absolute inset-x-6 flex flex-col justify-center transition-all duration-500 ease-out ${getSlideClass(3)}`}>
          <div className="text-center mb-8">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-violet-500/15 border border-violet-500/30 text-violet-400">Architecture</span>
            <h2 className="text-4xl font-extrabold mt-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Integrated Architecture</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <span className="text-sm font-bold text-pink-400 flex items-center gap-2"><Layers size={16} /> UI Layer</span>
              <div className="flex gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20">React 18</span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20">Vite</span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20">Tailwind CSS</span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20">Zustand</span>
              </div>
            </div>
            <div className="h-6 flex items-center justify-center">
              <div className="w-0.5 h-full bg-gradient-to-b from-pink-500 to-blue-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <span className="text-sm font-bold text-blue-400 flex items-center gap-2"><Terminal size={16} /> API Server</span>
              <div className="flex gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">Flask</span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">Python 3.10</span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">SQLite 3</span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">Server-Sent Events</span>
              </div>
            </div>
            <div className="h-6 flex items-center justify-center">
              <div className="w-0.5 h-full bg-gradient-to-b from-blue-500 to-emerald-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-2"><Cpu size={16} /> AI Inference Engine</span>
              <div className="flex gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Groq API Key</span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Llama 3.3 70B</span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Conversation Memory</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Slide 5: Features ── */}
        <div className={`absolute inset-x-6 flex flex-col justify-center transition-all duration-500 ease-out ${getSlideClass(4)}`}>
          <div className="text-center mb-8">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">Features</span>
            <h2 className="text-4xl font-extrabold mt-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Feature Ecosystem</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-blue-500/20 transition-all text-center">
              <span className="text-2xl block mb-2">💬</span>
              <h4 className="text-xs font-bold mb-1.5">Conversational Threading</h4>
              <p className="text-[10px] text-gray-500 leading-normal">Full session memory keeps track of your design details.</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-violet-500/20 transition-all text-center">
              <span className="text-2xl block mb-2">🛠️</span>
              <h4 className="text-xs font-bold mb-1.5">Blueprint Scaffolder</h4>
              <p className="text-[10px] text-gray-500 leading-normal">Generates structured starter apps ready to deploy.</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-pink-500/20 transition-all text-center">
              <span className="text-2xl block mb-2">👁️</span>
              <h4 className="text-xs font-bold mb-1.5">Interactive Preview</h4>
              <p className="text-[10px] text-gray-500 leading-normal">HTML preview renders live alongside the Monaco editor.</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all text-center">
              <span className="text-2xl block mb-2">🚀</span>
              <h4 className="text-xs font-bold mb-1.5">1-Click GitHub Deploy</h4>
              <p className="text-[10px] text-gray-500 leading-normal">Create repository and push code without git config CLI commands.</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-blue-500/20 transition-all text-center">
              <span className="text-2xl block mb-2">📦</span>
              <h4 className="text-xs font-bold mb-1.5">Workspace Export</h4>
              <p className="text-[10px] text-gray-500 leading-normal">Download the generated files as a clean, complete ZIP bundle.</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-violet-500/20 transition-all text-center">
              <span className="text-2xl block mb-2">🔐</span>
              <h4 className="text-xs font-bold mb-1.5">JWT Auth & DB</h4>
              <p className="text-[10px] text-gray-500 leading-normal">User login sessions and persistent history stored securely.</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-pink-500/20 transition-all text-center">
              <span className="text-2xl block mb-2">📊</span>
              <h4 className="text-xs font-bold mb-1.5">Analytics & Stats</h4>
              <p className="text-[10px] text-gray-500 leading-normal">Monitor your prompt usage and workspace languages.</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all text-center">
              <span className="text-2xl block mb-2">🌓</span>
              <h4 className="text-xs font-bold mb-1.5">Full Theme Adaptivity</h4>
              <p className="text-[10px] text-gray-500 leading-normal">Light and dark modes with color-coordinated code syntax.</p>
            </div>
          </div>
        </div>

        {/* ── Slide 6: Agent Loop Deep Dive ── */}
        <div className={`absolute inset-x-6 flex flex-col justify-center transition-all duration-500 ease-out ${getSlideClass(5)}`}>
          <div className="text-center mb-8">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-blue-500/15 border border-blue-500/30 text-blue-400">AI Thinking Loop</span>
            <h2 className="text-4xl font-extrabold mt-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Self-Correcting Agentic Process</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <div className="md:col-span-2 space-y-3">
              {[
                { title: '1. Strict Intent Classifier', desc: 'Analyzes user prompts carefully. Avoids launching unwanted projects during general chit-chat.', color: '#3b82f6' },
                { title: '2. Template / Blueprint Mapping', desc: 'Identifies context to select the most appropriate base layout template to prevent blank scaffolds.', color: '#8b5cf6' },
                { title: '3. Iterative Tool Loop', desc: 'Agent runtime executes file-writing, file-list scanning, and file-preview modifications iteratively.', color: '#10b981' },
                { title: '4. Active Memory Injection', desc: 'Contextually formats and embeds up to 40 previous discussion turns to retain instructions.', color: '#f59e0b' }
              ].map((step, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 ${
                    activeStep === idx 
                      ? 'bg-white/[0.04] border-white/20 translate-x-2' 
                      : 'bg-transparent border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-2 h-2 rounded-full animate-ping"
                      style={{ backgroundColor: activeStep === idx ? step.color : '#4b5563' }}
                    />
                    <h4 className="text-sm font-bold" style={{ color: activeStep === idx ? '#fff' : '#9ca3af' }}>{step.title}</h4>
                  </div>
                  {activeStep === idx && (
                    <p className="text-xs text-gray-400 mt-1.5 pl-5 leading-relaxed animate-fade-in">
                      {step.desc}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col justify-center items-center text-center">
              <span className="text-4xl animate-bounce mb-3">🔄</span>
              <span className="text-xl font-bold tracking-tight text-white mb-1">Feedback Loop</span>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[180px]">
                The agent scans compilation outputs and re-edits code files immediately if it discovers missing dependencies.
              </p>
            </div>
          </div>
        </div>

        {/* ── Slide 7: Security ── */}
        <div className={`absolute inset-x-6 flex flex-col justify-center transition-all duration-500 ease-out ${getSlideClass(6)}`}>
          <div className="text-center mb-8">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-amber-500/15 border border-amber-500/30 text-amber-400">Security</span>
            <h2 className="text-4xl font-extrabold mt-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Hardened Code Security</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start space-x-3">
              <ShieldCheck className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Sandboxed Executions</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Code execution processes run inside secondary sandboxed runtimes with restricted networking environments.</p>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start space-x-3">
              <ShieldCheck className="text-violet-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Hard 10s Execution Limits</h4>
                <p className="text-xs text-gray-400 leading-relaxed">All dynamically compiled and run code components are forcefully terminated after 10 seconds to stop runaway loops.</p>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start space-x-3">
              <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Strict Path Boundary Traversal Guards</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Every workspace file access path is validated against absolute targets to prevent sandbox escape hacks.</p>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start space-x-3">
              <ShieldCheck className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Secure Password Enforcing</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Accounts run under Werkzeug-hashed security setups, strictly preventing direct credential database leaks.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Slide 8: Scale & Stats ── */}
        <div className={`absolute inset-x-6 flex flex-col justify-center transition-all duration-500 ease-out ${getSlideClass(7)}`}>
          <div className="text-center mb-8">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-pink-500/15 border border-pink-500/30 text-pink-400">Metrics</span>
            <h2 className="text-4xl font-extrabold mt-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Project Scale</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
              <span className="text-4xl font-black text-blue-400">50+</span>
              <span className="text-xs text-gray-400 block mt-1 font-medium">Workspace Files</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
              <span className="text-4xl font-black text-violet-400">8K+</span>
              <span className="text-xs text-gray-400 block mt-1 font-medium">Lines of Code</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
              <span className="text-4xl font-black text-emerald-400">15+</span>
              <span className="text-xs text-gray-400 block mt-1 font-medium">React Views</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
              <span className="text-4xl font-black text-amber-400">18+</span>
              <span className="text-xs text-gray-400 block mt-1 font-medium">API Routes</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Workspace Languages Breakdown</span>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>React Frontend & Components</span>
                  <span className="font-mono font-bold">42%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Python Flask Backend Server</span>
                  <span className="font-mono font-bold">38%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '38%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Modular CSS & Layout overrides</span>
                  <span className="font-mono font-bold">12%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Slide 9: Roadmap ── */}
        <div className={`absolute inset-x-6 flex flex-col justify-center transition-all duration-500 ease-out ${getSlideClass(8)}`}>
          <div className="text-center mb-8">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-violet-500/15 border border-violet-500/30 text-violet-400">Roadmap</span>
            <h2 className="text-4xl font-extrabold mt-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Future Milestones</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-blue-400 block uppercase tracking-wider">Phase 1 — Core UX upgrades</span>
              <div className="space-y-2">
                <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                  <strong className="text-white block mb-0.5">⚡ Word-by-Word Streaming</strong>
                  Pipe Groq LLM streaming directly into front end text buffers.
                </div>
                <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                  <strong className="text-white block mb-0.5">🎤 Live Speech Input</strong>
                  Add speech recognition directly within the chat bar component.
                </div>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-violet-400 block uppercase tracking-wider">Phase 2 — Multi-Project Scope</span>
              <div className="space-y-2">
                <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                  <strong className="text-white block mb-0.5">🗂️ Project Workspace Manager</strong>
                  Switch, archive, and retrieve workspace sessions dynamically.
                </div>
                <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                  <strong className="text-white block mb-0.5">🔗 Public Project Shares</strong>
                  Create link tokens so other users can clone files.
                </div>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">Phase 3 — Interactive Preview</span>
              <div className="space-y-2">
                <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                  <strong className="text-white block mb-0.5">🖥️ Resizable Split Views</strong>
                  Show dynamic updates alongside code outputs side by side.
                </div>
                <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                  <strong className="text-white block mb-0.5">🤖 Model Model Picking</strong>
                  Toggle between different sizes of models inside system settings.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Slide 10: Conclusion / CTA ── */}
        <div className={`absolute inset-0 flex flex-col justify-center items-center text-center transition-all duration-500 ease-out ${getSlideClass(9)}`}>
          <div className="max-w-2xl bg-gradient-to-br from-blue-500/5 to-violet-500/5 border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[20vw] h-[20vw] rounded-full bg-blue-500/5 blur-[50px] pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-bold text-xl text-white shadow-xl shadow-blue-500/20 mb-6 mx-auto">
              AI
            </div>
            <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Aizen Workspace Project</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              A comprehensive development framework delivering clean file layouts, isolated safety validations, and one-click cloud deploys based on LLM orchestration logic.
            </p>
            <button 
              onClick={() => navigate('/chat')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center space-x-2 mx-auto"
            >
              <span>Explore Workspace</span>
              <ChevronRight size={16} />
            </button>
            <div className="h-[1px] bg-white/10 my-6" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-semibold">
              Thank you · Major Project presentation
            </span>
          </div>
        </div>

      </div>

      {/* Navigation Controls */}
      <footer className="absolute bottom-6 inset-x-0 h-16 flex items-center justify-center z-50">
        <div className="flex items-center space-x-6 px-6 py-3 bg-black/40 border border-white/5 rounded-full backdrop-blur-md shadow-xl">
          <button 
            onClick={prevSlide}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="flex space-x-1.5">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'bg-blue-500 scale-150' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <span className="font-mono text-xs text-gray-500 w-12 text-center">
            {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </span>

          <button 
            onClick={nextSlide}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}
