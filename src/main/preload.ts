import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { ApiBridge, GenerateParams } from '../shared/ipc';

function subscribe<T>(channel: string, callback: (data: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api: ApiBridge = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  ollama: {
    check: () => ipcRenderer.invoke('ollama:check'),
    status: () => ipcRenderer.invoke('ollama:status'),
    start: () => ipcRenderer.invoke('ollama:start'),
    stop: () => ipcRenderer.invoke('ollama:stop'),
    pull: (model: string) => ipcRenderer.invoke('ollama:pull', model),
    delete: (model: string) => ipcRenderer.invoke('ollama:delete', model),
    generate: (params: GenerateParams) => ipcRenderer.invoke('ollama:generate', params),
    cancel: (requestId: string) => ipcRenderer.invoke('ollama:cancel', requestId),
    downloadInstaller: () => ipcRenderer.invoke('ollama:download-installer'),
    runInstaller: (installerPath: string) => ipcRenderer.invoke('ollama:run-installer', installerPath),
    onPullProgress: (callback) => subscribe('ollama:pull-progress', callback),
    onDownloadProgress: (callback) => subscribe('ollama:download-progress', callback),
  },
  file: {
    selectImages: () => ipcRenderer.invoke('file:select-images'),
    selectFolder: () => ipcRenderer.invoke('file:select-folder'),
    readImage: (filePath: string) => ipcRenderer.invoke('file:read-image', filePath),
    saveResult: (content: string, defaultName: string) => ipcRenderer.invoke('file:save-result', content, defaultName),
    search: (directory: string, pattern: string) => ipcRenderer.invoke('file:search', directory, pattern),
  },
  system: {
    info: () => ipcRenderer.invoke('system:info'),
    ports: () => ipcRenderer.invoke('system:ports'),
  },
  shell: {
    openPath: (filePath: string) => ipcRenderer.invoke('shell:open-path', filePath),
    openUrl: (url: string) => ipcRenderer.invoke('shell:open-url', url),
  },
};

contextBridge.exposeInMainWorld('api', api);
