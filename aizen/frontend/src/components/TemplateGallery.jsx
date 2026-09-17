import React, { useState, useEffect } from 'react';
import { Rocket, FileCode, Loader2, X } from 'lucide-react';
import { fetchApi } from '../config/api';

export default function TemplateGallery({ onClose, onTemplateCreated }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetchApi('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  const createFromTemplate = async (templateId) => {
    setCreating(templateId);
    try {
      const res = await fetchApi(`/api/templates/${templateId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onTemplateCreated?.(data);
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      console.error('Failed to create from template', err);
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-[28px] overflow-hidden glass-panel animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center space-x-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.16)', color: 'var(--color-accent-soft)' }}
            >
              <Rocket size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-text)' }}>Quick Start Templates</h2>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Generate a complete project in seconds</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-white/5" style={{ color: 'var(--color-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-accent-soft)' }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => createFromTemplate(template.id)}
                  disabled={creating === template.id}
                  className="text-left p-6 rounded-2xl transition-all duration-200 card-hover"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    cursor: creating === template.id ? 'wait' : 'pointer'
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(139,92,246,0.14)', color: 'var(--color-accent-soft)' }}
                    >
                      <FileCode size={20} />
                    </div>
                    {creating === template.id && <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-accent-soft)' }} />}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 font-display" style={{ color: 'var(--color-text)' }}>{template.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{template.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
