import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { spawn, exec, ChildProcess } from 'child_process';
import * as os from 'os';

let mainWindow: BrowserWindow | null = null;
let ollamaProcess: ChildProcess | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
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
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (ollamaProcess) {
    ollamaProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());

// Ollama detection and management
ipcMain.handle('ollama:check', async () => {
  return new Promise((resolve) => {
    // Check in common installation paths first
    const commonPaths = [
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Ollama', 'ollama.exe'),
      'C:\\Program Files\\Ollama\\ollama.exe',
      'C:\\Program Files (x86)\\Ollama\\ollama.exe',
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        resolve({ installed: true, path: p });
        return;
      }
    }

    // Fall back to PATH check
    exec('where ollama', (error, stdout) => {
      if (error) {
        resolve({ installed: false, path: null });
      } else {
        const foundPath = stdout.trim().split(/\r?\n/)[0];
        resolve({ installed: true, path: foundPath });
      }
    });
  });
});

ipcMain.handle('ollama:status', async () => {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:11434/api/tags', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ running: true, models: parsed.models || [] });
        } catch {
          resolve({ running: true, models: [] });
        }
      });
    });
    req.on('error', () => resolve({ running: false, models: [] }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ running: false, models: [] });
    });
  });
});

ipcMain.handle('ollama:start', async () => {
  return new Promise((resolve) => {
    // First check if Ollama is already running
    const checkReq = http.get('http://127.0.0.1:11434/api/tags', (res) => {
      if (res.statusCode === 200) {
        resolve({ success: true, message: 'Already running' });
      }
    });
    checkReq.on('error', async () => {
      // Not running, try to start
      if (ollamaProcess) {
        resolve({ success: true, message: 'Process exists' });
        return;
      }

      try {
        // Try to find ollama executable
        const possiblePaths = [
          path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe'),
          'ollama',
        ];

        let ollamaPath = 'ollama';
        for (const p of possiblePaths) {
          if (p.includes(path.sep) && fs.existsSync(p)) {
            ollamaPath = p;
            break;
          }
        }

        ollamaProcess = spawn(ollamaPath, ['serve'], {
          detached: false,
          stdio: 'pipe',
          windowsHide: true,
        });

        ollamaProcess.on('error', (err) => {
          ollamaProcess = null;
          resolve({ success: false, message: err.message });
        });

        ollamaProcess.on('exit', (code) => {
          ollamaProcess = null;
          if (code !== 0) {
            mainWindow?.webContents.send('ollama:exited', { code });
          }
        });

        // Wait for server to be ready
        let attempts = 0;
        const checkReady = () => {
          attempts++;
          const req = http.get('http://127.0.0.1:11434/api/tags', (res) => {
            if (res.statusCode === 200) {
              resolve({ success: true, message: 'Started' });
            } else if (attempts < 10) {
              setTimeout(checkReady, 500);
            } else {
              resolve({ success: false, message: 'Timeout waiting for server' });
            }
          });
          req.on('error', () => {
            if (attempts < 10) {
              setTimeout(checkReady, 500);
            } else {
              resolve({ success: false, message: 'Timeout waiting for server' });
            }
          });
          req.setTimeout(1000, () => {
            req.destroy();
            if (attempts < 10) {
              setTimeout(checkReady, 500);
            }
          });
        };

        setTimeout(checkReady, 1000);
      } catch (err) {
        resolve({ success: false, message: String(err) });
      }
    });
    checkReq.setTimeout(2000, () => {
      checkReq.destroy();
    });
  });
});

ipcMain.handle('ollama:stop', async () => {
  return new Promise((resolve) => {
    // Kill any ollama processes
    exec('taskkill /IM ollama.exe /F', (error) => {
      ollamaProcess = null;
      // Also try to kill ollama_llama_server if running
      exec('taskkill /IM ollama_llama_server.exe /F', () => {
        resolve({ success: !error });
      });
    });
  });
});

ipcMain.handle('ollama:pull', async (_, modelName: string) => {
  return new Promise((resolve, reject) => {
    const child = spawn('ollama', ['pull', modelName], { 
      stdio: 'pipe',
      windowsHide: true,
    });
    
    let output = '';
    
    child.stdout?.on('data', (data) => {
      output += data.toString();
      mainWindow?.webContents.send('ollama:pull-progress', {
        model: modelName,
        data: data.toString(),
      });
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      output += text;
      mainWindow?.webContents.send('ollama:pull-progress', {
        model: modelName,
        data: text,
      });
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        reject(new Error(`Pull failed with code ${code}: ${output}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start pull: ${err.message}`));
    });
  });
});

