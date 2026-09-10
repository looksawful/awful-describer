import assert from 'node:assert/strict';
import * as path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';

const SMOKE_TIMEOUT_MS = 15000;

async function runSmokeTest(): Promise<void> {
  await app.whenReady();

  ipcMain.handle('ollama:check', () => ({ installed: false, path: null }));
  ipcMain.handle('ollama:status', () => ({ running: false, models: [] }));
  ipcMain.handle('system:info', () => ({
    cpu: 0,
    memory: { total: 1, free: 1, used: 0, percent: '0' },
    platform: process.platform,
    arch: process.arch,
  }));

  const repositoryRoot = process.cwd();
  const preloadPath = path.join(repositoryRoot, 'dist', 'main', 'preload.js');
  const rendererPath = path.join(repositoryRoot, 'dist', 'renderer', 'index.html');

  const window = new BrowserWindow({
    show: false,
    width: 1200,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      preload: preloadPath,
    },
  });

  const timeout = new Promise<never>((_resolve, reject) => {
    setTimeout(() => reject(new Error(`Electron smoke test timed out after ${SMOKE_TIMEOUT_MS}ms`)), SMOKE_TIMEOUT_MS);
  });

  await Promise.race([window.loadFile(rendererPath), timeout]);

  const state = await Promise.race([
    window.webContents.executeJavaScript(`(() => ({
      rootChildren: document.getElementById('root')?.childElementCount ?? 0,
      apiType: typeof window.api,
      checkType: typeof window.api?.ollama?.check,
      readImageType: typeof window.api?.file?.readImage,
      systemInfoType: typeof window.api?.system?.info
    }))()`),
    timeout,
  ]) as {
    rootChildren: number;
    apiType: string;
    checkType: string;
    readImageType: string;
    systemInfoType: string;
  };

  assert.ok(state.rootChildren > 0, 'React renderer did not mount into #root');
  assert.equal(state.apiType, 'object', 'preload did not expose window.api');
  assert.equal(state.checkType, 'function', 'Ollama bridge is missing');
  assert.equal(state.readImageType, 'function', 'file bridge is missing');
  assert.equal(state.systemInfoType, 'function', 'system bridge is missing');

  window.destroy();
  console.log('ELECTRON_SMOKE_OK');
  app.quit();
}

void runSmokeTest().catch((error: unknown) => {
  console.error(error);
  app.exit(1);
});
