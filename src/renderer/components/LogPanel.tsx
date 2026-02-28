import { useRef, useEffect } from 'react';
import { useStore } from '../stores/appStore';

export default function LogPanel() {
  const { logs, clearLogs } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-status-success';
      case 'warning': return 'text-status-warning';
      case 'error': return 'text-status-error';
      default: return 'text-text-secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return '•';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header py-2">
        <span className="text-sm font-medium">Log</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{logs.length} entries</span>
          <button
            onClick={clearLogs}
            className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
            title="Clear log"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 log-scroll font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            <p>No log entries</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((entry) => (
              <div 
                key={entry.id} 
                className={`log-entry flex items-start gap-2 ${getLevelColor(entry.level)}`}
              >
                <span className="text-text-muted shrink-0">{formatTime(entry.timestamp)}</span>
                <span className="shrink-0 w-4 text-center">{getLevelIcon(entry.level)}</span>
                <span className="flex-1">{entry.message}</span>
                {entry.details && (
                  <span className="text-text-muted truncate max-w-[200px]" title={entry.details}>
                    {entry.details}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
