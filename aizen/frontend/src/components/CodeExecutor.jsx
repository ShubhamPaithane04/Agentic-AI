import React, { useState } from 'react';
import { Play, X, Terminal } from 'lucide-react';
import { fetchApi } from '../config/api';

export default function CodeExecutor({ code, language, onClose }) {
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  const runCode = async () => {
    setRunning(true);
    setOutput('Running...\n');

    try {
      const res = await fetchApi('/api/execute', {
        method: 'POST',
        body: JSON.stringify({ code, language })
      });
      const data = await res.json();

      if (data.success) {
        let result = '';
        if (data.stdout) result += data.stdout;
        if (data.stderr) result += '\n' + data.stderr;
        if (data.exit_code !== 0) result += `\n[Process exited with code ${data.exit_code}]`;
        setOutput(result || '[No output]');
      } else {
        setOutput(`Error: ${data.error}`);
      }
    } catch (err) {
      setOutput(`Failed to execute: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 rounded-2xl overflow-hidden z-50 glass-panel animate-scale-in">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center space-x-2">
          <Terminal size={16} style={{ color: 'var(--color-accent-green)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Code Runner</span>
        </div>
        <button onClick={onClose} style={{ color: 'var(--color-muted)' }}>
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        <button
          onClick={runCode}
          disabled={running}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all mb-3"
          style={{
            background: running ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg, #34d399, #10b981)',
            color: running ? 'var(--color-muted)' : '#062e21',
            cursor: running ? 'wait' : 'pointer'
          }}
        >
          <Play size={16} />
          <span>{running ? 'Running...' : 'Run Code'}</span>
        </button>

        <div
          className="rounded-xl p-3 font-mono text-xs overflow-auto max-h-64"
          style={{ background: 'var(--color-background)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
        >
          {output || 'Output will appear here...'}
        </div>
      </div>
    </div>
  );
}
