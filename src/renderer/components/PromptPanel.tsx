import { useStore } from '../stores/appStore';

export default function PromptPanel() {
  const {
    currentPrompt,
    setCurrentPrompt,
    selectedPreset,
    presets,
    images,
    currentImageIndex,
    isProcessing,
    processCurrentImage,
    processQueue,
    abortProcessing,
    addLog,
  } = useStore();

  const currentImage = images[currentImageIndex];
  const pendingCount = images.filter((img) => img.status === 'pending').length;

  const handleCopy = () => {
    void navigator.clipboard.writeText(currentPrompt);
    addLog('info', 'Prompt copied to clipboard');
  };

  const currentPreset = selectedPreset ? presets.find((preset) => preset.id === selectedPreset) : null;

  return (
    <div className="h-36 border-t border-border-default flex flex-col">
      <div className="panel-header py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Prompt</span>
          {currentPreset && (
            <span className="text-xs px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
              {currentPreset.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
            title="Copy prompt"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {isProcessing ? (
            <button
              onClick={() => void abortProcessing()}
              className="btn bg-status-error/20 text-status-error hover:bg-status-error/30 text-xs py-1"
              title="Stop processing"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Stop
            </button>
          ) : (
            <>
              <button
                onClick={() => void processCurrentImage()}
                disabled={!currentImage || isProcessing}
                className="btn btn-primary text-xs py-1"
                title="Process current (Ctrl+Enter)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run
              </button>
              <button
                onClick={() => void processQueue()}
                disabled={pendingCount === 0 || isProcessing}
                className="btn btn-secondary text-xs py-1"
                title="Process all pending (Ctrl+Shift+Enter)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Run All ({pendingCount})
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 p-2">
        <textarea
          value={currentPrompt}
          onChange={(event) => setCurrentPrompt(event.target.value)}
          placeholder="Enter your prompt here..."
          className="w-full h-full resize-none bg-bg-primary border border-border-default rounded p-2 text-sm font-mono focus:border-accent-primary outline-none"
        />
      </div>
    </div>
  );
}
