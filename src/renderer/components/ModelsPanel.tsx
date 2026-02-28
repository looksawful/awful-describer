import { useState } from 'react';
import { useStore } from '../stores/appStore';
import { visionModels } from '../utils/presets';

export default function ModelsPanel() {
  const { 
    ollamaCheck, 
    ollamaStatus, 
    selectedModel, 
    setSelectedModel, 
    addLog,
    setOllamaStatus,
  } = useStore();

  const [pulling, setPulling] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const installedModels = ollamaStatus?.models || [];
  const installedNames = installedModels.map(m => m.name);

  const handleStartOllama = async () => {
    addLog('info', 'Starting Ollama...');
    const result = await window.api.ollama.start();
    if (result.success) {
      addLog('success', 'Ollama started');
      setTimeout(async () => {
        const status = await window.api.ollama.status();
        setOllamaStatus(status);
      }, 2000);
    } else {
      addLog('error', 'Failed to start Ollama', result.message);
    }
  };

  const handleStopOllama = async () => {
    addLog('info', 'Stopping Ollama...');
    const result = await window.api.ollama.stop();
    if (result.success) {
      addLog('success', 'Ollama stopped');
      setOllamaStatus({ running: false, models: [] });
    }
  };

  const handlePullModel = async (modelName: string) => {
    setPulling(modelName);
    setPullProgress('');
    addLog('info', `Pulling model: ${modelName}`);

    const cleanup = window.api.ollama.onPullProgress((data) => {
      if (data.model === modelName) {
        setPullProgress(data.data);
      }
    });

    try {
      await window.api.ollama.pull(modelName);
      addLog('success', `Model ${modelName} pulled successfully`);
      const status = await window.api.ollama.status();
      setOllamaStatus(status);
    } catch (error) {
      addLog('error', `Failed to pull ${modelName}`, String(error));
    } finally {
      cleanup();
      setPulling(null);
      setPullProgress('');
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    addLog('info', `Deleting model: ${modelName}`);
    const result = await window.api.ollama.delete(modelName);
    if (result.success) {
      addLog('success', `Model ${modelName} deleted`);
      const status = await window.api.ollama.status();
      setOllamaStatus(status);
    } else {
      addLog('error', `Failed to delete ${modelName}`);
    }
  };

  const handleInstallOllama = async () => {
    setDownloading(true);
    setDownloadProgress(0);
    addLog('info', 'Downloading Ollama installer...');

    const cleanup = window.api.ollama.onDownloadProgress((data) => {
      setDownloadProgress(data.percent);
    });

    try {
      const installerPath = await window.api.ollama.downloadInstaller();
      addLog('success', 'Installer downloaded, launching...');
      cleanup();
      
      await window.api.ollama.runInstaller(installerPath);
      addLog('info', 'Installer launched. Please complete installation and restart the app.');
    } catch (error) {
      addLog('error', 'Failed to download installer', String(error));
    } finally {
      cleanup();
      setDownloading(false);
    }
  };

  const formatSize = (bytes: number | undefined) => {
    if (!bytes) return 'Unknown';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header">
        <span className="text-sm font-medium">Models</span>
        <div className="flex items-center gap-2">
          {ollamaStatus?.running ? (
            <button 
              onClick={handleStopOllama}
              className="text-xs px-2 py-1 bg-status-error/20 text-status-error rounded hover:bg-status-error/30"
            >
              Stop
            </button>
          ) : ollamaCheck?.installed ? (
            <button 
              onClick={handleStartOllama}
              className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded hover:bg-accent-primary/30"
            >
              Start
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Ollama Status */}
        {!ollamaCheck?.installed && (
          <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
            <p className="text-sm text-status-warning mb-2">Ollama not installed</p>
            <button
              onClick={handleInstallOllama}
              disabled={downloading}
              className="btn btn-primary text-sm w-full"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                  <span>Downloading... {downloadProgress.toFixed(0)}%</span>
                </>
              ) : (
                'Install Ollama'
              )}
            </button>
          </div>
        )}

        {/* Installed Models */}
        {installedModels.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
              Installed ({installedModels.length})
            </h3>
            <div className="space-y-1">
              {installedModels.map((model) => (
                <div
                  key={model.name}
                  className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    selectedModel === model.name 
                      ? 'bg-accent-primary/20 border border-accent-primary/30' 
                      : 'hover:bg-bg-tertiary'
                  }`}
                  onClick={() => setSelectedModel(model.name)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{model.name}</p>
                    <p className="text-xs text-text-muted">{formatSize(model.size)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteModel(model.name);
                    }}
                    className="p-1 hover:bg-status-error/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete model"
                  >
                    <svg className="w-4 h-4 text-text-muted hover:text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Vision Models */}
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
            Vision Models
          </h3>
          <div className="space-y-1">
            {visionModels.map((model) => {
              const isInstalled = installedNames.some(n => n.startsWith(model.name.split(':')[0]));
              const isPulling = pulling === model.name;
              
              return (
                <div
                  key={model.name}
                  className={`p-2 rounded transition-colors ${
                    isInstalled 
                      ? 'bg-bg-tertiary/50' 
                      : 'hover:bg-bg-tertiary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{model.displayName}</p>
                      <p className="text-xs text-text-muted truncate">{model.description}</p>
                    </div>
                    {isInstalled ? (
                      <span className="text-xs text-accent-primary px-2 py-0.5 bg-accent-primary/10 rounded">
                        Installed
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePullModel(model.name)}
                        disabled={isPulling || !ollamaStatus?.running}
                        className="text-xs px-2 py-1 bg-bg-tertiary hover:bg-bg-elevated rounded disabled:opacity-50"
                      >
                        {isPulling ? (
                          <div className="w-4 h-4 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Pull'
                        )}
                      </button>
                    )}
                  </div>
                  {isPulling && pullProgress && (
                    <p className="text-xs text-text-muted mt-1 truncate">{pullProgress}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
