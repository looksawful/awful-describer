import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

const OLLAMA_INSTALLER_URL = 'https://ollama.com/download/OllamaSetup.exe';
const MAX_REDIRECTS = 5;

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percent: number;
}

export function downloadOllamaInstaller(
  temporaryDirectory: string,
  onProgress: (progress: DownloadProgress) => void,
): Promise<string> {
  const destination = path.join(temporaryDirectory, 'OllamaSetup.exe');
  return downloadHttps(OLLAMA_INSTALLER_URL, destination, onProgress, 0).then(() => destination);
}

function downloadHttps(
  url: string,
  destination: string,
  onProgress: (progress: DownloadProgress) => void,
  redirectCount: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error('Too many installer redirects'));
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      reject(new Error('Invalid installer URL'));
      return;
    }
    if (parsedUrl.protocol !== 'https:') {
      reject(new Error('Installer download requires HTTPS'));
      return;
    }

    const request = https.get(parsedUrl, (response) => {
      const statusCode = response.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        const location = response.headers.location;
        response.resume();
        if (!location) {
          reject(new Error('Installer redirect has no location'));
          return;
        }
        const redirectUrl = new URL(location, parsedUrl).toString();
        downloadHttps(redirectUrl, destination, onProgress, redirectCount + 1).then(resolve, reject);
        return;
      }

      if (statusCode !== 200) {
        response.resume();
        reject(new Error(`Installer download failed with HTTP ${statusCode}`));
        return;
      }

      const total = Number.parseInt(response.headers['content-length'] ?? '0', 10) || 0;
      let downloaded = 0;
      const file = fs.createWriteStream(destination);

      response.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        onProgress({
          downloaded,
          total,
          percent: total > 0 ? Number(((downloaded / total) * 100).toFixed(1)) : 0,
        });
      });
      response.pipe(file);

      file.once('finish', () => {
        file.close((error) => error ? reject(error) : resolve());
      });
      file.once('error', (error) => {
        response.destroy();
        fs.rm(destination, { force: true }, () => reject(error));
      });
    });

    request.setTimeout(120000, () => request.destroy(new Error('Installer download timed out')));
    request.once('error', reject);
  });
}
