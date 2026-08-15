import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reconcileSelectedPayerIds } from '../../src/utils/matchPaymentSelection';

test('current player pending payment is always selected first', () => {
  assert.deepEqual(reconcileSelectedPayerIds([12], new Set([10, 12]), 10), [10, 12]);
});

test('refresh keeps selected teammates but removes no-longer-pending payments', () => {
  assert.deepEqual(reconcileSelectedPayerIds([10, 12, 14], new Set([10, 14]), 10), [10, 14]);
});

test('current player is not added again after their own payment was submitted', () => {
  assert.deepEqual(reconcileSelectedPayerIds([12], new Set([12]), 10), [12]);
});
