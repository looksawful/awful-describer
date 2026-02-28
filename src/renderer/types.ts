export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    family: string;
    parameter_size: string;
    quantization_level: string;
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

export interface GenerateParams {
  model: string;
  prompt: string;
  images?: string[];
  options?: ModelOptions;
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

export interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ImageFile {
  id: string;
  path: string;
  name: string;
  base64?: string;
  thumbnail?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
  addedAt: number; // timestamp for duration calculation
  processedAt?: number;
}

export interface Preset {
  id: string;
  name: string;
  category: 'upscaler' | 'generator' | 'general' | 'custom';
  prompt: string;
  model: string;
  options: ModelOptions;
  description?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number; // use number for serialization
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number; // use number for serialization
  imagePath: string;
  imageName: string;
  model: string;
  preset?: string;
  prompt: string;
  result: string;
  duration?: number;
}

export interface PanelState {
  id: string;
  visible: boolean;
  collapsed: boolean;
  width?: number;
  height?: number;
  order: number;
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

declare global {
  interface Window {
    api: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      ollama: {
        check: () => Promise<OllamaCheck>;
        status: () => Promise<OllamaStatus>;
        start: () => Promise<{ success: boolean; message?: string }>;
        stop: () => Promise<{ success: boolean }>;
        pull: (model: string) => Promise<{ success: boolean; output?: string }>;
        delete: (model: string) => Promise<{ success: boolean }>;
        generate: (params: GenerateParams) => Promise<GenerateResponse>;
        downloadInstaller: () => Promise<string>;
        runInstaller: (path: string) => Promise<{ success: boolean }>;
        onPullProgress: (callback: (data: { model: string; data: string }) => void) => () => void;
        onDownloadProgress: (callback: (data: { downloaded: number; total: number; percent: number }) => void) => () => void;
      };
      file: {
        selectImages: () => Promise<string[]>;
        selectFolder: () => Promise<string | null>;
        readImage: (path: string) => Promise<string | null>;
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
    };
  }
}

export {};
