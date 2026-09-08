import type { ApiBridge, ModelOptions } from '../shared/ipc';

export type {
  GenerateParams,
  GenerateResponse,
  ModelOptions,
  OllamaCheck,
  OllamaModel,
  OllamaStatus,
  PortInfo,
  ReadImageResult,
  SystemInfo,
} from '../shared/ipc';

export interface ImageFile {
  id: string;
  path: string;
  name: string;
  thumbnail?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
  addedAt: number;
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
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
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

declare global {
  interface Window {
    api: ApiBridge;
  }
}

export {};
