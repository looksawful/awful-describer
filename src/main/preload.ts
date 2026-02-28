import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // Ollama
  ollama: {
    check: () => ipcRenderer.invoke('ollama:check'),
    status: () => ipcRenderer.invoke('ollama:status'),
    start: () => ipcRenderer.invoke('ollama:start'),
    stop: () => ipcRenderer.invoke('ollama:stop'),
    pull: (model: string) => ipcRenderer.invoke('ollama:pull', model),
    delete: (model: string) => ipcRenderer.invoke('ollama:delete', model),
    generate: (params: {
      model: string;
      prompt: string;
      images?: string[];
      options?: Record<string, unknown>;
    }) => ipcRenderer.invoke('ollama:generate', params),
    downloadInstaller: () => ipcRenderer.invoke('ollama:download-installer'),
    runInstaller: (path: string) => ipcRenderer.invoke('ollama:run-installer', path),
    onPullProgress: (callback: (data: { model: string; data: string }) => void) => {
      ipcRenderer.on('ollama:pull-progress', (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('ollama:pull-progress');
    },
    onDownloadProgress: (callback: (data: { downloaded: number; total: number; percent: number }) => void) => {
      ipcRenderer.on('ollama:download-progress', (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('ollama:download-progress');
    },
  },

  // Files
  file: {
    selectImages: () => ipcRenderer.invoke('file:select-images'),
    selectFolder: () => ipcRenderer.invoke('file:select-folder'),
    readImage: (path: string) => ipcRenderer.invoke('file:read-image', path),
    saveResult: (content: string, defaultName: string) => 
      ipcRenderer.invoke('file:save-result', content, defaultName),
    search: (directory: string, pattern: string) => 
      ipcRenderer.invoke('file:search', directory, pattern),
  },

  // System
  system: {
    info: () => ipcRenderer.invoke('system:info'),
    ports: () => ipcRenderer.invoke('system:ports'),
  },

  // Shell
  shell: {
    openPath: (path: string) => ipcRenderer.invoke('shell:open-path', path),
    openUrl: (url: string) => ipcRenderer.invoke('shell:open-url', url),
  },
});
