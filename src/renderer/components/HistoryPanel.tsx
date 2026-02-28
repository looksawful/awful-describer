import { useStore } from '../stores/appStore';

export default function HistoryPanel() {
  const { history, clearHistory, addLog } = useStore();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
    });
  };

  const handleCopyResult = (result: string) => {
    navigator.clipboard.writeText(result);
    addLog('info', 'Result copied from history');
  };

  const handleExportHistory = () => {
    const data = history.map(entry => ({
      timestamp: entry.timestamp,
      imageName: entry.imageName,
      model: entry.model,
      preset: entry.preset,
      prompt: entry.prompt,
      result: entry.result,
      duration: entry.duration,
    }));
    
    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json);
    addLog('info', 'History exported to clipboard as JSON');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header py-2">
        <span className="text-sm font-medium">History</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-muted mr-1">{history.length}</span>
          <button
            onClick={handleExportHistory}
            className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
            title="Export history"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <button
            onClick={clearHistory}
            className="p-1 hover:bg-status-error/20 rounded text-text-secondary"
            title="Clear history"
          >
            <svg className="w-4 h-4 hover:text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            <p className="text-sm">No history</p>
          </div>
        ) : (
          <div className="divide-y divide-border-default">
            {history.map((entry) => (
              <div 
                key={entry.id}
                className="p-2 hover:bg-bg-tertiary/50 cursor-pointer group"
                onClick={() => handleCopyResult(entry.result)}
                title="Click to copy result"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate max-w-[60%]" title={entry.imageName}>
                    {entry.imageName}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="px-1.5 py-0.5 bg-bg-tertiary rounded truncate max-w-[80px]" title={entry.model}>
                    {entry.model.split(':')[0]}
                  </span>
                  {entry.preset && (
                    <span className="px-1.5 py-0.5 bg-accent-primary/10 text-accent-primary rounded truncate max-w-[80px]">
                      {entry.preset}
                    </span>
                  )}
                  {entry.duration && (
                    <span>{(entry.duration / 1000).toFixed(1)}s</span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                  {entry.result}
                </p>
                <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-accent-primary">Click to copy</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
