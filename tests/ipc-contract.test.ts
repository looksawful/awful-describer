import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getImageMimeType,
  isSafeExternalUrl,
  isTrustedRendererUrl,
  sanitizeGenerateParams,
  sanitizeModelOptions,
} from '../src/shared/ipc';

test('image MIME type follows the source extension', () => {
  assert.equal(getImageMimeType('photo.JPG'), 'image/jpeg');
  assert.equal(getImageMimeType('render.webp'), 'image/webp');
  assert.equal(getImageMimeType('scan.tiff'), 'image/tiff');
  assert.equal(getImageMimeType('notes.txt'), null);
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
});

test('model options reject non-finite values and unknown keys', () => {
  assert.deepEqual(sanitizeModelOptions({ temperature: 0.7, unknown: 5 }), { temperature: 0.7 });
  assert.throws(() => sanitizeModelOptions({ top_p: Number.NaN }), /Invalid numeric model option/);
});

test('generate requests require an id, model and prompt', () => {
  const result = sanitizeGenerateParams({
    requestId: 'request-1',
    model: 'llava:latest',
    prompt: 'Describe the image',
    images: ['abc123'],
    options: { temperature: 0.2 },
  });
  assert.equal(result.requestId, 'request-1');
  assert.equal(result.model, 'llava:latest');
  assert.throws(() => sanitizeGenerateParams({ model: 'llava:latest', prompt: 'x' }), /requestId/);
});
