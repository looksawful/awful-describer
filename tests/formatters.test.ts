import test from 'node:test';
import assert from 'node:assert/strict';
import { formatProcessedAt } from '../src/renderer/utils/formatters.ts';

test('formatProcessedAt formats a numeric timestamp as a date/time', () => {
  const timestamp = Date.UTC(2026, 0, 2, 3, 4, 5);

  assert.equal(formatProcessedAt(timestamp), new Date(timestamp).toLocaleString());
});
