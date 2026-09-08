import { spawn, type ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import type { GenerateParams, GenerateResponse, OllamaCheck, OllamaModel, OllamaStatus } from '../../shared/ipc';

const HOSTNAME = '127.0.0.1';
const PORT = 11434;

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export class OllamaService {
  private ownedProcess: ChildProcess | null = null;
  private executablePath: string | null = null;
  private readonly activeRequests = new Map<string, http.ClientRequest>();

  async check(): Promise<OllamaCheck> {
    const executable = await this.resolveExecutable();
    return { installed: executable !== null, path: executable };
  }

  async status(timeoutMs = 3000): Promise<OllamaStatus> {
    try {
      const result = await this.getJson<{ models?: OllamaModel[] }>('/api/tags', timeoutMs);
      return {
        running: result.statusCode === 200,
        models: result.statusCode === 200 && Array.isArray(result.body.models) ? result.body.models : [],
      };
    } catch {
      return { running: false, models: [] };
    }
  }

  async start(): Promise<{ success: boolean; message?: string }> {
    if ((await this.status(1500)).running) return { success: true, message: 'Already running' };
    if (this.ownedProcess) return { success: true, message: 'Process exists' };

    const executable = await this.resolveExecutable();
    if (!executable) return { success: false, message: 'Ollama executable not found' };

    const child = spawn(executable, ['serve'], {
      detached: false,
      stdio: 'ignore',
      windowsHide: true,
      shell: false,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        child.once('spawn', resolve);
        child.once('error', reject);
      });
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : String(error) };
    }

    this.ownedProcess = child;
    child.once('exit', () => {
      if (this.ownedProcess === child) this.ownedProcess = null;
    });

    for (let attempt = 0; attempt < 12; attempt += 1) {
      if ((await this.status(1000)).running) return { success: true, message: 'Started' };
      await delay(500);
    }

    return { success: false, message: 'Timeout waiting for server' };
  }

  async stopOwned(): Promise<{ success: boolean; message?: string }> {
    if (!this.ownedProcess) {
      const running = (await this.status(1000)).running;
      return running
        ? { success: false, message: 'Ollama is running but was not started by Awful Describer' }
        : { success: true, message: 'Already stopped' };
    }

    const processToStop = this.ownedProcess;
    this.ownedProcess = null;
    const success = processToStop.kill();
    return {
      success,
      message: success ? 'Stopped app-owned Ollama process' : 'Failed to stop Ollama process',
    };
  }

  async pull(modelName: string, onProgress?: (data: string) => void): Promise<{ success: boolean; output?: string }> {
    return this.runCli(['pull', modelName], onProgress);
  }

  async delete(modelName: string): Promise<{ success: boolean }> {
    const result = await this.runCli(['rm', modelName]);
    return { success: result.success };
  }

  generate(params: GenerateParams): Promise<GenerateResponse> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        images: params.images,
        stream: false,
        options: params.options ?? {},
      });

      let settled = false;
      const settle = (callback: () => void) => {
        if (settled) return;
        settled = true;
        this.activeRequests.delete(params.requestId);
        callback();
      };

      const request = http.request({
        hostname: HOSTNAME,
        port: PORT,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 600000,
      }, (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          data += chunk;
        });
        response.on('end', () => {
          settle(() => {
            try {
              const parsed = JSON.parse(data) as GenerateResponse & { error?: string };
              if (response.statusCode !== 200 || parsed.error) {
                reject(new Error(parsed.error || `Ollama returned HTTP ${response.statusCode ?? 'unknown'}`));
                return;
              }
              resolve(parsed);
            } catch {
              reject(new Error(`Invalid Ollama response: ${data.slice(0, 200)}`));
            }
          });
        });
      });

      this.activeRequests.set(params.requestId, request);
      request.once('error', (error) => settle(() => reject(error)));
      request.once('timeout', () => {
        request.destroy(new Error('Request timeout - model may be loading or response is too slow'));
      });
      request.write(body);
      request.end();
    });
  }

  cancel(requestId: string): boolean {
    const request = this.activeRequests.get(requestId);
    if (!request) return false;
    request.destroy(new Error('Request cancelled'));
    return true;
  }

  private async resolveExecutable(): Promise<string | null> {
    if (this.executablePath && (this.executablePath === 'ollama' || fs.existsSync(this.executablePath))) {
      return this.executablePath;
    }

    const commonPaths = process.platform === 'win32'
      ? [
          path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe'),
          path.join(os.homedir(), 'AppData', 'Local', 'Ollama', 'ollama.exe'),
          'C:\\Program Files\\Ollama\\ollama.exe',
          'C:\\Program Files (x86)\\Ollama\\ollama.exe',
        ]
      : ['/usr/local/bin/ollama', '/usr/bin/ollama'];

    const existing = commonPaths.find((candidate) => fs.existsSync(candidate));
    if (existing) {
      this.executablePath = existing;
      return existing;
    }

    const locator = process.platform === 'win32' ? 'where' : 'which';
    const located = await this.capture(locator, ['ollama']).catch(() => '');
    const firstLine = located.trim().split(/\r?\n/).find(Boolean);
    if (firstLine) {
      this.executablePath = firstLine;
      return firstLine;
    }
    return null;
  }

  private async runCli(args: string[], onProgress?: (data: string) => void): Promise<{ success: boolean; output?: string }> {
    const executable = await this.resolveExecutable();
    if (!executable) throw new Error('Ollama executable not found');

    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, { stdio: 'pipe', windowsHide: true, shell: false });
      let output = '';
      const consume = (chunk: Buffer) => {
        const text = chunk.toString();
        output += text;
        onProgress?.(text);
      };
      child.stdout?.on('data', consume);
      child.stderr?.on('data', consume);
      child.once('error', (error) => reject(new Error(`Failed to start Ollama command: ${error.message}`)));
      child.once('close', (code) => {
        if (code === 0) resolve({ success: true, output });
        else reject(new Error(`Ollama command failed with code ${code}: ${output}`));
      });
    });
  }

  private capture(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'pipe', windowsHide: true, shell: false });
      let output = '';
      child.stdout?.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });
      child.once('error', reject);
      child.once('close', (code) => code === 0 ? resolve(output) : reject(new Error(`${command} exited with ${code}`)));
    });
  }

  private getJson<T>(requestPath: string, timeoutMs: number): Promise<{ statusCode: number; body: T }> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        callback();
      };
      const request = http.get({ hostname: HOSTNAME, port: PORT, path: requestPath }, (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          data += chunk;
        });
        response.on('end', () => finish(() => {
          try {
            resolve({ statusCode: response.statusCode ?? 0, body: JSON.parse(data) as T });
          } catch (error) {
            reject(error);
          }
        }));
      });
      request.setTimeout(timeoutMs, () => request.destroy(new Error('Ollama status timeout')));
      request.once('error', (error) => finish(() => reject(error)));
    });
  }
}
