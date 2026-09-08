import { useEffect, useRef, useState } from 'react';
import { LatestOperationGate } from '../../shared/latestOperation';
import { useStore } from '../stores/appStore';

export default function PreviewPanel() {
  const { images, currentImageIndex, addLog } = useStore();
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const loadGate = useRef(new LatestOperationGate()).current;

  const currentImage = images[currentImageIndex];

  useEffect(() => {
    const token = loadGate.begin();
    const filePath = currentImage?.path;

    if (!filePath) {
      setImageDataUrl(null);
      setLoading(false);
      return () => loadGate.invalidate(token);
    }

    setLoading(true);
    setImageDataUrl(null);
    window.api.file.readImage(filePath)
      .then((data) => {
        if (!loadGate.isCurrent(token)) return;
        setImageDataUrl(data ? `data:${data.mimeType};base64,${data.base64}` : null);
      })
      .catch((error: unknown) => {
        if (loadGate.isCurrent(token)) addLog('error', 'Failed to load preview', String(error));
      })
      .finally(() => {
        if (loadGate.isCurrent(token)) setLoading(false);
      });

    return () => loadGate.invalidate(token);
  }, [currentImage?.id, currentImage?.path, addLog, loadGate]);

  const handleOpenInFolder = () => {
    if (currentImage?.path) void window.api.shell.openPath(currentImage.path);
  };

  const handleCopyPath = () => {
    if (currentImage?.path) {
      void navigator.clipboard.writeText(currentImage.path);
      addLog('info', 'Path copied to clipboard');
    }
  };

  const content = (
    <div className={`flex flex-col h-full overflow-hidden ${fullscreen ? 'fixed inset-0 z-50 bg-bg-primary' : ''}`}>
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Preview</span>
          {currentImage && (
            <span className="text-xs text-text-muted truncate max-w-[200px]">
              {currentImage.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(Math.max(25, zoom - 25))}
            className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
            title="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-text-muted w-10 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(400, zoom + 25))}
            className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
            title="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-1 hover:bg-bg-tertiary rounded text-text-secondary text-xs"
            title="Reset zoom"
          >
            1:1
          </button>
          <div className="w-px h-4 bg-border-default mx-1" />
          {currentImage && (
            <>
              <button
                onClick={handleOpenInFolder}
                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
                title="Open in folder"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>
              <button
                onClick={handleCopyPath}
                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
                title="Copy path"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
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

      <div className="flex-1 overflow-auto bg-[#050505] flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Loading...</span>
          </div>
        ) : imageDataUrl ? (
          <div
            className="relative transition-transform"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <img
              src={imageDataUrl}
              alt={currentImage?.name}
              className="max-w-none"
              style={{ imageRendering: zoom > 100 ? 'pixelated' : 'auto' }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No image selected</p>
            <p className="text-xs">Select an image from the queue</p>
          </div>
        )}
      </div>

      {currentImage && (
        <div className="p-2 border-t border-border-default bg-bg-secondary/50">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="truncate max-w-[60%]" title={currentImage.path}>
              {currentImage.path}
            </span>
            <span>
              {currentImageIndex + 1} / {images.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return <div className="fixed inset-0 z-50">{content}</div>;
  }

  return content;
}
