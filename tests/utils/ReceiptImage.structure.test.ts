import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../../src/utils/receiptImage.ts', import.meta.url), 'utf8');

test('receipt images within the server upload limit skip canvas re-encoding', () => {
  assert.match(source, /const RECEIPT_UPLOAD_BYTES = 5 \* 1024 \* 1024;/);
  assert.match(source, /if \(file\.size <= RECEIPT_UPLOAD_BYTES\) return file;/);
});
