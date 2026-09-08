import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getImageMimeType,
  isSafeExternalUrl,
  isTrustedRendererUrl,
  sanitizeGenerateParams,
  sanitizeModelOptions,
} from '../src/shared/ipc';
import { LatestOperationGate } from '../src/shared/latestOperation';
import {
  buildModelCommandArgs,
  RequestRegistry,
  waitForCondition,
} from '../src/shared/ollamaRuntime';

test('image MIME type follows the source extension', () => {
  assert.equal(getImageMimeType('photo.JPG'), 'image/jpeg');
  assert.equal(getImageMimeType('render.webp'), 'image/webp');
  assert.equal(getImageMimeType('scan.tiff'), 'image/tiff');
  assert.equal(getImageMimeType('notes.txt'), null);
});

test('latest-operation gate invalidates stale async preview loads', () => {
  const gate = new LatestOperationGate();
  const first = gate.begin();
  assert.equal(gate.isCurrent(first), true);

  const second = gate.begin();
  assert.equal(gate.isCurrent(first), false);
  assert.equal(gate.isCurrent(second), true);

  gate.invalidate(second);
  assert.equal(gate.isCurrent(second), false);
});

test('external URLs are HTTPS-only', () => {
  assert.equal(isSafeExternalUrl('https://ollama.com/download'), true);
  assert.equal(isSafeExternalUrl('http://ollama.com/download'), false);
  assert.equal(isSafeExternalUrl('file:///C:/Windows/System32/calc.exe'), false);
  assert.equal(isSafeExternalUrl('not a url'), false);
});

test('renderer sender policy distinguishes development and packaged URLs', () => {
  assert.equal(isTrustedRendererUrl('http://localhost:5173/', true), true);
  assert.equal(isTrustedRendererUrl('http://127.0.0.1:5173/', true), false);
  assert.equal(isTrustedRendererUrl('https://example.com/', true), false);
  assert.equal(isTrustedRendererUrl('file:///C:/app/dist/renderer/index.html', false), true);
  assert.equal(isTrustedRendererUrl('file:///C:/Windows/System32/index.html', false), false);
});

test('model options reject non-finite values and unknown keys', () => {
  assert.deepEqual(sanitizeModelOptions({ temperature: 0.7, unknown: 5 }), { temperature: 0.7 });
  assert.throws(() => sanitizeModelOptions({ top_p: Number.NaN }), /Invalid numeric model option/);
});

test('generate requests require an id, model and prompt and allow realistic base64 sizes', () => {
  const image = 'A'.repeat(40000);
  const result = sanitizeGenerateParams({
    requestId: 'request-1',
    model: 'llava:latest',
    prompt: 'Describe the image',
    images: [image],
    options: { temperature: 0.2 },
  });
  assert.equal(result.requestId, 'request-1');
  assert.equal(result.model, 'llava:latest');
  assert.equal(result.images?.[0].length, image.length);
  assert.throws(() => sanitizeGenerateParams({ model: 'llava:latest', prompt: 'x' }), /requestId/);
});

test('Ollama model commands preserve the model name as one argument', () => {
  assert.deepEqual(buildModelCommandArgs('pull', 'qwen2-vl:7b'), ['pull', 'qwen2-vl:7b']);
  assert.deepEqual(buildModelCommandArgs('rm', 'model name; still one arg'), ['rm', 'model name; still one arg']);
  assert.throws(() => buildModelCommandArgs('pull', '   '), /Invalid Ollama model name/);
});

test('readiness retry stops immediately after success and is bounded on failure', async () => {
  let checks = 0;
  let waits = 0;
  const ready = await waitForCondition(
    () => {
      checks += 1;
      return checks === 3;
    },
    5,
    () => {
      waits += 1;
    },
  );

  assert.equal(ready, true);
  assert.equal(checks, 3);
  assert.equal(waits, 2);

  checks = 0;
  waits = 0;
  const failed = await waitForCondition(
    () => {
      checks += 1;
      return false;
    },
    3,
    () => {
      waits += 1;
    },
  );

  assert.equal(failed, false);
  assert.equal(checks, 3);
  assert.equal(waits, 2);
});

test('request registry rejects duplicate active ids and cancellation destroys once', () => {
  const registry = new RequestRegistry<{ destroy(error?: Error): void }>();
  const destroyed: string[] = [];
  const request = {
    destroy(error?: Error) {
      destroyed.push(error?.message ?? 'destroyed');
    },
  };

  registry.register('request-1', request);
  assert.equal(registry.has('request-1'), true);
  assert.throws(() => registry.register('request-1', request), /Duplicate active request id/);

  assert.equal(registry.cancel('request-1'), true);
  assert.deepEqual(destroyed, ['Request cancelled']);
  assert.equal(registry.has('request-1'), false);
  assert.equal(registry.cancel('request-1'), false);
  assert.deepEqual(destroyed, ['Request cancelled']);
});
