import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  OllamaStatus, 
  OllamaCheck, 
  ImageFile, 
  Preset, 
  LogEntry, 
  HistoryEntry, 
  PanelState,
  ModelOptions,
  SystemInfo 
} from '../types';
import { defaultPresets } from '../utils/presets';

interface AppState {
  // Ollama state
  ollamaCheck: OllamaCheck | null;
  ollamaStatus: OllamaStatus | null;
  selectedModel: string;
  
  // Images
  images: ImageFile[];
  currentImageIndex: number;
  
  // Processing
  isProcessing: boolean;
  shouldAbort: boolean;
  processingProgress: { current: number; total: number } | null;
  
  // Prompt & Options
  currentPrompt: string;
  currentOptions: ModelOptions;
  selectedPreset: string | null;
  presets: Preset[];
  
  // Log
  logs: LogEntry[];
  
  // History
  history: HistoryEntry[];
  
  // Panels
  panels: Record<string, PanelState>;
  
  // System
  systemInfo: SystemInfo | null;
  
  // Settings
  autoSave: boolean;
  outputDirectory: string;
  maxQueueSize: number;
  
  // Actions
  setOllamaCheck: (check: OllamaCheck) => void;
  setOllamaStatus: (status: OllamaStatus) => void;
  setSelectedModel: (model: string) => void;
  
