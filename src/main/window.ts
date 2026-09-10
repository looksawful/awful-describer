import { BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { isSafeExternalUrl, isTrustedRendererUrl } from '../shared/ipc';

export function createMainWindow(isDev: boolean, trustedRendererUrl: string): BrowserWindow {
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
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  window.webContents.session.setPermissionCheckHandler(() => false);
  window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  window.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (isTrustedRendererUrl(url, trustedRendererUrl)) return;
    event.preventDefault();
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
  });

  void window.loadURL(trustedRendererUrl);
  if (isDev) window.webContents.openDevTools();

  return window;
}
