import { useState } from 'react';
import { useStore } from '../stores/appStore';

export default function OutputPanel() {
  const { images, currentImageIndex, addLog } = useStore();
  const [fullscreen, setFullscreen] = useState(false);

  const currentImage = images[currentImageIndex];
  const result = currentImage?.result || '';

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      addLog('info', 'Result copied to clipboard');
    }
  };

  const handleSave = async () => {
    if (result && currentImage) {
      const defaultName = `${currentImage.name.replace(/\.[^/.]+$/, '')}_description.txt`;
      const savedPath = await window.api.file.saveResult(result, defaultName);
      if (savedPath) {
        addLog('success', `Saved to: ${savedPath}`);
      }
    }
  };

  const content = (
    <div className={`flex flex-col h-full overflow-hidden ${fullscreen ? 'fixed inset-0 z-50 bg-bg-primary' : ''}`}>
      <div className="panel-header">
        <span className="text-sm font-medium">Output</span>
        <div className="flex items-center gap-1">
          {result && (
            <>
              <span className="text-xs text-text-muted mr-2">
                {result.length} chars
              </span>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
                title="Copy (Ctrl+C)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={handleSave}
                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
                title="Save (Ctrl+S)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
            title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {fullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 bg-bg-primary">
        {currentImage?.status === 'processing' ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Processing...</span>
          </div>
        ) : currentImage?.status === 'error' ? (
          <div className="p-3 bg-status-error/10 border border-status-error/30 rounded">
            <p className="text-sm text-status-error font-medium mb-1">Error</p>
            <p className="text-xs text-status-error/80">{currentImage.error}</p>
          </div>
        ) : result ? (
          <div className="space-y-3">
            {/* Result text */}
            <div className="relative group">
              <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-text-primary">
                {result}
              </pre>
            </div>

            {/* Metadata */}
            {currentImage?.processedAt && (
              <div className="pt-3 border-t border-border-default">
                <p className="text-xs text-text-muted">
                  Processed: {currentImage.processedAt.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <svg className="w-12 h-12 opacity-30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No output yet</p>
            <p className="text-xs mt-1">Process an image to see results</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {result && (
        <div className="p-2 border-t border-border-default bg-bg-secondary/50 flex items-center gap-2">
          <span className="text-xs text-text-muted">Quick copy:</span>
          <button
            onClick={() => {
              const firstLine = result.split('\n')[0];
              navigator.clipboard.writeText(firstLine);
              addLog('info', 'First line copied');
            }}
            className="text-xs px-2 py-0.5 hover:bg-bg-tertiary rounded text-text-secondary"
          >
            First line
          </button>
          <button
            onClick={() => {
              const clean = result.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
              navigator.clipboard.writeText(clean);
              addLog('info', 'Single line copied');
            }}
            className="text-xs px-2 py-0.5 hover:bg-bg-tertiary rounded text-text-secondary"
          >
            Single line
          </button>
          <button
            onClick={() => {
              const json = JSON.stringify({ prompt: useStore.getState().currentPrompt, result });
              navigator.clipboard.writeText(json);
              addLog('info', 'JSON copied');
            }}
            className="text-xs px-2 py-0.5 hover:bg-bg-tertiary rounded text-text-secondary"
          >
            As JSON
          </button>
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50">
        {content}
      </div>
    );
  }

  return content;
}
