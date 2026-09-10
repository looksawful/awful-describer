import { useCallback, useEffect } from 'react';
import DropZone from './components/DropZone';
import HistoryPanel from './components/HistoryPanel';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import LogPanel from './components/LogPanel';
import ModelsPanel from './components/ModelsPanel';
import OptionsPanel from './components/OptionsPanel';
import OutputPanel from './components/OutputPanel';
import PresetsPanel from './components/PresetsPanel';
import PreviewPanel from './components/PreviewPanel';
import PromptPanel from './components/PromptPanel';
import QueuePanel from './components/QueuePanel';
import StatusBar from './components/StatusBar';
import TitleBar from './components/TitleBar';
import { useStore } from './stores/appStore';

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
      addLog(
        check.installed ? 'success' : 'warning',
        check.installed ? `Ollama found at ${check.path}` : 'Ollama not installed',
      );

      if (check.installed) {
        const status = await window.api.ollama.status();
        setOllamaStatus(status);
        addLog(
          status.running ? 'success' : 'info',
          status.running ? `Ollama running with ${status.models.length} models` : 'Ollama not running',
        );
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
    void checkOllama();
    void updateSystemInfo();

    const statusInterval = setInterval(() => {
      void window.api.ollama.status()
        .then(setOllamaStatus)
        .catch(() => undefined);
    }, 5000);

    const systemInterval = setInterval(() => {
      void updateSystemInfo();
    }, 3000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(systemInterval);
    };
  }, [checkOllama, updateSystemInfo, addLog, setOllamaStatus]);

  const leftVisible = Boolean(panels.models?.visible || panels.presets?.visible);
  const rightVisible = Boolean(panels.options?.visible || panels.output?.visible);
  const bottomVisible = Boolean(panels.log?.visible || panels.history?.visible);

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      <TitleBar />
      <KeyboardShortcuts />
      <DropZone>
        <div className="flex-1 flex overflow-hidden">
          {leftVisible && (
            <div className="w-72 flex flex-col border-r border-border-default bg-bg-secondary overflow-hidden">
              {panels.models?.visible && <ModelsPanel />}
              {panels.presets?.visible && <PresetsPanel />}
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
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

              {rightVisible && (
                <div className="w-96 flex flex-col border-l border-border-default overflow-hidden">
                  {panels.options?.visible && (
                    <div className={panels.output?.visible ? 'h-1/2 border-b border-border-default overflow-hidden' : 'flex-1 overflow-hidden'}>
                      <OptionsPanel />
                    </div>
                  )}
                  {panels.output?.visible && (
                    <div className="flex-1 overflow-hidden">
                      <OutputPanel />
                    </div>
                  )}
                </div>
              )}
            </div>

            {bottomVisible && (
              <div className="h-48 flex border-t border-border-default">
                {panels.log?.visible && (
                  <div className={panels.history?.visible ? 'flex-1 border-r border-border-default overflow-hidden' : 'flex-1 overflow-hidden'}>
                    <LogPanel />
                  </div>
                )}
                {panels.history?.visible && (
                  <div className={panels.log?.visible ? 'w-96 overflow-hidden' : 'flex-1 overflow-hidden'}>
                    <HistoryPanel />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DropZone>
      <StatusBar />
    </div>
  );
}
