import { useStore } from '../stores/appStore';
import type { ImageFile } from '../types';

export default function QueuePanel() {
  const { 
    images, 
    currentImageIndex, 
    setCurrentImageIndex, 
    removeImage, 
    clearImages,
    clearCompletedImages,
    addImages,
    addLog,
  } = useStore();

  const handleSelectImages = async () => {
    const paths = await window.api.file.selectImages();
    if (paths.length > 0) {
      addLog('info', `Selected ${paths.length} images`);
      const files = paths.map((filePath) => ({
        path: filePath,
        name: filePath.split(/[/\\]/).pop() || 'Unknown',
      }));
      addImages(files);
    }
  };

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-2 h-2 rounded-full bg-text-muted" />;
      case 'processing':
        return <div className="w-2 h-2 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <div className="w-2 h-2 rounded-full bg-status-success" />;
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-status-error" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header">
        <span className="text-sm font-medium">Queue</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSelectImages}
            className="p-1 hover:bg-bg-tertiary rounded"
            title="Add images (Ctrl+O)"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {images.length > 0 && (
            <>
              {images.some(i => i.status === 'completed') && (
                <button
                  onClick={clearCompletedImages}
                  className="p-1 hover:bg-bg-tertiary rounded"
                  title="Clear completed"
                >
                  <svg className="w-4 h-4 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
              <button
                onClick={clearImages}
                className="p-1 hover:bg-status-error/20 rounded"
                title="Clear queue"
              >
                <svg className="w-4 h-4 text-text-secondary hover:text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <svg className="w-12 h-12 text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-text-muted">No images</p>
            <p className="text-xs text-text-muted mt-1">Drop images here or click +</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {images.map((image, index) => (
              <div
                key={image.id}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors group ${
                  currentImageIndex === index 
                    ? 'bg-accent-primary/20 border border-accent-primary/30' 
                    : 'hover:bg-bg-tertiary'
                }`}
              >
                {getStatusIcon(image.status)}
                <span className="flex-1 text-sm truncate" title={image.path}>
                  {image.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-status-error/20 rounded transition-all"
                >
                  <svg className="w-3 h-3 text-text-muted hover:text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="p-2 border-t border-border-default">
          <div className="text-xs text-text-muted text-center">
            {images.filter(i => i.status === 'completed').length}/{images.length} completed
          </div>
        </div>
      )}
    </div>
  );
}
