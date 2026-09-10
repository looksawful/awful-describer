export type ModelCliOperation = 'pull' | 'rm';

export interface CancellableRequest {
  destroy(error?: Error): void;
}

export function buildModelCommandArgs(operation: ModelCliOperation, modelName: string): readonly [ModelCliOperation, string] {
  if (modelName.trim().length === 0 || modelName.includes('\0')) {
    throw new Error('Invalid Ollama model name');
  }
  return [operation, modelName] as const;
}

export async function waitForCondition(
  check: () => boolean | Promise<boolean>,
  attempts: number,
  wait: () => void | Promise<void>,
): Promise<boolean> {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error('Retry attempts must be a positive integer');
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await check()) return true;
    if (attempt + 1 < attempts) await wait();
  }

  return false;
}

export class RequestRegistry<T extends CancellableRequest> {
  private readonly requests = new Map<string, T>();

  register(requestId: string, request: T): void {
    if (this.requests.has(requestId)) {
      throw new Error(`Duplicate active request id: ${requestId}`);
    }
    this.requests.set(requestId, request);
  }

  delete(requestId: string): void {
    this.requests.delete(requestId);
  }

  cancel(requestId: string, error = new Error('Request cancelled')): boolean {
    const request = this.requests.get(requestId);
    if (!request) return false;
    this.requests.delete(requestId);
    request.destroy(error);
    return true;
  }

  has(requestId: string): boolean {
    return this.requests.has(requestId);
  }
}
