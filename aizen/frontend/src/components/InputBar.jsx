import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

const PROMPTS = [
  'Hi, how are you?',
  'What can you do?',
  'Build a full-stack SaaS dashboard with auth',
  'Create a Flask API for task management',
];

export default function InputBar({ onSend, isThinking }) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() && !isThinking) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div
        className="relative flex items-end rounded-2xl transition-all duration-200"
        style={{
          background: 'var(--color-surface)',
          border: `1px solid ${focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.14), 0 8px 24px rgba(139,92,246,0.12)' : 'none',
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Say hi, ask a question, or describe what you want to build..."
          className="flex-1 bg-transparent px-5 py-4 pr-14 text-sm resize-none outline-none max-h-40 overflow-y-auto"
          style={{ color: 'var(--color-text)', fontFamily: 'inherit' }}
          rows={1}
          disabled={isThinking}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isThinking}
          className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
            input.trim() && !isThinking ? 'btn-glow' : ''
          }`}
          style={
            input.trim() && !isThinking
              ? undefined
              : { background: 'transparent', color: 'var(--color-muted)', cursor: 'not-allowed' }
          }
        >
          <Send size={15} />
        </button>
      </div>

      <div className="flex items-center space-x-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex space-x-2 min-w-max">
          {PROMPTS.map((prompt) => (
            <SuggestionChip key={prompt} text={prompt} onClick={() => onSend(prompt)} disabled={isThinking} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({ text, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all hover:border-[var(--color-accent)]"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        color: disabled ? 'var(--color-border)' : 'var(--color-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <Sparkles size={11} style={{ color: 'var(--color-accent-soft)' }} />
      <span>{text}</span>
    </button>
  );
}
