import React, { useState } from 'react';
import { Github, Key, X } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export default function SettingsModal() {
  const {
    apiKey,
    setApiKey,
    githubToken,
    githubConfigured,
    setGithubToken,
    githubRepoName,
    setGithubRepoName,
    githubRepoPrivate,
    setGithubRepoPrivate,
    githubRepoDescription,
    setGithubRepoDescription,
    githubOpenAfterPublish,
    setGithubOpenAfterPublish,
    toggleSettingsModal,
    checkConnection,
  } = useUIStore();
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputGithub, setInputGithub] = useState(githubToken);
  const [inputRepoName, setInputRepoName] = useState(githubRepoName);
  const [inputRepoPrivate, setInputRepoPrivate] = useState(githubRepoPrivate);
  const [inputRepoDescription, setInputRepoDescription] = useState(githubRepoDescription);
  const [inputOpenAfterPublish, setInputOpenAfterPublish] = useState(githubOpenAfterPublish);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(inputKey);
    setGithubToken(inputGithub);
    setGithubRepoName(inputRepoName.trim());
    setGithubRepoPrivate(inputRepoPrivate);
    setGithubRepoDescription(inputRepoDescription.trim());
    setGithubOpenAfterPublish(inputOpenAfterPublish);
    setSaved(true);
    checkConnection();
    setTimeout(() => setSaved(false), 2000);
  };

  const fieldStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

  return (
    <div className="glass-panel rounded-[28px] max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto animate-scale-in">
      <button onClick={toggleSettingsModal} className="absolute top-4 right-4 transition-colors p-1" style={{ color: 'var(--color-muted)' }}>
        <X size={18} />
      </button>

      <div className="flex items-center space-x-3 mb-6">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,0.16)', color: 'var(--color-accent-soft)' }}
        >
          <Key size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-text)' }}>Workspace Settings</h2>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Configure how Aizen talks to your model provider.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>Provider API Key</label>
          <input
            type="password"
            value={inputKey}
            onChange={(event) => setInputKey(event.target.value)}
            placeholder="sk-..."
            className="w-full rounded-2xl px-4 py-3 outline-none"
            style={fieldStyle}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }}>
              <Github size={13} /> GitHub Personal Access Token
            </label>
            {githubConfigured && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.14)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.3)' }}>
                Server Active
              </span>
            )}
          </div>
          <input
            type="password"
            value={inputGithub}
            onChange={(event) => setInputGithub(event.target.value)}
            placeholder={githubConfigured ? "Using token from server environment" : "ghp_..."}
            className="w-full rounded-2xl px-4 py-3 outline-none"
            style={fieldStyle}
          />
        </div>
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>Default Repository Name</label>
          <input
            type="text"
            value={inputRepoName}
            onChange={(event) => setInputRepoName(event.target.value)}
            placeholder="leave blank to use project name"
            className="w-full rounded-2xl px-4 py-3 outline-none"
            style={fieldStyle}
          />
        </div>
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--color-muted)' }}>Repository Description</label>
          <textarea
            value={inputRepoDescription}
            onChange={(event) => setInputRepoDescription(event.target.value)}
            placeholder="Short description for the published repo"
            className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
            rows={3}
            style={fieldStyle}
          />
        </div>
        <label
          className="flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer"
          style={fieldStyle}
        >
          <div>
            <div className="text-sm" style={{ color: 'var(--color-text)' }}>Create private repository</div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Turn this on if you want new GitHub repos to be private by default.
            </div>
          </div>
          <input
            type="checkbox"
            checked={inputRepoPrivate}
            onChange={(event) => setInputRepoPrivate(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
        </label>
        <label
          className="flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer"
          style={fieldStyle}
        >
          <div>
            <div className="text-sm" style={{ color: 'var(--color-text)' }}>Open GitHub after publish</div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Automatically open the new repository page after a successful push.
            </div>
          </div>
          <input
            type="checkbox"
            checked={inputOpenAfterPublish}
            onChange={(event) => setInputOpenAfterPublish(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
        </label>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Settings stay in local browser storage. Add a GitHub token with repository write access, choose your default repo settings, then use the one-click `Push to GitHub` button from the top bar to publish the whole generated project.
        </p>
      </div>

      <div className="mt-8 flex justify-between items-center">
        {saved ? <span className="text-sm" style={{ color: 'var(--color-accent-green)' }}>Saved successfully.</span> : <span></span>}
        <button onClick={handleSave} className="font-semibold py-2.5 px-5 rounded-2xl btn-glow">
          Save Changes
        </button>
      </div>
    </div>
  );
}
