import React, { useEffect, useState } from 'react';
import { BarChart2, CheckCircle2, Code, Database, Download, Eye, FileCode2, Github, Loader2, Menu, Moon, Rocket, Search, Sun, Terminal } from 'lucide-react';
import { fetchApi } from '../config/api';
import { useUIStore } from '../store/uiStore';
import TemplateGallery from './TemplateGallery';

export default function Topbar({ toggleSidebar }) {
  const {
    activeTools,
    toggleTool,
    loadedFilesCache,
    githubToken,
    githubConfigured,
    githubRepoName,
    githubRepoPrivate,
    githubRepoDescription,
    githubOpenAfterPublish,
    isConnected,
    isKeyValid,
    backendMessage,
    checkConnection,
    theme,
    toggleTheme,
    toggleSettingsModal,
  } = useUIStore();
  const [showTemplates, setShowTemplates] = useState(false);
  const [publishState, setPublishState] = useState({ status: 'idle', message: '', url: '' });

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  const downloadProject = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download project', err);
    }
  };

  const pushToGitHub = async () => {
    if (!githubToken && !githubConfigured) {
      setPublishState({
        status: 'error',
        message: 'Add your GitHub token in Settings first.',
        url: '',
      });
      toggleSettingsModal();
      return;
    }

    const repoName = githubRepoName?.trim() || getSuggestedRepoName(loadedFilesCache);
    setPublishState({ status: 'loading', message: 'Pushing project to GitHub...', url: '' });

    try {
      const res = await fetchApi('/api/github-push', {
        method: 'POST',
        body: JSON.stringify({
          githubToken,
          repoName,
          private: githubRepoPrivate,
          description: githubRepoDescription?.trim() || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'GitHub push failed');
      }

      setPublishState({
        status: 'success',
        message: data.message || `Published to ${data.repo}`,
        url: data.url || '',
      });

      if (githubOpenAfterPublish && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      setPublishState({
        status: 'error',
        message: error.message || 'GitHub push failed',
        url: '',
      });
    }
  };

  const isLight = theme === 'light';
  const hasProjectArtifact = getHasProjectArtifact(loadedFilesCache);

  return (
    <>
      {showTemplates && (
        <TemplateGallery
          onClose={() => setShowTemplates(false)}
          onTemplateCreated={() => window.location.reload()}
        />
      )}
      <div className="shrink-0 w-full px-3 md:px-4 pt-3">
        <div className="glass-panel rounded-[28px] overflow-hidden">
          <div className="min-h-[56px] flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 sm:px-5 py-2.5">
            {/* Left: mobile menu + status badges */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-muted)' }}
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center space-x-2">
                <Badge tone={isConnected && isKeyValid ? 'green' : isConnected ? 'amber' : 'rose'}>
                  {isConnected ? (isKeyValid ? 'Provider ready' : 'Template mode') : 'Offline'}
                </Badge>
                <Badge tone="ink">chat-first assistant</Badge>
              </div>
            </div>

            {/* Right: tools + actions */}
            <div className="flex items-center flex-wrap gap-2">
              {hasProjectArtifact && (
                <>
                  <span
                    className="shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.26em] mr-1"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    Artifacts
                  </span>

                  <ToolChip name="Code"     active={activeTools.Code}      onClick={() => toggleTool('Code')}      icon={<Code size={13} />} />
                  <ToolChip name="Files"    active={activeTools.Files}     onClick={() => toggleTool('Files')}     icon={<FileCode2 size={13} />} />
                  <ToolChip name="Preview"  active={activeTools.Preview}   onClick={() => toggleTool('Preview')}   icon={<Eye size={13} />} />
                  <ToolChip name="Search"   active={activeTools.Search}    onClick={() => toggleTool('Search')}    icon={<Search size={13} />} />
                  <ToolChip name="Terminal" active={activeTools.Terminal}  onClick={() => toggleTool('Terminal')}  icon={<Terminal size={13} />} />
                  <ToolChip name="Analytics" active={activeTools.Analytics} onClick={() => toggleTool('Analytics')} icon={<BarChart2 size={13} />} />

                  <div className="shrink-0" style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />

                  <button
                    onClick={() => setShowTemplates(true)}
                    className="shrink-0 whitespace-nowrap flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-[1.02]"
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: 'var(--color-accent-soft)',
                    }}
                  >
                    <Rocket size={13} />
                    <span>Templates</span>
                  </button>

                  <button
                    onClick={downloadProject}
                    className="shrink-0 whitespace-nowrap flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-[1.02]"
                    style={{
                      background: 'rgba(52, 211, 153, 0.1)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      color: 'var(--color-accent-green)',
                    }}
                  >
                    <Download size={13} />
                    <span>Export</span>
                  </button>

                  <button
                    onClick={pushToGitHub}
                    disabled={publishState.status === 'loading'}
                    className="shrink-0 whitespace-nowrap flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{
                      background: publishState.status === 'success'
                        ? 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.24))'
                        : publishState.status === 'loading'
                        ? 'rgba(255,255,255,0.04)'
                        : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.16))',
                      border: publishState.status === 'success'
                        ? '1px solid rgba(52,211,153,0.45)'
                        : '1px solid rgba(139,92,246,0.35)',
                      color: publishState.status === 'success' ? '#6ee7b7' : 'var(--color-text)',
                      boxShadow: publishState.status === 'success'
                        ? '0 4px 12px rgba(52,211,153,0.15)'
                        : '0 2px 8px rgba(139,92,246,0.12)',
                      opacity: publishState.status === 'loading' ? 0.7 : 1,
                    }}
                  >
                    {publishState.status === 'loading' ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : publishState.status === 'success' ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <Github size={13} />
                    )}
                    <span>{publishState.status === 'loading' ? 'Publishing...' : 'Push to GitHub'}</span>
                  </button>
                </>
              )}

              {/* SQL Assistant is a standalone tool — always reachable, not tied to a generated project */}
              <ToolChip name="SQL Assistant" active={activeTools.SQL} onClick={() => toggleTool('SQL')} icon={<Database size={13} />} />

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
                className="shrink-0 p-2 rounded-full transition-all hover:scale-110"
                style={{
                  background: isLight ? 'rgba(251,191,36,0.14)' : 'rgba(139,92,246,0.14)',
                  border: `1px solid ${isLight ? 'rgba(251,191,36,0.3)' : 'rgba(139,92,246,0.3)'}`,
                  color: isLight ? '#d97706' : 'var(--color-accent-soft)',
                }}
              >
                {isLight ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>

          <div
            className="px-4 py-2 text-xs flex items-center gap-4 overflow-x-auto"
            style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          >
            <span className="shrink-0">Aizen conversational coding assistant</span>
            <span className="hidden md:inline" style={{ color: 'var(--color-border)' }}>/</span>
            <span className="shrink-0">Status: {isConnected ? 'online' : 'offline'}</span>
            <span className="hidden md:inline" style={{ color: 'var(--color-border)' }}>/</span>
            <span className="truncate">
              {publishState.message || backendMessage || 'Chat naturally, and open artifacts only when you want code or preview.'}
              {publishState.url ? ` ${publishState.url}` : ''}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function ToolChip({ name, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-[1.02] whitespace-nowrap"
      style={{
        background: active ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? 'rgba(139,92,246,0.45)' : 'var(--color-border)'}`,
        color: active ? 'var(--color-accent-soft)' : 'var(--color-muted)',
      }}
    >
      {icon}
      <span>{name}</span>
    </button>
  );
}

function Badge({ children, tone }) {
  const tones = {
    green:  { background: 'rgba(52,211,153,0.14)', color: '#6ee7b7' },
    amber:  { background: 'rgba(251,191,36,0.14)', color: '#fcd34d' },
    rose:   { background: 'rgba(251,113,133,0.14)',  color: '#fda4af' },
    ink:    { background: 'rgba(255,255,255,0.04)', color: 'var(--color-text)' },
  };

  const palette = tones[tone] || tones.ink;

  return (
    <div className="px-3 py-1.5 rounded-full text-xs font-semibold" style={palette}>
      {children}
    </div>
  );
}

function getHasProjectArtifact(loadedFilesCache) {
  const fileNames = Object.keys(loadedFilesCache || {});
  if (fileNames.length === 0) return false;

  const manifestRaw = loadedFilesCache['manifest.json'];
  if (!manifestRaw) {
    return fileNames.length >= 3;
  }

  try {
    const manifest = JSON.parse(manifestRaw);
    const blueprint = manifest.blueprint || '';
    return blueprint !== 'chat';
  } catch {
    return fileNames.length >= 3;
  }
}

function getSuggestedRepoName(loadedFilesCache) {
  const manifestRaw = loadedFilesCache['manifest.json'];
  if (!manifestRaw) return 'aizen-project';

  try {
    const manifest = JSON.parse(manifestRaw);
    return (manifest.project_name || manifest.name || 'aizen-project').toLowerCase();
  } catch {
    return 'aizen-project';
  }
}
