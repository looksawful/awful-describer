import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getImageMimeType, type ReadImageResult } from '../../shared/ipc';

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif']);

export async function readImage(filePath: string): Promise<ReadImageResult | null> {
  const mimeType = getImageMimeType(filePath);
  if (!mimeType) return null;

  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile() || stats.size > MAX_IMAGE_BYTES) return null;
    const data = await fs.promises.readFile(filePath);
    return { base64: data.toString('base64'), mimeType };
  } catch {
    return null;
  }
}

export async function searchImages(directory: string, pattern: string): Promise<string[]> {
  const results: string[] = [];
  const lowerPattern = pattern.toLowerCase();

  const searchDirectory = async (currentDirectory: string, depth = 0): Promise<void> => {
    if (depth > 5 || results.length >= 100) return;
    try {
      const items = await fs.promises.readdir(currentDirectory, { withFileTypes: true });
      for (const item of items) {
        if (results.length >= 100) break;
        const fullPath = path.join(currentDirectory, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          await searchDirectory(fullPath, depth + 1);
        } else if (item.isFile()) {
          const extension = path.extname(item.name).toLowerCase();
          if (IMAGE_EXTENSIONS.has(extension) && item.name.toLowerCase().includes(lowerPattern)) results.push(fullPath);
        }
      }
    } catch {
      // Inaccessible directories are skipped rather than failing the whole search.
    }
  };

  await searchDirectory(directory);
  return results;
}

export async function getOllamaModelsPathInfo(): Promise<{ path: string; exists: boolean; size: number }> {
  const modelsPath = path.join(os.homedir(), '.ollama', 'models');
  try {
    const stats = await fs.promises.stat(modelsPath);
    if (!stats.isDirectory()) return { path: modelsPath, exists: false, size: 0 };
  } catch {
    return { path: modelsPath, exists: false, size: 0 };
  }

  const getSize = async (directory: string): Promise<number> => {
    let total = 0;
    const items = await fs.promises.readdir(directory, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      if (item.isDirectory()) total += await getSize(fullPath);
      else if (item.isFile()) total += (await fs.promises.stat(fullPath)).size;
    }
    return total;
  };

  try {
    return { path: modelsPath, exists: true, size: await getSize(modelsPath) };
  } catch {
    return { path: modelsPath, exists: true, size: 0 };
  }
}
