import { BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { isSafeExternalUrl, isTrustedRendererUrl } from '../shared/ipc';

export function createMainWindow(isDev: boolean): BrowserWindow {
  const window = new BrowserWindow({
    width: 1800,
    height: 1000,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#0a0a0a',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (isTrustedRendererUrl(url, isDev)) return;
    event.preventDefault();
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
  });

  if (isDev) {
    void window.loadURL('http://localhost:5173');
    window.webContents.openDevTools();
  } else {
    void window.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return window;
}
