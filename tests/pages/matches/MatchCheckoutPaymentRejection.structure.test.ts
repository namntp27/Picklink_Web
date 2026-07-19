import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/matches/MatchCheckout.tsx', import.meta.url), 'utf8');

test('match checkout presents owner receipt decisions to the player', () => {
  assert.ok(source.includes('const rejectedPayment = paymentTargets.find'));
  assert.ok(source.includes('participant.paymentRejectionReason'));
  assert.ok(source.includes('Biên lai thanh toán đã bị từ chối.'));
  assert.ok(source.includes('rejectedPayment.paymentRejectionReason'));
  assert.ok(source.includes("const myPaymentApproved = match?.myPaymentStatus === 'Paid';"));
  assert.ok(source.includes('myPaymentApproved &&'));
  assert.ok(source.includes('role="status"'));
});