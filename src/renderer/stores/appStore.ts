import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  HistoryEntry,
  ImageFile,
  LogEntry,
  ModelOptions,
  OllamaCheck,
  OllamaStatus,
  PanelState,
  Preset,
  SystemInfo,
} from '../types';
import { defaultPresets } from '../utils/presets';

function createRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function isCancellation(error: unknown): boolean {
  return /cancel/i.test(String(error));
}

interface AppState {
  ollamaCheck: OllamaCheck | null;
  ollamaStatus: OllamaStatus | null;
  selectedModel: string;

  images: ImageFile[];
  currentImageIndex: number;

  isProcessing: boolean;
  shouldAbort: boolean;
  activeRequestId: string | null;
  processingProgress: { current: number; total: number } | null;

  currentPrompt: string;
  currentOptions: ModelOptions;
  selectedPreset: string | null;
  presets: Preset[];

  logs: LogEntry[];
  history: HistoryEntry[];
  panels: Record<string, PanelState>;
  systemInfo: SystemInfo | null;

  autoSave: boolean;
  outputDirectory: string;
  maxQueueSize: number;

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
  abortProcessing: () => Promise<void>;

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

  processCurrentImage: () => Promise<void>;
  processQueue: () => Promise<void>;
  togglePanel: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ollamaCheck: null,
      ollamaStatus: null,
      selectedModel: 'llava:latest',

      images: [],
      currentImageIndex: 0,

      isProcessing: false,
      shouldAbort: false,
      activeRequestId: null,
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

      setOllamaCheck: (check) => set({ ollamaCheck: check }),
      setOllamaStatus: (status) => set({ ollamaStatus: status }),
      setSelectedModel: (model) => set({ selectedModel: model }),

