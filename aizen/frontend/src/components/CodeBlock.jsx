import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCircle2, ClipboardCopy } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export default function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);
  const theme = useUIStore((s) => s.theme);
  const isLight = theme === 'light';

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-[20px] overflow-hidden my-4 w-full relative"
      style={{
        border: '1px solid var(--color-border)',
        background: isLight ? '#f8f8fb' : 'rgba(0,0,0,0.32)',
      }}
    >
      {/* Accent top line */}
      <div
        className="h-[2px] w-full"
        style={{ background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)' }}
      />

      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 text-xs font-sans"
        style={{
          background: isLight ? '#efeff5' : 'rgba(139,92,246,0.04)',
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-muted)',
        }}
      >
        <span className="font-semibold uppercase tracking-[0.18em]">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 transition-colors"
          style={{ color: copied ? 'var(--color-accent-green)' : 'var(--color-accent-soft)' }}
        >
          {copied ? <CheckCircle2 size={14} /> : <ClipboardCopy size={14} />}
          <span>{copied ? 'Copied' : 'Copy code'}</span>
        </button>
      </div>

      {/* Code content */}
      <div className="text-[13px] leading-relaxed">
        <SyntaxHighlighter
          language={language || 'text'}
          style={isLight ? oneLight : vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontFamily: 'var(--font-mono)',
          }}
          codeTagProps={{ style: { fontFamily: 'var(--font-mono)' } }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
