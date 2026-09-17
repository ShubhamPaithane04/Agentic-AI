import React from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import ArtifactBundle from './ArtifactBundle';
import { useUIStore } from '../store/uiStore';
import { ExternalLink, Sparkles } from 'lucide-react';

const EXT_COLORS = {
  jsx:  { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', label: 'JSX' },
  js:   { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', label: 'JS'  },
  tsx:  { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', label: 'TSX' },
  ts:   { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', label: 'TS'  },
  py:   { bg: 'rgba(52,211,153,0.12)',  color: '#6ee7b7', label: 'PY'  },
  css:  { bg: 'rgba(34,211,238,0.12)',  color: '#67e8f9', label: 'CSS' },
  json: { bg: 'rgba(255,255,255,0.05)', color: '#cbd5e1', label: 'JSON'},
  md:   { bg: 'rgba(255,255,255,0.05)', color: '#94a3b8', label: 'MD'  },
  html: { bg: 'rgba(251,113,133,0.12)', color: '#fda4af', label: 'HTML'},
};

function FileChip({ filename }) {
  const { setActiveFile, loadedFilesCache } = useUIStore();
  const ext = filename.split('.').pop()?.toLowerCase();
  const style = EXT_COLORS[ext] || { bg: 'rgba(255,255,255,0.04)', color: 'var(--color-muted)', label: ext?.toUpperCase() || 'FILE' };

  return (
    <button
      onClick={() => setActiveFile(filename, loadedFilesCache[filename] || `// ${filename}`)}
      className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-mono mr-1 mb-1 cursor-pointer transition-all hover:scale-[1.02]"
      style={{ background: style.bg, border: `1px solid ${style.color}33` }}
    >
      <span className="font-bold text-[10px] px-1 rounded-full" style={{ background: `${style.color}22`, color: style.color }}>
        {style.label}
      </span>
      <span style={{ color: 'var(--color-text)' }}>{filename}</span>
    </button>
  );
}

function renderTextWithFileChips(text) {
  const fileRegex = /\b([\w./-]+\.(jsx?|tsx?|py|css|json|md|html|sh|txt))\b/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(<FileChip key={match.index} filename={match[0]} />);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// Detect if a paragraph's first child is a <strong> followed by a colon
// e.g.  **Training Data**: some explanation...
// Returns true when the strong text ends with ':'  OR the text immediately after strong starts with ':'
function isDefinitionParagraph(children) {
  if (!Array.isArray(children)) return false;
  const first = children[0];
  if (!first) return false;
  // ReactMarkdown gives us a <strong> element for **...**
  if (typeof first === 'object' && first?.type === 'strong') return true;
  return false;
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const theme = useUIStore((s) => s.theme);
  const isDark = theme !== 'light';

  if (isUser) {
    const text = message.content.map((part) => part.text || '').join('');
    return (
      <div className="flex items-start justify-end w-full animate-slide-in mb-5">
        <div className="aizen-user-bubble">
          {text}
        </div>
      </div>
    );
  }

  // Build the ReactMarkdown component map
  const mdComponents = {
    // ── Paragraph ──────────────────────────────────────────────────────────
    p({ children }) {
      const ch = Array.isArray(children) ? children : [children];

      // Definition-style paragraph → render as a styled card row
      if (isDefinitionParagraph(ch)) {
        return (
          <div className="aizen-definition-row">
            {ch.map((child, i) => {
              if (typeof child === 'object' && child?.type === 'strong') {
                return (
                  <span key={i} className="aizen-definition-term">
                    {child.props.children}
                  </span>
                );
              }
              // The rest of the children (text after the bold term)
              const text = typeof child === 'string' ? child.replace(/^:\s*/, '') : child;
              if (typeof text === 'string') return <span key={i} className="aizen-definition-desc">{renderTextWithFileChips(text)}</span>;
              return <span key={i} className="aizen-definition-desc">{text}</span>;
            })}
          </div>
        );
      }

      // Normal paragraph
      if (typeof children === 'string') return <p className="aizen-p">{renderTextWithFileChips(children)}</p>;
      return <p className="aizen-p">{children}</p>;
    },

    // ── Headings ───────────────────────────────────────────────────────────
    h1({ children }) { return <h1 className="aizen-h1">{children}</h1>; },
    h2({ children }) { return <h2 className="aizen-h2">{children}</h2>; },
    h3({ children }) { return <h3 className="aizen-h3">{children}</h3>; },

    // ── Inline code ────────────────────────────────────────────────────────
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
      ) : (
        <code className="aizen-inline-code" {...props}>{children}</code>
      );
    },

    // ── Lists ──────────────────────────────────────────────────────────────
    ul({ children }) { return <ul className="aizen-ul">{children}</ul>; },
    ol({ children }) { return <ol className="aizen-ol">{children}</ol>; },
    li({ children }) {
      return (
        <li className="aizen-li">
          <span className="aizen-li-bullet" />
          <span>{children}</span>
        </li>
      );
    },

    // ── Blockquote ─────────────────────────────────────────────────────────
    blockquote({ children }) {
      return <blockquote className="aizen-blockquote">{children}</blockquote>;
    },

    // ── Horizontal rule ────────────────────────────────────────────────────
    hr() { return <hr className="aizen-hr" />; },

    // ── Strong (bold) — standalone, not inside definition ──────────────────
    strong({ children }) {
      return <strong className="aizen-strong">{children}</strong>;
    },

    // ── Links ──────────────────────────────────────────────────────────────
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="aizen-link"
        >
          {children}
          <ExternalLink size={11} className="inline ml-0.5 opacity-60" />
        </a>
      );
    },

    // ── Table ──────────────────────────────────────────────────────────────
    table({ children }) { return <div className="aizen-table-wrapper"><table className="aizen-table">{children}</table></div>; },
    th({ children }) { return <th className="aizen-th">{children}</th>; },
    td({ children }) { return <td className="aizen-td">{children}</td>; },
  };

  return (
    <div className="flex items-start space-x-3 w-full animate-slide-in mb-8">
      {/* AI avatar */}
      <div className="aizen-avatar shrink-0">
        <Sparkles size={13} />
      </div>

      <div className="flex-1 overflow-hidden space-y-1 min-w-0">
        {message.content.map((block, index) => {
          if (block.type === 'artifact_bundle') {
            return <ArtifactBundle key={`artifact-${index}`} files={block.files} manifest={block.manifest} />;
          }
          if (block.type !== 'text') return null;

          return (
            <div key={index} className={`aizen-message-body ${isDark ? 'aizen-dark' : 'aizen-light'}`}>
              <ReactMarkdown components={mdComponents}>
                {block.text}
              </ReactMarkdown>
            </div>
          );
        })}
      </div>
    </div>
  );
}
