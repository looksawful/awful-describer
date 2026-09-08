import { app, type BrowserWindow } from 'electron';
import { registerInstallerHandlers } from './ipc/registerInstallerHandlers';
import { registerIpcHandlers } from './ipc/registerIpcHandlers';
import { OllamaService } from './services/ollamaService';
import { createMainWindow } from './window';

let mainWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged;
const ollama = new OllamaService();

function openWindow(): void {
  mainWindow = createMainWindow(isDev);
  mainWindow.once('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  openWindow();
  registerIpcHandlers(() => mainWindow, isDev, ollama);
  registerInstallerHandlers(() => mainWindow, isDev);
});

app.on('window-all-closed', () => {
  void ollama.stopOwned();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) openWindow();
});
