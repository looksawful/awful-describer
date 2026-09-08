import { app, ipcMain, shell, type BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { assertNonEmptyString, isTrustedRendererUrl } from '../../shared/ipc';
import { downloadOllamaInstaller } from '../services/installerService';

export function registerInstallerHandlers(
  getMainWindow: () => BrowserWindow | null,
  trustedRendererUrl: string,
): void {
  let downloadedInstallerPath: string | null = null;

  const assertTrustedSender = (event: IpcMainInvokeEvent): void => {
    const senderFrame = event.senderFrame;
    const senderUrl = senderFrame?.url ?? '';
    if (
      !senderFrame ||
      senderFrame !== event.sender.mainFrame ||
      !isTrustedRendererUrl(senderUrl, trustedRendererUrl)
    ) {
      throw new Error(`Blocked installer IPC request from untrusted renderer frame: ${senderUrl || 'unknown'}`);
    }
  };

  ipcMain.handle('ollama:download-installer', async (event) => {
    assertTrustedSender(event);
    downloadedInstallerPath = await downloadOllamaInstaller(app.getPath('temp'), (progress) => {
      getMainWindow()?.webContents.send('ollama:download-progress', progress);
    });
    return downloadedInstallerPath;
  });

  ipcMain.handle('ollama:run-installer', async (event, rawInstallerPath: unknown) => {
    assertTrustedSender(event);
    const installerPath = assertNonEmptyString(rawInstallerPath, 'installer path');
    if (!downloadedInstallerPath || path.resolve(installerPath) !== path.resolve(downloadedInstallerPath)) {
      return { success: false, message: 'Installer path was not created by this application session' };
    }
    try {
      const stats = await fs.promises.stat(installerPath);
      if (!stats.isFile()) return { success: false, message: 'Installer file not found' };
    } catch {
      return { success: false, message: 'Installer file not found' };
    }

    const error = await shell.openPath(installerPath);
    return error ? { success: false, message: error } : { success: true };
  });
}
