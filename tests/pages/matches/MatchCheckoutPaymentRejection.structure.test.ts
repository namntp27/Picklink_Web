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

test('match checkout anchors its countdown to the remaining seconds returned by the server', () => {
  assert.ok(source.includes('const [paymentDeadlineAt, setPaymentDeadlineAt] = useState(0);'));
  assert.ok(source.includes('detail.paymentHoldRemainingSeconds != null'));
  assert.ok(source.includes('receivedAt + Math.max(0, detail.paymentHoldRemainingSeconds) * 1_000'));
  assert.ok(source.includes('const deadline = paymentDeadlineAt;'));
  assert.match(source, /`\$\{value\}\+07:00`/);
  assert.doesNotMatch(source, /`\$\{value\}Z`/);
});
