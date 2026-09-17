import { useCallback, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { useUIStore } from '../store/uiStore';

export function useAizenChat() {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentTools, setCurrentTools] = useState([]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim()) return;

      const userMessage = { role: 'user', content: [{ type: 'text', text }] };
      let nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setIsThinking(true);
      setCurrentTools([]);

      try {
        const token = localStorage.getItem('aizen_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/api/smart-workflow`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: text,
            conversation: serializeConversation(nextMessages),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Readable streams are not supported in this browser.');
        }

        const assistantMessage = { role: 'assistant', content: [] };
        nextMessages = [...nextMessages, assistantMessage];
        setMessages(nextMessages);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let buffer = '';

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (!value) continue;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const event of events) {
            const dataStr = event.replace(/^data: /, '').trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              if (data.type === 'text') {
                assistantMessage.content.push({
                  type: 'text',
                  text: data.text || data.content || '',
                });
                setMessages([...nextMessages]);
                continue;
              }

              if (data.type === 'tool_start') {
                setCurrentTools((tools) => [
                  ...tools,
                  { toolId: data.toolId, toolName: data.toolName },
                ]);
                continue;
              }

              if (data.type === 'tool_result') {
                setCurrentTools((tools) => tools.filter((tool) => tool.toolId !== data.toolId));
                continue;
              }

              if (data.type === 'done') {
                setIsThinking(false);
                setCurrentTools([]);

                if (data.message) {
                  assistantMessage.content.push({ type: 'text', text: data.message });
                }

                if (data.files && Object.keys(data.files).length > 0) {
                  useUIStore.getState().setLoadedFilesCache(data.files);
                  assistantMessage.content.push({
                    type: 'artifact_bundle',
                    files: data.files,
                    manifest: data.manifest || {},
                  });
                }

                setMessages([...nextMessages]);
                useUIStore.getState().triggerFileRefresh();
                continue;
              }

              if (data.type === 'error') {
                assistantMessage.content.push({
                  type: 'text',
                  text: `**Error:** ${data.error || data.content || 'Unknown error'}`,
                });
                setMessages([...nextMessages]);
                setIsThinking(false);
                setCurrentTools([]);
              }
            } catch (error) {
              console.error('Failed to parse SSE event', error, dataStr);
            }
          }
        }
      } catch (error) {
        console.error('Chat error:', error);
        setMessages((existing) => [
          ...existing,
          {
            role: 'assistant',
            content: [{ type: 'text', text: `**Error:** ${error.message}` }],
          },
        ]);
        setIsThinking(false);
        setCurrentTools([]);
      }
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    useUIStore.getState().setLoadedFilesCache({});
    useUIStore.getState().clearActiveFile();
  }, []);

  return { messages, isThinking, sendMessage, currentTools, clearChat };
}

function serializeConversation(messages) {
  return messages.slice(-40).map((message) => ({
    role: message.role,
    content: (message.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => ({ type: 'text', text: block.text || '' })),
  }));
}
