export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaStatus {
  running: boolean;
  models: OllamaModel[];
}

export interface OllamaCheck {
  installed: boolean;
  path: string | null;
}

export interface ModelOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_predict?: number;
  num_ctx?: number;
  seed?: number;
  repeat_penalty?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stop?: string[];
}

export interface GenerateParams {
  requestId: string;
  model: string;
  prompt: string;
  images?: string[];
  options?: ModelOptions;
}

export interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ReadImageResult {
  base64: string;
  mimeType: string;
}

export interface SystemInfo {
  cpu: number;
  memory: {
    total: number;
    free: number;
    used: number;
    percent: string;
  };
  platform: string;
  arch: string;
}

export interface PortInfo {
  local: string;
  foreign: string;
  state: string;
  pid: string;
}

export interface ApiBridge {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  ollama: {
    check: () => Promise<OllamaCheck>;
    status: () => Promise<OllamaStatus>;
    start: () => Promise<{ success: boolean; message?: string }>;
    stop: () => Promise<{ success: boolean; message?: string }>;
    pull: (model: string) => Promise<{ success: boolean; output?: string }>;
    delete: (model: string) => Promise<{ success: boolean }>;
    generate: (params: GenerateParams) => Promise<GenerateResponse>;
    cancel: (requestId: string) => Promise<{ success: boolean }>;
    downloadInstaller: () => Promise<string>;
    runInstaller: (path: string) => Promise<{ success: boolean; message?: string }>;
    onPullProgress: (callback: (data: { model: string; data: string }) => void) => () => void;
    onDownloadProgress: (callback: (data: { downloaded: number; total: number; percent: number }) => void) => () => void;
  };
  file: {
    selectImages: () => Promise<string[]>;
    selectFolder: () => Promise<string | null>;
    readImage: (path: string) => Promise<ReadImageResult | null>;
    saveResult: (content: string, defaultName: string) => Promise<string | null>;
    search: (directory: string, pattern: string) => Promise<string[]>;
  };
  system: {
    info: () => Promise<SystemInfo>;
    ports: () => Promise<PortInfo[]>;
  };
  shell: {
    openPath: (path: string) => Promise<void>;
    openUrl: (url: string) => Promise<void>;
  };
}

const MODEL_OPTION_KEYS = new Set<keyof ModelOptions>([
  'temperature',
  'top_p',
  'top_k',
  'num_predict',
  'num_ctx',
  'seed',
  'repeat_penalty',
  'presence_penalty',
  'frequency_penalty',
  'stop',
]);

const MAX_BASE64_IMAGE_LENGTH = 70 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 32768 || value.includes('\0')) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function assertBase64Image(value: unknown, index: number): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_BASE64_IMAGE_LENGTH ||
    value.includes('\0')
  ) {
    throw new Error(`Invalid image ${index}`);
  }
  return value;
}

export function sanitizeModelOptions(value: unknown): ModelOptions {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error('Invalid model options');

  const result: ModelOptions = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (!MODEL_OPTION_KEYS.has(key as keyof ModelOptions)) continue;
    if (key === 'stop') {
      if (!Array.isArray(rawValue) || rawValue.some((item) => typeof item !== 'string')) {
        throw new Error('Invalid stop option');
      }
      result.stop = rawValue.slice(0, 32) as string[];
      continue;
    }
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
      throw new Error(`Invalid numeric model option: ${key}`);
    }
    (result as Record<string, unknown>)[key] = rawValue;
  }
  return result;
}

export function sanitizeGenerateParams(value: unknown): GenerateParams {
  if (!isRecord(value)) throw new Error('Invalid generate request');
  const requestId = assertNonEmptyString(value.requestId, 'requestId');
  const model = assertNonEmptyString(value.model, 'model');
  const prompt = assertNonEmptyString(value.prompt, 'prompt');

  let images: string[] | undefined;
  if (value.images !== undefined) {
    if (!Array.isArray(value.images) || value.images.length > 16) throw new Error('Invalid images');
    images = value.images.map((image, index) => assertBase64Image(image, index));
  }

  return {
    requestId,
    model,
    prompt,
    images,
    options: sanitizeModelOptions(value.options),
  };
}

export function getImageMimeType(filePath: string): string | null {
  const extension = filePath.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'webp':
      return 'image/webp';
    case 'tif':
    case 'tiff':
      return 'image/tiff';
    default:
      return null;
  }
}

export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isTrustedRendererUrl(value: string, isDev: boolean): boolean {
  try {
    const url = new URL(value);
    if (isDev) {
      return url.protocol === 'http:' && url.hostname === 'localhost' && url.port === '5173';
    }
    if (url.protocol !== 'file:') return false;
    const normalizedPath = decodeURIComponent(url.pathname).replace(/\\/g, '/');
    return normalizedPath.endsWith('/renderer/index.html');
  } catch {
    return false;
  }
}
