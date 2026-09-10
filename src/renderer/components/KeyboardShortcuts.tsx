import { useEffect, useState } from 'react';
import { useStore } from '../stores/appStore';

function fileNameFromPath(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath;
}

export default function KeyboardShortcuts() {
  const {
    processQueue,
    processCurrentImage,
    abortProcessing,
    togglePanel,
    addImages,
    addLog,
    images,
    currentImageIndex,
    isProcessing,
  } = useStore();

  const [showHelp, setShowHelp] = useState(false);
  const currentImage = images[currentImageIndex];

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (!(e.ctrlKey && e.key === 'Enter')) return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        const selected = await window.api.file.selectImages();
        if (selected.length > 0) {
          addImages(selected.map((filePath) => ({ path: filePath, name: fileNameFromPath(filePath) })));
          addLog('success', `Added ${selected.length} image(s) to queue`);
        }
      }

      if (e.ctrlKey && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessing && currentImage) {
          void processCurrentImage();
          addLog('info', 'Processing current image (Ctrl+Enter)');
        }
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessing && images.length > 0) {
          void processQueue();
          addLog('info', 'Processing entire queue (Ctrl+Shift+Enter)');
        }
      }

      if (e.key === 'Escape') {
        if (showHelp) setShowHelp(false);
        else if (isProcessing) await abortProcessing();
      }

      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        setShowHelp((previous) => !previous);
      }

      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            togglePanel('models');
            break;
          case '2':
            e.preventDefault();
            togglePanel('queue');
            break;
          case '3':
            e.preventDefault();
            togglePanel('preview');
            break;
          case '4':
            e.preventDefault();
            togglePanel('prompt');
            break;
          case '5':
            e.preventDefault();
            togglePanel('options');
            break;
          case '6':
            e.preventDefault();
            togglePanel('output');
            break;
          case '7':
            e.preventDefault();
            togglePanel('log');
            break;
          case '8':
            e.preventDefault();
            togglePanel('history');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    abortProcessing,
    addImages,
    addLog,
    currentImage,
    images.length,
    isProcessing,
    processCurrentImage,
    processQueue,
    showHelp,
    togglePanel,
  ]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-bg-secondary border border-border-default rounded-lg p-6 w-[500px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="p-1 hover:bg-bg-tertiary rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-accent-primary mb-2">General</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Open file selector</span>
                <kbd className="kbd">Ctrl + O</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Process current image</span>
                <kbd className="kbd">Ctrl + Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Process all images</span>
                <kbd className="kbd">Ctrl + Shift + Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Show/hide help</span>
                <kbd className="kbd">? / F1</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Cancel processing / close modal</span>
                <kbd className="kbd">Escape</kbd>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-accent-primary mb-2">Panel Toggles</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-text-secondary">Models</span><kbd className="kbd">Alt + 1</kbd></div>
              <div className="flex justify-between"><span className="text-text-secondary">Queue</span><kbd className="kbd">Alt + 2</kbd></div>
              <div className="flex justify-between"><span className="text-text-secondary">Preview</span><kbd className="kbd">Alt + 3</kbd></div>
              <div className="flex justify-between"><span className="text-text-secondary">Prompt</span><kbd className="kbd">Alt + 4</kbd></div>
              <div className="flex justify-between"><span className="text-text-secondary">Options</span><kbd className="kbd">Alt + 5</kbd></div>
              <div className="flex justify-between"><span className="text-text-secondary">Output</span><kbd className="kbd">Alt + 6</kbd></div>
              <div className="flex justify-between"><span className="text-text-secondary">Log</span><kbd className="kbd">Alt + 7</kbd></div>
              <div className="flex justify-between"><span className="text-text-secondary">History</span><kbd className="kbd">Alt + 8</kbd></div>
            </div>
          </div>

          <div className="pt-3 border-t border-border-default text-xs text-text-muted text-center">
            Press <kbd className="kbd">?</kbd> or <kbd className="kbd">Escape</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}
