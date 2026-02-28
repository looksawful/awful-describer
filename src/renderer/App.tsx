import { useEffect, useCallback } from 'react';
import { useStore } from './stores/appStore';
import TitleBar from './components/TitleBar';
import StatusBar from './components/StatusBar';
import ModelsPanel from './components/ModelsPanel';
import QueuePanel from './components/QueuePanel';
import PreviewPanel from './components/PreviewPanel';
import PromptPanel from './components/PromptPanel';
import OptionsPanel from './components/OptionsPanel';
import OutputPanel from './components/OutputPanel';
import LogPanel from './components/LogPanel';
import HistoryPanel from './components/HistoryPanel';
import PresetsPanel from './components/PresetsPanel';
import DropZone from './components/DropZone';
import KeyboardShortcuts from './components/KeyboardShortcuts';

export default function App() {
  const { 
    setOllamaCheck, 
    setOllamaStatus, 
    addLog, 
    setSystemInfo,
    panels,
  } = useStore();

  const checkOllama = useCallback(async () => {
    try {
      const check = await window.api.ollama.check();
      setOllamaCheck(check);
      addLog(check.installed ? 'success' : 'warning', 
        check.installed ? `Ollama found at ${check.path}` : 'Ollama not installed');

      if (check.installed) {
        const status = await window.api.ollama.status();
        setOllamaStatus(status);
        addLog(status.running ? 'success' : 'info',
          status.running ? `Ollama running with ${status.models.length} models` : 'Ollama not running');
      }
    } catch (error) {
      addLog('error', 'Failed to check Ollama', String(error));
    }
  }, [setOllamaCheck, setOllamaStatus, addLog]);

  const updateSystemInfo = useCallback(async () => {
    try {
      const info = await window.api.system.info();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to get system info:', error);
    }
  }, [setSystemInfo]);

  useEffect(() => {
    addLog('info', 'Awful Describer started');
    checkOllama();
    updateSystemInfo();

    const statusInterval = setInterval(async () => {
      try {
        const status = await window.api.ollama.status();
        setOllamaStatus(status);
      } catch {}
    }, 5000);

    const sysInterval = setInterval(updateSystemInfo, 3000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(sysInterval);
    };
  }, [checkOllama, updateSystemInfo, addLog, setOllamaStatus]);

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      <TitleBar />
      <KeyboardShortcuts />
      <DropZone>
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Models & Presets */}
          <div className="w-72 flex flex-col border-r border-border-default bg-bg-secondary overflow-hidden">
            {panels.models?.visible && <ModelsPanel />}
            <PresetsPanel />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              {/* Center - Queue & Preview */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-[400px]">
                <div className="flex-1 flex overflow-hidden">
                  {panels.queue?.visible && (
                    <div className="w-56 border-r border-border-default overflow-hidden">
                      <QueuePanel />
                    </div>
                  )}
                  {panels.preview?.visible && (
                    <div className="flex-1 overflow-hidden">
                      <PreviewPanel />
                    </div>
                  )}
                </div>
                {panels.prompt?.visible && <PromptPanel />}
              </div>

              {/* Right - Options & Output */}
              <div className="w-96 flex flex-col border-l border-border-default overflow-hidden">
                {panels.options?.visible && (
                  <div className="h-1/2 border-b border-border-default overflow-hidden">
                    <OptionsPanel />
                  </div>
                )}
                {panels.output?.visible && (
                  <div className="flex-1 overflow-hidden">
                    <OutputPanel />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom - Log & History */}
            <div className="h-48 flex border-t border-border-default">
              {panels.log?.visible && (
                <div className="flex-1 border-r border-border-default overflow-hidden">
                  <LogPanel />
                </div>
              )}
              {panels.history?.visible && (
                <div className="w-96 overflow-hidden">
                  <HistoryPanel />
                </div>
              )}
            </div>
          </div>
        </div>
      </DropZone>
      <StatusBar />
    </div>
  );
}
