import React, { useEffect, useMemo, useState } from 'react';
import { Code2, Eye, Monitor, Smartphone, Tablet } from 'lucide-react';
import CodeBlock from './CodeBlock';
import { buildPreviewDocument, pickIcon, pickPrimaryFiles, PREVIEW_WIDTHS } from '../utils/artifacts';

export default function ArtifactBundle({ files = {}, manifest = {} }) {
  const fileNames = useMemo(() => pickPrimaryFiles(files), [files]);
  const [activeFile, setActiveFile] = useState(fileNames[0] || '');
  const [previewSize, setPreviewSize] = useState('desktop');
  const preview = useMemo(
    () => buildPreviewDocument(files, manifest.runtime?.preview_entry || ''),
    [files, manifest]
  );
  const validationRuns = manifest.validation_results || [];

  useEffect(() => {
    setActiveFile(fileNames[0] || '');
  }, [fileNames]);

  const effectiveFile = activeFile || fileNames[0] || '';
  const ext = effectiveFile.split('.').pop()?.toLowerCase() || 'txt';
  const languageMap = {
    jsx: 'jsx',
    js: 'javascript',
    tsx: 'tsx',
    ts: 'typescript',
    py: 'python',
    css: 'css',
    html: 'html',
    json: 'json',
    md: 'markdown',
    java: 'java',
    cpp: 'cpp',
    php: 'php',
  };

  return (
    <div
      className="rounded-[24px] overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {manifest.project_name || 'Generated artifact'}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            {manifest.runtime?.stack_label || 'Starter artifact'}
            {' | '}
            {manifest.runtime?.primary_language || 'Mixed'}
            {' | '}
            {(manifest.operation || 'create') === 'refine' ? 'Refined workspace' : 'Created artifact'}
            {' | '}
            {preview.canPreview
              ? `Preview ready from ${preview.entryFile}`
              : `${fileNames.length || Object.keys(files).length} files generated`}
          </div>
        </div>

        {preview.canPreview && (
          <div className="flex items-center gap-2">
            <SizeButton
              label="Desktop"
              icon={<Monitor size={12} />}
              active={previewSize === 'desktop'}
              onClick={() => setPreviewSize('desktop')}
            />
            <SizeButton
              label="Tablet"
              icon={<Tablet size={12} />}
              active={previewSize === 'tablet'}
              onClick={() => setPreviewSize('tablet')}
            />
            <SizeButton
              label="Mobile"
              icon={<Smartphone size={12} />}
              active={previewSize === 'mobile'}
              onClick={() => setPreviewSize('mobile')}
            />
          </div>
        )}
      </div>

      {preview.canPreview && (
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--color-accent-soft)' }}>
            <Eye size={13} />
            <span>Live preview</span>
          </div>
          <div className="flex justify-center">
            <div
              className="rounded-[22px] overflow-hidden"
              style={{
                width: PREVIEW_WIDTHS[previewSize],
                maxWidth: '100%',
                height: '26rem',
                background: '#fff',
                border: '1px solid var(--color-border)',
              }}
            >
              <iframe
                title="Artifact Preview"
                srcDoc={preview.document}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {(manifest.validation?.length > 0 || manifest.runtime?.run_commands?.length > 0) && (
          <div
            className="mb-4 rounded-[20px] p-4"
            style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid var(--color-border)' }}
          >
            {manifest.validation?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs mb-2 font-semibold" style={{ color: 'var(--color-accent-soft)' }}>
                  Quality checks
                </div>
                <ul className="space-y-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                  {manifest.validation.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {manifest.runtime?.run_commands?.length > 0 && (
              <div>
                <div className="text-xs mb-2 font-semibold" style={{ color: 'var(--color-accent-soft)' }}>
                  Run locally
                </div>
                <div className="flex flex-col gap-2">
                  {manifest.runtime.run_commands.map((command) => (
                    <div
                      key={command}
                      className="rounded-2xl px-3 py-2 text-xs font-mono"
                      style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    >
                      {command}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationRuns.length > 0 && (
              <div className="mt-3">
                <div className="text-xs mb-2 font-semibold" style={{ color: 'var(--color-accent-soft)' }}>
                  Validation run
                </div>
                <div className="space-y-2">
                  {validationRuns.map((run, index) => (
                    <div
                      key={`${run.command || 'validation'}-${index}`}
                      className="rounded-2xl px-3 py-2 text-xs"
                      style={{
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        color: run.success ? '#6ee7b7' : '#fda4af',
                      }}
                    >
                      <div className="font-mono">{run.command || 'validation'}</div>
                      <div className="mt-1">
                        {run.note ||
                          run.error ||
                          run.stderr ||
                          run.stdout ||
                          (run.success ? 'Validation passed.' : 'Validation failed.')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--color-accent-soft)' }}>
          <Code2 size={13} />
          <span>Code in chat</span>
        </div>

        {fileNames.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              {fileNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveFile(name)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs transition-all"
                  style={{
                    background:
                      effectiveFile === name ? 'rgba(139,92,246,0.16)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      effectiveFile === name
                        ? 'rgba(139,92,246,0.35)'
                        : 'var(--color-border)'
                    }`,
                    color: effectiveFile === name ? 'var(--color-accent-soft)' : 'var(--color-muted)',
                  }}
                >
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {pickIcon(name)}
                  </span>
                  <span>{name}</span>
                </button>
              ))}
            </div>

            <div
              className="rounded-[20px] overflow-hidden"
              style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)' }}
            >
              <div
                className="px-4 py-2 text-xs font-mono"
                style={{ color: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)' }}
              >
                {effectiveFile}
              </div>
              <CodeBlock
                language={languageMap[ext] || 'text'}
                value={files[effectiveFile] || '// File unavailable'}
              />
            </div>
          </>
        ) : (
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
            No previewable files were attached to this reply.
          </div>
        )}
      </div>
    </div>
  );
}

function SizeButton({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] transition-all"
      style={{
        background: active ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? 'rgba(139,92,246,0.35)' : 'var(--color-border)'}`,
        color: active ? 'var(--color-accent-soft)' : 'var(--color-muted)',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
