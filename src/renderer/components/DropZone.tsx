import { useState, useCallback, type ReactNode } from 'react';
import { useStore } from '../stores/appStore';

interface DropZoneProps {
  children: ReactNode;
}

export default function DropZone({ children }: DropZoneProps) {
  const { addImages, addLog } = useStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      /\.(jpg|jpeg|png|gif|webp|bmp|tiff?)$/i.test(file.name)
    );

    if (imageFiles.length === 0) {
      addLog('warning', 'No valid image files dropped');
      return;
    }

    addLog('info', `Processing ${imageFiles.length} dropped file(s)...`);

    // In Electron, dropped files have a .path property
    const newImages = imageFiles.map(file => ({
      name: file.name,
      path: (file as any).path || file.name,
    }));

    addImages(newImages);
    addLog('success', `Added ${imageFiles.length} image(s) to queue`);
  }, [addImages, addLog]);

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-primary/90 border-2 border-dashed border-accent-primary pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-accent-primary animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-medium text-accent-primary">Drop Images Here</p>
              <p className="text-sm text-text-muted mt-1">JPG, PNG, GIF, WebP, BMP, TIFF</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
