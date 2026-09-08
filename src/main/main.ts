import { app, type BrowserWindow } from 'electron';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { registerInstallerHandlers } from './ipc/registerInstallerHandlers';
import { registerIpcHandlers } from './ipc/registerIpcHandlers';
import { OllamaService } from './services/ollamaService';
import { createMainWindow } from './window';

let mainWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged;
const trustedRendererUrl = isDev
  ? 'http://localhost:5173/'
  : pathToFileURL(path.join(__dirname, '../renderer/index.html')).toString();
const ollama = new OllamaService();

function openWindow(): void {
  mainWindow = createMainWindow(isDev, trustedRendererUrl);
  mainWindow.once('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  openWindow();
  registerIpcHandlers(() => mainWindow, trustedRendererUrl, ollama);
  registerInstallerHandlers(() => mainWindow, trustedRendererUrl);
});

app.on('window-all-closed', () => {
  void ollama.stopOwned();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) openWindow();
});
