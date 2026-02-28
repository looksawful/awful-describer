import { useStore } from '../stores/appStore';

export default function StatusBar() {
  const { 
    ollamaCheck, 
    ollamaStatus, 
    systemInfo, 
    images, 
    isProcessing, 
    processingProgress,
    selectedModel,
  } = useStore();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="h-6 bg-bg-secondary border-t border-border-default flex items-center justify-between px-3 text-xs select-none">
      <div className="flex items-center gap-4">
        {/* Ollama Status */}
        <div className="flex items-center gap-1.5">
          <div className={`status-dot ${
            ollamaStatus?.running 
              ? 'status-dot-success' 
              : ollamaCheck?.installed 
                ? 'status-dot-warning' 
                : 'status-dot-error'
          }`} />
          <span className="text-text-secondary">
            Ollama: {ollamaStatus?.running 
              ? 'Running' 
              : ollamaCheck?.installed 
                ? 'Stopped' 
                : 'Not Installed'}
          </span>
        </div>

        {/* Model */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          <span>Model:</span>
          <span className="text-text-primary">{selectedModel}</span>
        </div>

        {/* Queue */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          <span>Queue:</span>
          <span className="text-text-primary">{images.length}</span>
        </div>

        {/* Processing */}
        {isProcessing && processingProgress && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-accent-primary">
              Processing {processingProgress.current}/{processingProgress.total}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* System Info */}
        {systemInfo && (
          <>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span>CPU:</span>
              <span className={systemInfo.cpu > 80 ? 'text-status-warning' : 'text-text-primary'}>
                {systemInfo.cpu.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span>RAM:</span>
              <span className={parseFloat(systemInfo.memory.percent) > 80 ? 'text-status-warning' : 'text-text-primary'}>
                {formatBytes(systemInfo.memory.used)} / {formatBytes(systemInfo.memory.total)}
              </span>
            </div>
          </>
        )}

        {/* Shortcuts hint */}
        <div className="flex items-center gap-1 text-text-muted">
          <kbd className="kbd">Ctrl+O</kbd>
          <span>Open</span>
          <kbd className="kbd ml-2">Ctrl+Enter</kbd>
          <span>Run</span>
          <kbd className="kbd ml-2">?</kbd>
          <span>Help</span>
        </div>
      </div>
    </div>
  );
}