ipcMain.handle('ollama:delete', async (_, modelName: string) => {
  return new Promise((resolve) => {
    // Properly escape model name for shell
    const safeModelName = modelName.replace(/"/g, '\\"');
    exec(`ollama rm "${safeModelName}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Delete error:', stderr);
      }
      resolve({ success: !error });
    });
  });
});

ipcMain.handle('ollama:generate', async (_, params: {
  model: string;
  prompt: string;
  images?: string[];
  options?: Record<string, unknown>;
}) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      images: params.images,
      stream: false,
      options: params.options || {},
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 600000, // 10 minutes timeout for large models
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Invalid response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout - model may be loading or response is too slow'));
    });

    req.write(body);
    req.end();
  });
});

// File operations
ipcMain.handle('file:select-images', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif'] },
    ],
  });
  return result.filePaths;
});

ipcMain.handle('file:select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('file:read-image', async (_, filePath: string) => {
  try {
    // Validate file exists and is readable
    await fs.promises.access(filePath, fs.constants.R_OK);
    
    const stats = await fs.promises.stat(filePath);
    // Limit file size to 50MB
    if (stats.size > 50 * 1024 * 1024) {
      throw new Error('Image file too large (max 50MB)');
    }
    
    const data = await fs.promises.readFile(filePath);
    return data.toString('base64');
  } catch (err) {
    console.error('Error reading image:', err);
    return null;
  }
});

ipcMain.handle('file:save-result', async (_, content: string, defaultName: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [
      { name: 'Text', extensions: ['txt'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Markdown', extensions: ['md'] },
    ],
  });
  
  if (result.filePath) {
    await fs.promises.writeFile(result.filePath, content, 'utf-8');
    return result.filePath;
  }
  return null;
});

ipcMain.handle('file:search', async (_, directory: string, pattern: string) => {
  const results: string[] = [];
  const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif']);
  const lowerPattern = pattern.toLowerCase();
  
  const searchDir = async (dir: string, depth: number = 0): Promise<void> => {
    if (depth > 5 || results.length >= 100) return;
    
    try {
      const items = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (results.length >= 100) break;
        
        const fullPath = path.join(dir, item.name);
        
        try {
          if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            await searchDir(fullPath, depth + 1);
          } else if (item.isFile()) {
            const ext = path.extname(item.name).toLowerCase();
            if (imageExtensions.has(ext) && item.name.toLowerCase().includes(lowerPattern)) {
              results.push(fullPath);
            }
          }
        } catch {
          // Skip inaccessible items
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  };
  
  await searchDir(directory);
  return results;
});

// System info - Windows compatible
ipcMain.handle('system:info', async () => {
  try {
    // Get CPU usage via wmic on Windows
    const getCpuUsage = (): Promise<number> => {
      return new Promise((resolve) => {
        if (process.platform === 'win32') {
          exec('wmic cpu get loadpercentage /value', (error, stdout) => {
            if (error) {
              resolve(0);
              return;
            }
            const match = stdout.match(/LoadPercentage=(\d+)/);
            resolve(match ? parseInt(match[1], 10) : 0);
          });
        } else {
          // Linux/Mac - use load average
          const load = os.loadavg()[0];
          const cpus = os.cpus().length;
          resolve(Math.min(100, (load / cpus) * 100));
        }
      });
    };

    const cpuUsage = await getCpuUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    return {
      cpu: cpuUsage,
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        percent: ((totalMem - freeMem) / totalMem * 100).toFixed(1),
      },
      platform: os.platform(),
      arch: os.arch(),
    };
  } catch (err) {
    console.error('Error getting system info:', err);
    return {
      cpu: 0,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percent: '0',
      },
      platform: os.platform(),
      arch: os.arch(),
    };
  }
});

ipcMain.handle('system:ports', async () => {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' 
      ? 'netstat -ano | findstr :11434'
      : 'netstat -tlnp 2>/dev/null | grep :11434';
      
    exec(command, (_, stdout) => {
      const lines = stdout?.trim().split(/\r?\n/).filter(Boolean) || [];
      resolve(lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          local: parts[1] || '',
          foreign: parts[2] || '',
          state: parts[3] || '',
          pid: parts[4] || '',
        };
      }));
    });
  });
});

// Shell operations
ipcMain.handle('shell:open-path', async (_, filePath: string) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('shell:open-url', async (_, url: string) => {
  shell.openExternal(url);
});

// Download Ollama installer with proper redirect handling
ipcMain.handle('ollama:download-installer', async () => {
  const downloadUrl = 'https://ollama.com/download/OllamaSetup.exe';
  const downloadPath = path.join(app.getPath('temp'), 'OllamaSetup.exe');
  
  const downloadWithRedirects = (url: string, redirectCount: number = 0): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }

      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
          const redirectUrl = response.headers.location;
          if (!redirectUrl) {
            reject(new Error('Redirect without location header'));
            return;
          }
          // Handle relative redirects
          const fullUrl = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, url).toString();
          downloadWithRedirects(fullUrl, redirectCount + 1).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }

        const total = parseInt(response.headers['content-length'] || '0', 10);
        let downloaded = 0;
        
        const file = fs.createWriteStream(downloadPath);
        
        response.on('data', (chunk) => {
          downloaded += chunk.length;
          mainWindow?.webContents.send('ollama:download-progress', {
            downloaded,
            total,
            percent: total ? parseFloat((downloaded / total * 100).toFixed(1)) : 0,
          });
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve(downloadPath);
        });
        
        file.on('error', (err) => {
          fs.unlink(downloadPath, () => {});
          reject(err);
        });
      }).on('error', reject);
    });
  };

  return downloadWithRedirects(downloadUrl);
});

ipcMain.handle('ollama:run-installer', async (_, installerPath: string) => {
  return new Promise((resolve) => {
    // Run installer with elevation on Windows
    exec(`start "" "${installerPath}"`, (error) => {
      resolve({ success: !error });
    });
  });
});

// Get Ollama models directory
ipcMain.handle('ollama:models-path', async () => {
  const ollamaModelsPath = path.join(os.homedir(), '.ollama', 'models');
  const exists = fs.existsSync(ollamaModelsPath);
  
  let size = 0;
  if (exists) {
    try {
      const getSize = (dir: string): number => {
        let total = 0;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            total += getSize(fullPath);
          } else {
            total += fs.statSync(fullPath).size;
          }
        }
        return total;
      };
      size = getSize(ollamaModelsPath);
    } catch {}
  }
  
  return {
    path: ollamaModelsPath,
    exists,
    size,
  };
});
