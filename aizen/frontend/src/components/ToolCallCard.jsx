import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Code, Loader2, Terminal } from 'lucide-react';

export default function ToolCallCard({ toolName, toolId, input, result, isExecuting }) {
  const [expanded, setExpanded] = useState(false);

  let displayResult = result;
  if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result);
      if (parsed.stdout || parsed.stderr) {
        displayResult = `${parsed.stdout || ''}${parsed.stderr ? `\n${parsed.stderr}` : ''}`;
      }
    } catch {}
  }

  let friendlyName = toolName || 'Tool';
  let icon = <Code size={16} />;

  if (toolName === 'code_executor') friendlyName = 'Executing Code';
  else if (toolName === 'file_writer') friendlyName = 'Writing File';
  else if (toolName === 'file_reader') friendlyName = 'Reading File';
  else if (toolName === 'terminal') {
    friendlyName = 'Terminal';
    icon = <Terminal size={16} />;
  } else if (toolName === 'web_search') friendlyName = 'Web Search';

  if (isExecuting && !result) {
    return (
      <div className="flex items-center space-x-3 rounded-2xl py-3 px-4 w-max font-mono text-xs" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <Loader2 size={16} className="animate-spin-slow" style={{ color: 'var(--color-accent-soft)' }} />
        <span style={{ color: 'var(--color-text)' }}>{friendlyName}...</span>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] overflow-hidden w-full max-w-2xl mb-2 font-mono text-xs" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors" onClick={() => setExpanded(!expanded)} style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center space-x-3">
          <div style={{ color: 'var(--color-accent-green)' }}>{icon || <CheckCircle2 size={16} />}</div>
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{friendlyName}</span>
          <span style={{ color: 'var(--color-muted)' }}>ID: {toolId?.slice(0, 8)}...</span>
        </div>
        {expanded ? <ChevronDown size={14} style={{ color: 'var(--color-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-muted)' }} />}
      </div>

      {expanded && (
        <div className="p-4 overflow-x-auto" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
          {input && (
            <div className="mb-3">
              <div className="mb-1 uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--color-accent-soft)' }}>Input</div>
              <pre className="text-[11px] whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>{JSON.stringify(input, null, 2)}</pre>
            </div>
          )}
          {displayResult && (
            <div>
              <div className="mb-1 uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--color-accent-soft)' }}>Output</div>
              <pre className="text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto" style={{ color: 'var(--color-text)' }}>{displayResult}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
