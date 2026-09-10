import { dialog, ipcMain, shell, type BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {
  assertNonEmptyString,
  isSafeExternalUrl,
  isTrustedRendererUrl,
  sanitizeGenerateParams,
} from '../../shared/ipc';
import { readImage, searchImages } from '../services/fileService';
import { OllamaService } from '../services/ollamaService';
import { getOllamaPorts, getSystemInfo } from '../services/systemService';

export function registerIpcHandlers(
  getMainWindow: () => BrowserWindow | null,
  trustedRendererUrl: string,
  ollama: OllamaService,
): void {
  const trusted = <T>(handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => T | Promise<T>) => {
    return async (event: IpcMainInvokeEvent, ...args: unknown[]): Promise<T> => {
      const senderFrame = event.senderFrame;
      const senderUrl = senderFrame?.url ?? '';
      if (
        !senderFrame ||
        senderFrame !== event.sender.mainFrame ||
        !isTrustedRendererUrl(senderUrl, trustedRendererUrl)
      ) {
        throw new Error(`Blocked IPC request from untrusted renderer frame: ${senderUrl || 'unknown'}`);
      }
      return handler(event, ...args);
    };
  };

  ipcMain.handle('window:minimize', trusted(() => getMainWindow()?.minimize()));
  ipcMain.handle('window:maximize', trusted(() => {
    const window = getMainWindow();
    if (!window) return;
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
  }));
  ipcMain.handle('window:close', trusted(() => getMainWindow()?.close()));

  ipcMain.handle('ollama:check', trusted(() => ollama.check()));
  ipcMain.handle('ollama:status', trusted(() => ollama.status()));
  ipcMain.handle('ollama:start', trusted(() => ollama.start()));
  ipcMain.handle('ollama:stop', trusted(() => ollama.stopOwned()));
  ipcMain.handle('ollama:pull', trusted(async (_event, rawModel) => {
    const model = assertNonEmptyString(rawModel, 'model');
    return ollama.pull(model, (data) => {
      getMainWindow()?.webContents.send('ollama:pull-progress', { model, data });
    });
  }));
  ipcMain.handle('ollama:delete', trusted((_event, rawModel) => {
    return ollama.delete(assertNonEmptyString(rawModel, 'model'));
  }));
  ipcMain.handle('ollama:generate', trusted((_event, rawParams) => {
    return ollama.generate(sanitizeGenerateParams(rawParams));
  }));
  ipcMain.handle('ollama:cancel', trusted((_event, rawRequestId) => {
    const requestId = assertNonEmptyString(rawRequestId, 'requestId');
    return { success: ollama.cancel(requestId) };
  }));

  ipcMain.handle('file:select-images', trusted(async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif'] }],
    });
    return result.canceled ? [] : result.filePaths;
  }));
  ipcMain.handle('file:select-folder', trusted(async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  }));
  ipcMain.handle('file:read-image', trusted((_event, rawPath) => {
    return readImage(assertNonEmptyString(rawPath, 'image path'));
  }));
  ipcMain.handle('file:save-result', trusted(async (_event, rawContent, rawDefaultName) => {
    if (typeof rawContent !== 'string') throw new Error('Invalid result content');
    const defaultName = path.basename(assertNonEmptyString(rawDefaultName, 'default filename'));
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [
        { name: 'Text', extensions: ['txt'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'Markdown', extensions: ['md'] },
      ],
    });
    if (!result.filePath) return null;
    await fs.promises.writeFile(result.filePath, rawContent, 'utf8');
    return result.filePath;
  }));
  ipcMain.handle('file:search', trusted((_event, rawDirectory, rawPattern) => {
    const directory = assertNonEmptyString(rawDirectory, 'search directory');
    if (typeof rawPattern !== 'string' || rawPattern.includes('\0') || rawPattern.length > 1024) {
      throw new Error('Invalid search pattern');
    }
    return searchImages(directory, rawPattern);
  }));

  ipcMain.handle('system:info', trusted(() => getSystemInfo()));
  ipcMain.handle('system:ports', trusted(() => getOllamaPorts()));

  ipcMain.handle('shell:open-path', trusted((_event, rawPath) => {
    shell.showItemInFolder(assertNonEmptyString(rawPath, 'path'));
  }));
  ipcMain.handle('shell:open-url', trusted(async (_event, rawUrl) => {
    const url = assertNonEmptyString(rawUrl, 'URL');
    if (!isSafeExternalUrl(url)) throw new Error('Only HTTPS external URLs are allowed');
    await shell.openExternal(url);
  }));
}
