import { create } from 'zustand';
import { fetchApi } from '../config/api';

// Persist theme preference
const savedTheme = localStorage.getItem('aizen_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

export const useUIStore = create((set, get) => ({
  // ─── Tool panels ───────────────────────────────────────────────────────────
  activeTools: {
    Code: false,
    Files: false,
    Preview: false,
    Search: false,
    Terminal: false,
    Analytics: false,
    SQL: false,
  },
  toggleTool: (toolName) =>
    set((state) => ({
      activeTools: {
        ...state.activeTools,
        [toolName]: !state.activeTools[toolName],
      },
    })),
  closeAllTools: () =>
    set({
      activeTools: {
        Code: false,
        Files: false,
        Preview: false,
        Search: false,
        Terminal: false,
        Analytics: false,
        SQL: false,
      },
    }),

  // ─── Active file ───────────────────────────────────────────────────────────
  activeFile: null,
  fileContent: '',
  loadedFilesCache: {},
  setLoadedFilesCache: (filesCache) => set({ loadedFilesCache: filesCache }),
  fileRefreshTrigger: 0,
  triggerFileRefresh: () =>
    set((state) => ({ fileRefreshTrigger: state.fileRefreshTrigger + 1 })),
  setActiveFile: (fileName, content) =>
    set((state) => ({
      activeFile: fileName,
      fileContent: content,
      activeTools: { ...state.activeTools, Code: true },
    })),
  clearActiveFile: () => set({ activeFile: null, fileContent: '' }),

  // ─── Modals ────────────────────────────────────────────────────────────────
  isLoginModalOpen: false,
  toggleLoginModal: () => set((state) => ({ isLoginModalOpen: !state.isLoginModalOpen })),
  isSettingsModalOpen: false,
  toggleSettingsModal: () => set((state) => ({ isSettingsModalOpen: !state.isSettingsModalOpen })),

  // ─── API key / GitHub token ────────────────────────────────────────────────
  apiKey: localStorage.getItem('aizen_api_key') || '',
  setApiKey: (key) => {
    localStorage.setItem('aizen_api_key', key);
    set({ apiKey: key });
  },
  githubToken: localStorage.getItem('aizen_github_token') || '',
  setGithubToken: (token) => {
    localStorage.setItem('aizen_github_token', token);
    set({ githubToken: token });
  },
  githubRepoName: localStorage.getItem('aizen_github_repo_name') || '',
  setGithubRepoName: (repoName) => {
    localStorage.setItem('aizen_github_repo_name', repoName);
    set({ githubRepoName: repoName });
  },
  githubRepoPrivate: localStorage.getItem('aizen_github_repo_private') === 'true',
  setGithubRepoPrivate: (isPrivate) => {
    localStorage.setItem('aizen_github_repo_private', String(isPrivate));
    set({ githubRepoPrivate: isPrivate });
  },
  githubRepoDescription: localStorage.getItem('aizen_github_repo_description') || '',
  setGithubRepoDescription: (description) => {
    localStorage.setItem('aizen_github_repo_description', description);
    set({ githubRepoDescription: description });
  },
  githubOpenAfterPublish: localStorage.getItem('aizen_github_open_after_publish') !== 'false',
  setGithubOpenAfterPublish: (enabled) => {
    localStorage.setItem('aizen_github_open_after_publish', String(enabled));
    set({ githubOpenAfterPublish: enabled });
  },

  // ─── Theme ─────────────────────────────────────────────────────────────────
  theme: savedTheme,
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('aizen_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },

  // ─── Backend connection ────────────────────────────────────────────────────
  isConnected: false,
  isKeyValid: false,
  githubConfigured: false,
  backendMessage: '',
  checkConnection: async () => {
    try {
      const res = await fetchApi('/api/validate-key');
      const data = await res.json();
      set({
        isConnected: true,
        isKeyValid: !!data.provider_ready,
        githubConfigured: !!data.github_configured,
        backendMessage: data.message || 'Backend connected',
      });
    } catch {
      set({
        isConnected: false,
        isKeyValid: false,
        githubConfigured: false,
        backendMessage: 'Backend disconnected',
      });
    }
  },
}));
