import React from 'react';
import { Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatArea({ messages, isThinking, currentTools }) {
  if (messages.length === 0 && !isThinking) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 md:p-14">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white animate-float-slow"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1 55%, #22d3ee)', boxShadow: '0 8px 28px rgba(139,92,246,0.35)' }}
        >
          <Sparkles size={24} />
        </div>
        <p className="uppercase tracking-[0.2em] text-xs mb-4" style={{ color: 'var(--color-accent-soft)' }}>
          Chat and build
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-5 max-w-3xl leading-tight font-display" style={{ color: 'var(--color-text)' }}>
          Talk to <span className="gradient-text">Aizen</span> naturally.
        </h2>
        <p className="max-w-xl leading-relaxed text-sm md:text-base" style={{ color: 'var(--color-muted)' }}>
          Say hi, ask a question, or describe a project. Aizen can reply like a normal assistant and
          switch into build mode when you want code, live preview, and generated artifacts directly in chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 space-y-6">
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {isThinking && currentTools.length === 0 && (
        <div className="flex items-center space-x-4 self-start">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1 55%, #22d3ee)' }}
          >
            <Sparkles size={13} />
          </div>
          <div
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          >
            <span className="font-medium text-sm">Thinking</span>
            <span className="flex space-x-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full typing-dot" style={{ animationDelay: '0ms', background: 'var(--color-accent-soft)' }}></span>
              <span className="w-1.5 h-1.5 rounded-full typing-dot" style={{ animationDelay: '150ms', background: 'var(--color-accent-soft)' }}></span>
              <span className="w-1.5 h-1.5 rounded-full typing-dot" style={{ animationDelay: '300ms', background: 'var(--color-accent-soft)' }}></span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
