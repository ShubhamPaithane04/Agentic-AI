import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart2,
  Check,
  Code,
  Database,
  Eye,
  FileCode2,
  Github,
  Loader2,
  Monitor,
  Play,
  Save,
  Search,
  Sparkles,
  Smartphone,
  Tablet,
  Terminal,
  Wand2,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { fetchApi } from '../config/api';
import { useUIStore } from '../store/uiStore';
import { buildPreviewDocument, pickIcon, PREVIEW_WIDTHS } from '../utils/artifacts';
import AnalyticsPanel from './AnalyticsPanel';
import CodeBlock from './CodeBlock';

// Map file extension → Monaco language ID
const EXT_TO_MONACO = {
  jsx: 'javascript',
  js:  'javascript',
  ts:  'typescript',
  tsx: 'typescript',
  css: 'css',
  json: 'json',
  md:  'markdown',
  py:  'python',
  html: 'html',
  sh:  'shell',
  txt: 'plaintext',
};

export default function ToolPanels() {
  const {
    activeFile,
    fileContent,
    setActiveFile,
    fileRefreshTrigger,
    loadedFilesCache,
    activeTools,
    githubToken,
    githubConfigured,
    theme,
  } = useUIStore();

  const [files, setFiles] = useState([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState({});
  const [previewSize, setPreviewSize] = useState('desktop');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(null);

  // Monaco editor state
  const editorRef = useRef(null);
  const [editorValue, setEditorValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error' | null

  // Terminal (code runner) state
  const [termLang, setTermLang] = useState('python');
  const [termCode, setTermCode] = useState('print("Hello from Aizen")');
  const [termOutput, setTermOutput] = useState('');
  const [termRunning, setTermRunning] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // SQL Assistant (English -> SQL) state
  const [sqlQuestion, setSqlQuestion] = useState('');
  const [sqlSchema, setSqlSchema] = useState('');
  const [sqlDialect, setSqlDialect] = useState('SQLite');
  const [sqlResult, setSqlResult] = useState(null); // { sql, explanation, warnings }
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState('');

  // Sync editor value when active file changes
  useEffect(() => {
    setEditorValue(fileContent || '');
    setSaveStatus(null);
  }, [fileContent, activeFile]);

  useEffect(() => {
    if (Object.keys(loadedFilesCache).length > 0) {
      const derivedFiles = Object.keys(loadedFilesCache).map((name) => ({
        name,
        icon: pickIcon(name),
      }));
      setFiles(derivedFiles);
      setPreviewFiles((existing) => ({ ...existing, ...loadedFilesCache }));
      if (fileRefreshTrigger > 0 && derivedFiles[0]) {
        handleFileClick(derivedFiles[0]);
      }
      return;
    }

    setIsFilesLoading(true);
    fetchApi('/api/files')
      .then((res) => res.json())
      .then((data) => {
        const nextFiles = (data.files || []).map((name) => ({ name, icon: pickIcon(name) }));
        setFiles(nextFiles);
      })
      .catch(() => setFiles([]))
      .finally(() => setIsFilesLoading(false));
  }, [fileRefreshTrigger, loadedFilesCache]);

  useEffect(() => {
    const previewable = files
      .map((file) => file.name)
      .filter((name) => /\.(html|css|js)$/i.test(name))
      .filter((name) => !previewFiles[name]);

    if (previewable.length === 0) return;
    let cancelled = false;

    Promise.all(
      previewable.map(async (name) => {
        try {
          const res = await fetchApi(`/api/file_content?filename=${encodeURIComponent(name)}`);
          const data = await res.json();
          if (data.success) return [name, data.content];
        } catch {}
        return [name, null];
      })
    ).then((entries) => {
      if (cancelled) return;
      const next = {};
      for (const [name, content] of entries) {
        if (content != null) next[name] = content;
      }
      if (Object.keys(next).length > 0) {
        setPreviewFiles((existing) => ({ ...existing, ...next }));
      }
    });

    return () => { cancelled = true; };
  }, [files, previewFiles]);

  const handleFileClick = async (file) => {
    const fileName = typeof file === 'string' ? file : file.name;
    if (loadedFilesCache[fileName]) {
      setActiveFile(fileName, loadedFilesCache[fileName]);
      return;
    }
    try {
      const res = await fetchApi(`/api/file_content?filename=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (data.success) {
        setActiveFile(fileName, data.content);
        if (/\.(html|css|js)$/i.test(fileName)) {
          setPreviewFiles((existing) => ({ ...existing, [fileName]: data.content }));
        }
        return;
      }
    } catch {}
    setActiveFile(fileName, `// Unable to load ${fileName}`);
  };

  // Save edited file back to the server
  const handleSave = useCallback(async () => {
    if (!activeFile) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetchApi('/api/file_content', {
        method: 'POST',
        body: JSON.stringify({ filename: activeFile, content: editorValue }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('saved');
        // Update preview cache if it's a previewable file
        if (/\.(html|css|js)$/i.test(activeFile)) {
          setPreviewFiles((existing) => ({ ...existing, [activeFile]: editorValue }));
        }
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 2500);
    }
  }, [activeFile, editorValue]);

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  const handleDeployGitHub = async () => {
    if (!githubToken && !githubConfigured) {
      alert('Please set your GitHub Personal Access Token in the settings first.');
      return;
    }
    const repoName = prompt('Enter a name for the new GitHub repository:', 'aizen-project');
    if (!repoName) return;

    setIsDeploying(true);
    setDeploySuccess(null);
    try {
      const res = await fetchApi('/api/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubToken, repoName }),
      });
      const data = await res.json();
      if (data.success) setDeploySuccess(data.url);
      else alert('Deploy failed: ' + data.error);
    } catch (e) {
      alert('Deploy error: ' + e.message);
    } finally {
      setIsDeploying(false);
    }
  };

  // ── Terminal (code runner) ──────────────────────────────────────────────
  const loadActiveFileIntoTerminal = () => {
    if (!activeFile) return;
    if (activeFile.endsWith('.py')) {
      setTermLang('python');
      setTermCode(fileContent || '');
    } else if (activeFile.endsWith('.js')) {
      setTermLang('javascript');
      setTermCode(fileContent || '');
    }
  };

  const runTerminal = async () => {
    setTermRunning(true);
    setTermOutput('Running…\n');
    try {
      const res = await fetchApi('/api/execute', {
        method: 'POST',
        body: JSON.stringify({ code: termCode, language: termLang }),
      });
      const data = await res.json();
      if (data.success) {
        let result = '';
        if (data.stdout) result += data.stdout;
        if (data.stderr) result += `\n${data.stderr}`;
        if (data.exit_code !== 0) result += `\n[Process exited with code ${data.exit_code}]`;
        setTermOutput(result || '[No output]');
      } else {
        setTermOutput(`Error: ${data.error}`);
      }
    } catch (err) {
      setTermOutput(`Failed to execute: ${err.message}`);
    } finally {
      setTermRunning(false);
    }
  };

  // ── SQL Assistant (English -> SQL) ──────────────────────────────────────
  const generateSql = async () => {
    if (!sqlQuestion.trim() || sqlLoading) return;
    setSqlLoading(true);
    setSqlError('');
    setSqlResult(null);
    try {
      const res = await fetchApi('/api/nl2sql', {
        method: 'POST',
        body: JSON.stringify({
          question: sqlQuestion.trim(),
          schema: sqlSchema.trim(),
          dialect: sqlDialect,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSqlResult({ sql: data.sql, explanation: data.explanation, warnings: data.warnings });
      } else {
        setSqlError(data.error || 'SQL generation failed.');
      }
    } catch (err) {
      setSqlError(err.message || 'SQL generation failed.');
    } finally {
      setSqlLoading(false);
    }
  };

  // ── Search across generated files ───────────────────────────────────────
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return files
      .map((file) => {
        const nameMatch = file.name.toLowerCase().includes(q);
        const content = loadedFilesCache[file.name];
        let contentMatches = 0;
        if (typeof content === 'string' && content) {
          const lower = content.toLowerCase();
          let idx = lower.indexOf(q);
          while (idx !== -1) {
            contentMatches += 1;
            idx = lower.indexOf(q, idx + q.length);
          }
        }
        return { ...file, nameMatch, contentMatches };
      })
      .filter((f) => f.nameMatch || f.contentMatches > 0)
      .sort((a, b) => b.contentMatches - a.contentMatches);
  }, [searchQuery, files, loadedFilesCache]);

  const activeExt = activeFile?.split('.').pop()?.toLowerCase();
  const monacoLang = EXT_TO_MONACO[activeExt] || 'plaintext';
  const monacoTheme = theme === 'light' ? 'vs' : 'vs-dark';

  const preview = useMemo(
    () => buildPreviewDocument({ ...previewFiles, ...loadedFilesCache }),
    [previewFiles, loadedFilesCache]
  );

  return (
    <div className="hidden lg:flex flex-col w-[440px] min-w-[360px] h-full overflow-hidden shrink-0 gap-3 pr-3 pt-3 pb-3">

      {/* ── Preview Panel ───────────────────────────────────── */}
      {activeTools.Preview && (
        <div
          className="border rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-panel)' }}
        >
          <PanelHeader title="Live Preview" icon={<Eye size={15} />} />
          <div
            className="px-4 py-3 flex items-center justify-between gap-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {preview.canPreview
                ? `Rendering ${preview.entryFile}`
                : 'Preview works best for HTML, CSS, and JS outputs.'}
            </div>
            <div className="flex items-center gap-2">
              <SizeButton label="Desktop" icon={<Monitor size={12} />} active={previewSize === 'desktop'} onClick={() => setPreviewSize('desktop')} />
              <SizeButton label="Tablet"  icon={<Tablet size={12} />}   active={previewSize === 'tablet'}  onClick={() => setPreviewSize('tablet')} />
              <SizeButton label="Mobile"  icon={<Smartphone size={12} />} active={previewSize === 'mobile'} onClick={() => setPreviewSize('mobile')} />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
            {preview.canPreview ? (
              <div className="h-full flex justify-center">
                <div
                  className="h-full rounded-[20px] overflow-hidden"
                  style={{
                    width: PREVIEW_WIDTHS[previewSize],
                    maxWidth: '100%',
                    border: '1px solid var(--color-border)',
                    background: '#ffffff',
                  }}
                >
                  <iframe
                    title="Aizen Preview"
                    srcDoc={preview.document}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            ) : (
              <div className="p-5 h-full flex flex-col justify-center">
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Preview not available yet
                </div>
                <p className="text-sm leading-7" style={{ color: 'var(--color-muted)' }}>
                  {preview.reason}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Monaco Code Editor Panel ─────────────────────────── */}
      {activeTools.Code && (
        <div
          className="border rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-panel)' }}
        >
          <PanelHeader
            title="Code Editor"
            icon={<Code size={15} />}
            action={
              activeFile && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  style={{
                    background: saveStatus === 'saved'
                      ? 'rgba(52,211,153,0.15)'
                      : saveStatus === 'error'
                        ? 'rgba(251,113,133,0.15)'
                        : 'rgba(139,92,246,0.14)',
                    border: `1px solid ${
                      saveStatus === 'saved'
                        ? 'rgba(52,211,153,0.35)'
                        : saveStatus === 'error'
                          ? 'rgba(251,113,133,0.35)'
                          : 'rgba(139,92,246,0.35)'
                    }`,
                    color: saveStatus === 'saved'
                      ? '#6ee7b7'
                      : saveStatus === 'error'
                        ? '#fda4af'
                        : 'var(--color-accent-soft)',
                  }}
                >
                  {isSaving
                    ? <Loader2 size={12} className="animate-spin" />
                    : saveStatus === 'saved'
                      ? <Check size={12} />
                      : <Save size={12} />}
                  {isSaving ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
                </button>
              )
            }
          />

          {activeFile && (
            <div
              className="flex items-center px-4 py-2 shrink-0 font-mono text-xs"
              style={{
                color: 'var(--color-muted)',
                borderBottom: '1px solid var(--color-border)',
                background: 'rgba(0,0,0,0.12)',
              }}
            >
              <FileCode2 size={12} className="mr-2 opacity-60" />
              {activeFile}
              <span className="ml-2 kbd">Ctrl+S</span>
            </div>
          )}

          <div className="flex-1 min-h-0">
            {activeFile ? (
              <Editor
                height="100%"
                language={monacoLang}
                value={editorValue}
                theme={monacoTheme}
                onChange={(val) => setEditorValue(val ?? '')}
                onMount={(editor) => { editorRef.current = editor; }}
                options={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  fontLigatures: true,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  renderLineHighlight: 'gutter',
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  padding: { top: 12, bottom: 12 },
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  },
                  overviewRulerLanes: 0,
                  contextmenu: false,
                }}
              />
            ) : (
              <div className="p-5 text-xs font-mono flex items-center justify-center h-full" style={{ color: 'var(--color-muted)' }}>
                Select a file from the Files panel to start editing
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Files Panel ──────────────────────────────────────── */}
      {activeTools.Files && (
        <div
          className="border rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-panel)' }}
        >
          <PanelHeader
            title="Workspace Files"
            icon={<FileCode2 size={15} />}
            action={
              <button
                onClick={handleDeployGitHub}
                disabled={isDeploying || files.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              >
                {isDeploying ? <Loader2 size={13} className="animate-spin" /> : <Github size={13} />}
                <span>Deploy</span>
              </button>
            }
          />
          <div className="flex-1 overflow-y-auto p-3">
            {deploySuccess && (
              <div
                className="mb-3 p-3 rounded-2xl flex items-center justify-between text-xs"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#d1fae5' }}
              >
                <div className="flex items-center gap-2">
                  <Check size={14} style={{ color: '#6ee7b7' }} />
                  <span>Deployed to GitHub!</span>
                </div>
                <a href={deploySuccess} target="_blank" rel="noreferrer" className="underline font-semibold">
                  View Repo
                </a>
              </div>
            )}
            {isFilesLoading ? (
              <div className="flex justify-center mt-10">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-accent-soft)' }} />
              </div>
            ) : (
              <ul className="space-y-2">
                {files.length === 0 && (
                  <div
                    className="p-3 text-xs rounded-2xl"
                    style={{ color: 'var(--color-muted)', background: 'rgba(255,255,255,0.025)' }}
                  >
                    No files generated yet.
                  </div>
                )}
                {files.map((file) => {
                  const isActive = activeFile === file.name;
                  return (
                    <li
                      key={file.name}
                      onClick={() => handleFileClick(file)}
                      className="flex items-center space-x-3 px-3 py-3 rounded-2xl cursor-pointer transition-all"
                      style={{
                        background: isActive ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${isActive ? 'rgba(139,92,246,0.35)' : 'var(--color-border)'}`,
                        color: isActive ? 'var(--color-accent-soft)' : 'var(--color-muted)',
                      }}
                    >
                      <span
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-semibold"
                        style={{ background: 'rgba(255,255,255,0.04)', color: isActive ? 'var(--color-accent-soft)' : 'var(--color-muted)' }}
                      >
                        {file.icon}
                      </span>
                      <span className="truncate font-mono text-xs" style={{ color: isActive ? 'var(--color-text)' : 'var(--color-text)' }}>
                        {file.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Search Panel ──────────────────────────────────────── */}
      {activeTools.Search && (
        <div
          className="border rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-panel)' }}
        >
          <PanelHeader title="Search Workspace" icon={<Search size={15} />} />
          <div className="p-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search filenames and loaded file contents…"
                className="w-full rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!searchQuery.trim() ? (
              <div className="p-3 text-xs rounded-2xl" style={{ color: 'var(--color-muted)', background: 'rgba(255,255,255,0.025)' }}>
                Type to search across filenames, and the contents of files already loaded in this session.
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-xs rounded-2xl" style={{ color: 'var(--color-muted)', background: 'rgba(255,255,255,0.025)' }}>
                No matches for "{searchQuery}".
              </div>
            ) : (
              <ul className="space-y-2">
                {searchResults.map((file) => (
                  <li
                    key={file.name}
                    onClick={() => handleFileClick(file)}
                    className="flex items-center justify-between gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-semibold shrink-0"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-muted)' }}
                      >
                        {file.icon}
                      </span>
                      <span className="truncate font-mono text-xs" style={{ color: 'var(--color-text)' }}>{file.name}</span>
                    </div>
                    {file.contentMatches > 0 && (
                      <span
                        className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: 'rgba(139,92,246,0.16)', color: 'var(--color-accent-soft)' }}
                      >
                        {file.contentMatches} match{file.contentMatches === 1 ? '' : 'es'}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Terminal Panel ──────────────────────────────────────── */}
      {activeTools.Terminal && (
        <div
          className="border rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-panel)' }}
        >
          <PanelHeader
            title="Terminal"
            icon={<Terminal size={15} />}
            action={
              <div className="flex items-center gap-2">
                <select
                  value={termLang}
                  onChange={(e) => setTermLang(e.target.value)}
                  className="text-xs rounded-lg px-2 py-1.5 outline-none"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
                <button
                  onClick={runTerminal}
                  disabled={termRunning || !termCode.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.35)', color: '#6ee7b7' }}
                >
                  {termRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                  {termRunning ? 'Running' : 'Run'}
                </button>
              </div>
            }
          />

          {activeFile && (activeFile.endsWith('.py') || activeFile.endsWith('.js')) && (
            <button
              onClick={loadActiveFileIntoTerminal}
              className="flex items-center gap-1.5 mx-3 mt-3 self-start px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--color-accent-soft)' }}
            >
              <Wand2 size={12} />
              Load "{activeFile}" into terminal
            </button>
          )}

          <div className="flex-1 min-h-0 flex flex-col p-3 gap-3">
            <textarea
              value={termCode}
              onChange={(e) => setTermCode(e.target.value)}
              spellCheck={false}
              className="flex-1 min-h-[100px] rounded-xl p-3 text-xs font-mono resize-none outline-none"
              style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder={termLang === 'python' ? 'print("Hello from Aizen")' : 'console.log("Hello from Aizen")'}
            />
            <div
              className="rounded-xl p-3 font-mono text-xs overflow-auto max-h-40 shrink-0 whitespace-pre-wrap"
              style={{ background: 'var(--color-background)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
            >
              {termOutput || 'Output will appear here…'}
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics Panel ──────────────────────────────────── */}
      {activeTools.Analytics && (
        <div
          className="border rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-panel)' }}
        >
          <PanelHeader title="Analytics" icon={<BarChart2 size={15} />} />
          <AnalyticsPanel />
        </div>
      )}

      {/* ── SQL Assistant Panel (English -> SQL) ─────────────────── */}
      {activeTools.SQL && (
        <div
          className="border rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-panel)' }}
        >
          <PanelHeader
            title="SQL Assistant"
            icon={<Database size={15} />}
            action={
              <select
                value={sqlDialect}
                onChange={(e) => setSqlDialect(e.target.value)}
                className="text-xs rounded-lg px-2 py-1.5 outline-none"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="SQLite">SQLite</option>
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MySQL">MySQL</option>
                <option value="SQL Server">SQL Server</option>
              </select>
            }
          />

          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'var(--color-muted)' }}>
                Table schema <span className="normal-case font-normal opacity-70">(optional, improves accuracy)</span>
              </label>
              <textarea
                value={sqlSchema}
                onChange={(e) => setSqlSchema(e.target.value)}
                spellCheck={false}
                rows={4}
                className="w-full rounded-xl p-3 text-xs font-mono resize-none outline-none"
                style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                placeholder={'e.g.\ncustomers(id, name, signup_date, country)\norders(id, customer_id, total, created_at)'}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'var(--color-muted)' }}>
                Ask in plain English
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={sqlQuestion}
                  onChange={(e) => setSqlQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') generateSql(); }}
                  placeholder="e.g. Show total orders per customer in the last 30 days"
                  className="flex-1 rounded-xl px-3 py-2.5 text-xs outline-none"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
                <button
                  onClick={generateSql}
                  disabled={sqlLoading || !sqlQuestion.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shrink-0"
                  style={{ background: 'rgba(139,92,246,0.16)', border: '1px solid rgba(139,92,246,0.4)', color: 'var(--color-accent-soft)' }}
                >
                  {sqlLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {sqlLoading ? 'Generating…' : 'Generate SQL'}
                </button>
              </div>
            </div>

            {sqlError && (
              <div
                className="p-3 text-xs rounded-2xl"
                style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', color: '#fda4af' }}
              >
                {sqlError}
              </div>
            )}

            {sqlResult && (
              <div className="flex flex-col gap-2">
                <CodeBlock language="sql" value={sqlResult.sql} />
                {sqlResult.explanation && (
                  <div className="p-3 text-xs leading-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                    {sqlResult.explanation}
                  </div>
                )}
                {sqlResult.warnings && (
                  <div className="p-3 text-xs leading-6 rounded-2xl" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fcd34d' }}>
                    {sqlResult.warnings}
                  </div>
                )}
              </div>
            )}

            {!sqlResult && !sqlError && !sqlLoading && (
              <div className="p-3 text-xs rounded-2xl" style={{ color: 'var(--color-muted)', background: 'rgba(255,255,255,0.025)' }}>
                Describe your data (optional) and ask a question — Aizen turns it into a ready-to-run SQL query.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PanelHeader({ title, icon, action }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 shrink-0"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center space-x-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        <span style={{ color: 'var(--color-accent-soft)' }}>{icon}</span>
        <span>{title}</span>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function SizeButton({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] transition-all"
      style={{
        background: active ? 'rgba(139,92,246,0.16)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? 'rgba(139,92,246,0.35)' : 'var(--color-border)'}`,
        color: active ? 'var(--color-accent-soft)' : 'var(--color-muted)',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
