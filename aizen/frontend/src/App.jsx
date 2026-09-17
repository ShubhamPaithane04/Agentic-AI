import React, { useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { X } from 'lucide-react';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import SettingsModal from './components/SettingsModal';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatArea from './components/ChatArea';
import InputBar from './components/InputBar';
import ToolPanels from './components/ToolPanels';
import ErrorBoundary from './components/ErrorBoundary';
import NotFoundPage from './components/NotFoundPage';
import Presentation from './components/Presentation';
import { useAizenChat } from './hooks/useAizenChat';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';


function ChatApp() {
  const { messages, isThinking, sendMessage, currentTools, clearChat } = useAizenChat();
  const { isLoginModalOpen, isSettingsModalOpen, toggleLoginModal, activeTools, loadedFilesCache } = useUIStore();
  const chatEndRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const showArtifactsPanel = (hasProjectArtifact(loadedFilesCache) || activeTools.SQL) && Object.values(activeTools).some(Boolean);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, currentTools]);

  return (
    <div
      className="flex h-screen w-full overflow-hidden relative"
      style={{
        background: 'var(--color-background)',
        color: 'var(--color-text)',
      }}
    >
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="absolute top-4 right-4 z-50">
            <button onClick={toggleLoginModal} className="p-2 rounded-full transition-colors hover:bg-white/10" style={{ color: 'var(--color-muted)' }}>
              <X size={18} />
            </button>
          </div>
          <LoginScreen />
        </div>
      )}

      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <SettingsModal />
        </div>
      )}

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onNewChat={clearChat} />

      <div className="flex flex-col flex-1 h-full relative w-full overflow-hidden">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 flex overflow-hidden p-0 md:p-0">
          <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
            <main className="flex-1 overflow-y-auto w-full flex justify-center">
              <div className="w-full max-w-3xl flex flex-col relative">
                <ChatArea messages={messages} isThinking={isThinking} currentTools={currentTools} />
                <div ref={chatEndRef} />
              </div>
            </main>
            <footer className="shrink-0 w-full flex justify-center px-4 pb-4 pt-4 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)] to-transparent">
              <div className="w-full max-w-3xl">
                <InputBar onSend={sendMessage} isThinking={isThinking} />
              </div>
            </footer>
          </div>
          {showArtifactsPanel && <ToolPanels />}
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/chat" /> : <LandingPage />} />
        <Route path="/chat" element={<ChatApp />} />
        <Route path="/login" element={<LoginScreen defaultIsLogin={true} />} />
        <Route path="/signup" element={<LoginScreen defaultIsLogin={false} />} />
        <Route path="/presentation" element={<Presentation />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

function hasProjectArtifact(loadedFilesCache) {
  const fileNames = Object.keys(loadedFilesCache || {});
  if (fileNames.length === 0) return false;

  const manifestRaw = loadedFilesCache['manifest.json'];
  if (!manifestRaw) {
    return fileNames.length >= 3;
  }

  try {
    const manifest = JSON.parse(manifestRaw);
    return (manifest.blueprint || '') !== 'chat';
  } catch {
    return fileNames.length >= 3;
  }
}