      addImages: (files) => set((state) => {
        const newImages: ImageFile[] = files.map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          path: file.path,
          name: file.name,
          status: 'pending',
          addedAt: Date.now(),
        }));
        return { images: [...state.images, ...newImages].slice(0, state.maxQueueSize) };
      }),
      removeImage: (id) => set((state) => {
        const images = state.images.filter((image) => image.id !== id);
        return {
          images,
          currentImageIndex: Math.min(state.currentImageIndex, Math.max(0, images.length - 1)),
        };
      }),
      clearImages: () => set({ images: [], currentImageIndex: 0 }),
      clearCompletedImages: () => set((state) => ({
        images: state.images.filter((image) => image.status !== 'completed'),
        currentImageIndex: 0,
      })),
      updateImage: (id, updates) => set((state) => ({
        images: state.images.map((image) => image.id === id ? { ...image, ...updates } : image),
      })),
      setCurrentImageIndex: (index) => set({ currentImageIndex: index }),

      setIsProcessing: (processing) => set({ isProcessing: processing }),
      setProcessingProgress: (progress) => set({ processingProgress: progress }),
      abortProcessing: async () => {
        const { activeRequestId, isProcessing, addLog } = get();
        if (!isProcessing) return;
        set({ shouldAbort: true });
        if (activeRequestId) {
          const result = await window.api.ollama.cancel(activeRequestId).catch(() => ({ success: false }));
          addLog(result.success ? 'warning' : 'info', result.success ? 'Cancellation requested' : 'Stopping after current request');
        }
      },

      setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
      setCurrentOptions: (options) => set({ currentOptions: options }),
      setSelectedPreset: (presetId) => {
        const preset = presetId ? get().presets.find((item) => item.id === presetId) : null;
        if (preset) {
          set({
            selectedPreset: presetId,
            currentPrompt: preset.prompt,
            currentOptions: { ...preset.options },
            selectedModel: preset.model,
          });
        } else {
          set({ selectedPreset: null });
        }
      },
      addPreset: (preset) => set((state) => ({ presets: [...state.presets, preset] })),
      updatePreset: (id, updates) => set((state) => ({
        presets: state.presets.map((preset) => preset.id === id ? { ...preset, ...updates } : preset),
      })),
      removePreset: (id) => set((state) => ({
        presets: state.presets.filter((preset) => preset.id !== id),
        selectedPreset: state.selectedPreset === id ? null : state.selectedPreset,
      })),

      addLog: (level, message, details) => set((state) => ({
        logs: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
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
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            timestamp: Date.now(),
          },
          ...state.history,
        ].slice(0, 100),
      })),
      clearHistory: () => set({ history: [] }),
      removeHistoryEntry: (id) => set((state) => ({
        history: state.history.filter((entry) => entry.id !== id),
      })),

      setPanelState: (id, panelState) => set((state) => ({
        panels: {
          ...state.panels,
          [id]: { ...state.panels[id], ...panelState },
        },
      })),

      setSystemInfo: (info) => set({ systemInfo: info }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setOutputDirectory: (directory) => set({ outputDirectory: directory }),

      processCurrentImage: async () => {
        const state = get();
        const image = state.images[state.currentImageIndex];
        if (!image || state.isProcessing) return;

        const model = state.selectedModel;
        const prompt = state.currentPrompt;
        const options = { ...state.currentOptions };
        const preset = state.selectedPreset;
        const startTime = Date.now();
        const requestId = createRequestId();

        set({ isProcessing: true, shouldAbort: false, activeRequestId: null });
        state.addLog('info', `Processing: ${image.name}`);

        try {
          state.updateImage(image.id, { status: 'processing', error: undefined });
          const imageData = await window.api.file.readImage(image.path);
          if (!imageData) throw new Error('Failed to read image file');
          if (get().shouldAbort) throw new Error('Request cancelled');

          set({ activeRequestId: requestId });
          const response = await window.api.ollama.generate({
            requestId,
            model,
            prompt,
            images: [imageData.base64],
            options,
          });

          const duration = Date.now() - startTime;
          const result = response.response || '';
          state.updateImage(image.id, { status: 'completed', result, processedAt: Date.now(), error: undefined });
          state.addHistoryEntry({
            imagePath: image.path,
            imageName: image.name,
            model,
            preset: preset || undefined,
            prompt,
            result,
            duration,
          });
          state.addLog('success', `Completed: ${image.name} (${(duration / 1000).toFixed(1)}s)`);
        } catch (error) {
          if (get().shouldAbort || isCancellation(error)) {
            state.updateImage(image.id, { status: 'pending', error: undefined });
            state.addLog('warning', `Cancelled: ${image.name}`);
          } else {
            state.updateImage(image.id, { status: 'error', error: String(error) });
            state.addLog('error', `Failed: ${image.name}`, String(error));
          }
        } finally {
          set({ isProcessing: false, shouldAbort: false, activeRequestId: null });
        }
      },

      processQueue: async () => {
        const state = get();
        const pendingImages = state.images.filter((image) => image.status === 'pending');
        if (pendingImages.length === 0 || state.isProcessing) return;

        const model = state.selectedModel;
        const prompt = state.currentPrompt;
        const options = { ...state.currentOptions };
        const preset = state.selectedPreset;
        let aborted = false;

        set({
          isProcessing: true,
          shouldAbort: false,
          activeRequestId: null,
          processingProgress: { current: 0, total: pendingImages.length },
        });
        state.addLog('info', `Starting batch processing of ${pendingImages.length} images`);

        for (let index = 0; index < pendingImages.length; index += 1) {
          if (get().shouldAbort) {
            aborted = true;
            break;
          }

          const image = pendingImages[index];
          const startTime = Date.now();
          const requestId = createRequestId();
          set({ processingProgress: { current: index + 1, total: pendingImages.length } });

          try {
            state.updateImage(image.id, { status: 'processing', error: undefined });
            const imageData = await window.api.file.readImage(image.path);
            if (!imageData) throw new Error('Failed to read image file');
            if (get().shouldAbort) throw new Error('Request cancelled');

            set({ activeRequestId: requestId });
            const response = await window.api.ollama.generate({
              requestId,
              model,
              prompt,
              images: [imageData.base64],
              options,
            });

            const duration = Date.now() - startTime;
            const result = response.response || '';
            state.updateImage(image.id, { status: 'completed', result, processedAt: Date.now(), error: undefined });
            state.addHistoryEntry({
              imagePath: image.path,
              imageName: image.name,
              model,
              preset: preset || undefined,
              prompt,
              result,
              duration,
            });
            state.addLog('success', `[${index + 1}/${pendingImages.length}] Completed: ${image.name} (${(duration / 1000).toFixed(1)}s)`);
          } catch (error) {
            if (get().shouldAbort || isCancellation(error)) {
              state.updateImage(image.id, { status: 'pending', error: undefined });
              aborted = true;
              break;
            }
            state.updateImage(image.id, { status: 'error', error: String(error) });
            state.addLog('error', `[${index + 1}/${pendingImages.length}] Failed: ${image.name}`, String(error));
          } finally {
            if (get().activeRequestId === requestId) set({ activeRequestId: null });
          }
        }

        set({ isProcessing: false, shouldAbort: false, activeRequestId: null, processingProgress: null });
        state.addLog(aborted ? 'warning' : 'info', aborted ? 'Batch processing aborted' : 'Batch processing completed');
      },

      togglePanel: (id) => set((state) => {
        const current = state.panels[id];
        if (!current) return state;
        return {
          panels: {
            ...state.panels,
            [id]: { ...current, visible: !current.visible },
          },
        };
      }),
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
    },
  ),
);