  addImages: (files: { path: string; name: string }[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  clearCompletedImages: () => void;
  updateImage: (id: string, updates: Partial<ImageFile>) => void;
  setCurrentImageIndex: (index: number) => void;
  
  setIsProcessing: (processing: boolean) => void;
  setProcessingProgress: (progress: { current: number; total: number } | null) => void;
  abortProcessing: () => void;
  
  setCurrentPrompt: (prompt: string) => void;
  setCurrentOptions: (options: ModelOptions) => void;
  setSelectedPreset: (presetId: string | null) => void;
  addPreset: (preset: Preset) => void;
  updatePreset: (id: string, updates: Partial<Preset>) => void;
  removePreset: (id: string) => void;
  
  addLog: (level: LogEntry['level'], message: string, details?: string) => void;
  clearLogs: () => void;
  
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  removeHistoryEntry: (id: string) => void;
  
  setPanelState: (id: string, state: Partial<PanelState>) => void;
  
  setSystemInfo: (info: SystemInfo) => void;
  
  setAutoSave: (autoSave: boolean) => void;
  setOutputDirectory: (directory: string) => void;
  
  // Processing actions
  processCurrentImage: () => Promise<void>;
  processQueue: () => Promise<void>;
  
  // Panel actions
  togglePanel: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      ollamaCheck: null,
      ollamaStatus: null,
      selectedModel: 'llava:latest',
      
      images: [],
      currentImageIndex: 0,
      
      isProcessing: false,
      shouldAbort: false,
      processingProgress: null,
      
      currentPrompt: 'Describe this image in detail. Focus on the main subject, colors, composition, and any notable elements.',
      currentOptions: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        num_predict: 1024,
        num_ctx: 4096,
      },
      selectedPreset: null,
      presets: defaultPresets,
      
      logs: [],
      history: [],
      
      panels: {
        models: { id: 'models', visible: true, collapsed: false, order: 0 },
        presets: { id: 'presets', visible: true, collapsed: false, order: 1 },
        queue: { id: 'queue', visible: true, collapsed: false, order: 2 },
        preview: { id: 'preview', visible: true, collapsed: false, order: 3 },
        prompt: { id: 'prompt', visible: true, collapsed: false, order: 4 },
        options: { id: 'options', visible: true, collapsed: false, order: 5 },
        output: { id: 'output', visible: true, collapsed: false, order: 6 },
        log: { id: 'log', visible: true, collapsed: true, order: 7 },
        history: { id: 'history', visible: true, collapsed: true, order: 8 },
      },
      
      systemInfo: null,
      
      autoSave: false,
      outputDirectory: '',
      maxQueueSize: 100,
      
      // Actions
      setOllamaCheck: (check) => set({ ollamaCheck: check }),
      setOllamaStatus: (status) => set({ ollamaStatus: status }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      
      addImages: (files) => set((state) => {
        const newImages: ImageFile[] = files.map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          path: file.path,
          name: file.name,
          status: 'pending' as const,
          addedAt: Date.now(),
        }));
        return {
          images: [...state.images, ...newImages].slice(0, state.maxQueueSize),
        };
      }),
      removeImage: (id) => set((state) => {
        const newImages = state.images.filter((img) => img.id !== id);
        return {
          images: newImages,
          currentImageIndex: Math.min(state.currentImageIndex, Math.max(0, newImages.length - 1)),
        };
      }),
      clearImages: () => set({ images: [], currentImageIndex: 0 }),
      clearCompletedImages: () => set((state) => ({
        images: state.images.filter((img) => img.status !== 'completed'),
        currentImageIndex: 0,
      })),
      updateImage: (id, updates) => set((state) => ({
        images: state.images.map((img) => 
          img.id === id ? { ...img, ...updates } : img
        ),
      })),
      setCurrentImageIndex: (index) => set({ currentImageIndex: index }),
      
      setIsProcessing: (processing) => set({ isProcessing: processing }),
      setProcessingProgress: (progress) => set({ processingProgress: progress }),
      abortProcessing: () => set({ shouldAbort: true }),
      
      setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
      setCurrentOptions: (options) => set({ currentOptions: options }),
      setSelectedPreset: (presetId) => {
        const preset = presetId ? get().presets.find((p) => p.id === presetId) : null;
        if (preset) {
          set({
            selectedPreset: presetId,
            currentPrompt: preset.prompt,
            currentOptions: preset.options,
            selectedModel: preset.model,
          });
        } else {
          set({ selectedPreset: null });
        }
      },
      addPreset: (preset) => set((state) => ({
        presets: [...state.presets, preset],
      })),
      updatePreset: (id, updates) => set((state) => ({
        presets: state.presets.map((p) => p.id === id ? { ...p, ...updates } : p),
      })),
      removePreset: (id) => set((state) => ({
        presets: state.presets.filter((p) => p.id !== id),
        selectedPreset: state.selectedPreset === id ? null : state.selectedPreset,
      })),
      
      addLog: (level, message, details) => set((state) => ({
        logs: [
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            level,
            message,
            details,
          },
          ...state.logs,
        ].slice(0, 500),
      })),
      clearLogs: () => set({ logs: [] }),
      
      addHistoryEntry: (entry) => set((state) => ({
        history: [
          {
            ...entry,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
          },
          ...state.history,
        ].slice(0, 100),
      })),
      clearHistory: () => set({ history: [] }),
      removeHistoryEntry: (id) => set((state) => ({
        history: state.history.filter((h) => h.id !== id),
      })),
      
      setPanelState: (id, state) => set((s) => ({
        panels: {
          ...s.panels,
          [id]: { ...s.panels[id], ...state },
        },
      })),
      
      setSystemInfo: (info) => set({ systemInfo: info }),
      
      setAutoSave: (autoSave) => set({ autoSave }),
      setOutputDirectory: (directory) => set({ outputDirectory: directory }),
      
      // Processing actions
      processCurrentImage: async () => {
        const state = get();
        const image = state.images[state.currentImageIndex];
        if (!image || state.isProcessing) return;
        
        const startTime = Date.now();
        set({ isProcessing: true, shouldAbort: false });
        state.addLog('info', `Processing: ${image.name}`);
        
        try {
          state.updateImage(image.id, { status: 'processing' });
          
          const imageData = await window.api.file.readImage(image.path);
          if (!imageData) {
            throw new Error('Failed to read image file');
          }
          
          const response = await window.api.ollama.generate({
            model: state.selectedModel,
            prompt: state.currentPrompt,
            images: [imageData],
            options: state.currentOptions,
          });
          
          const duration = Date.now() - startTime;
          const result = response.response || '';
          
          state.updateImage(image.id, { 
            status: 'completed', 
            result,
            processedAt: Date.now(),
          });
          
          state.addHistoryEntry({
            imagePath: image.path,
            imageName: image.name,
            model: state.selectedModel,
            preset: state.selectedPreset || undefined,
            prompt: state.currentPrompt,
            result,
            duration,
          });
          
          state.addLog('success', `Completed: ${image.name} (${(duration / 1000).toFixed(1)}s)`);
        } catch (error) {
          state.updateImage(image.id, { status: 'error', error: String(error) });
          state.addLog('error', `Failed: ${image.name}`, String(error));
        } finally {
          set({ isProcessing: false });
        }
      },
      
      processQueue: async () => {
        const state = get();
        const pendingImages = state.images.filter(img => img.status === 'pending');
        if (pendingImages.length === 0 || state.isProcessing) return;
        
        set({ isProcessing: true, shouldAbort: false, processingProgress: { current: 0, total: pendingImages.length } });
        state.addLog('info', `Starting batch processing of ${pendingImages.length} images`);
        
        for (let i = 0; i < pendingImages.length; i++) {
          // Check for abort
          if (get().shouldAbort) {
            state.addLog('warning', `Processing aborted at ${i}/${pendingImages.length}`);
            break;
          }
          
          const image = pendingImages[i];
          const startTime = Date.now();
          set({ processingProgress: { current: i + 1, total: pendingImages.length } });
          
          try {
            state.updateImage(image.id, { status: 'processing' });
            
            const imageData = await window.api.file.readImage(image.path);
            if (!imageData) {
              throw new Error('Failed to read image file');
            }
            
            const response = await window.api.ollama.generate({
              model: get().selectedModel,
              prompt: get().currentPrompt,
              images: [imageData],
              options: get().currentOptions,
            });
            
            const duration = Date.now() - startTime;
            const result = response.response || '';
            
            state.updateImage(image.id, { 
              status: 'completed', 
              result,
              processedAt: Date.now(),
            });
            
            state.addHistoryEntry({
              imagePath: image.path,
              imageName: image.name,
              model: get().selectedModel,
              preset: get().selectedPreset || undefined,
              prompt: get().currentPrompt,
              result,
              duration,
            });
            
            state.addLog('success', `[${i + 1}/${pendingImages.length}] Completed: ${image.name} (${(duration / 1000).toFixed(1)}s)`);
          } catch (error) {
            state.updateImage(image.id, { status: 'error', error: String(error) });
            state.addLog('error', `[${i + 1}/${pendingImages.length}] Failed: ${image.name}`, String(error));
          }
        }
        
        set({ isProcessing: false, shouldAbort: false, processingProgress: null });
        state.addLog('info', 'Batch processing completed');
      },
      
      togglePanel: (id) => set((s) => ({
        panels: {
          ...s.panels,
          [id]: { ...s.panels[id], visible: !s.panels[id]?.visible },
        },
      })),
    }),
    {
      name: 'awful-describer-storage',
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        currentPrompt: state.currentPrompt,
        currentOptions: state.currentOptions,
        selectedPreset: state.selectedPreset,
        presets: state.presets,
        panels: state.panels,
        history: state.history,
        autoSave: state.autoSave,
        outputDirectory: state.outputDirectory,
      }),
    }
  )
);
