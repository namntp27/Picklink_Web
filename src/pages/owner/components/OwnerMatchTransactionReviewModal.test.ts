import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const modalSource = readFileSync(
  new URL('./OwnerMatchTransactionReviewModal.tsx', import.meta.url),
  'utf8',
);

test('owner match review groups one batch into one atomic review action', () => {
  assert.match(modalSource, /paymentGroupId/);
  assert.match(modalSource, /groupedPayments/);
  assert.match(modalSource, /groupTotalAmount/);
  assert.match(modalSource, /Các phần được thanh toán/);
  assert.match(modalSource, /Duyệt toàn bộ/);
  assert.match(modalSource, /Từ chối toàn bộ/);
  assert.match(modalSource, /load\(true\)/);
});

test('owner match review suppresses duplicate realtime reloads and refreshes independent data in parallel', () => {
  assert.match(
    modalSource,
    /event\.bookingId === bookingId && busyId === null/,
  );
  assert.doesNotMatch(modalSource, /event\.paymentId !== busyId/);

  const parallelRefreshes = modalSource.match(
    /await Promise\.all\(\[load\(true\), onUpdated\(\)\]\)/g,
  ) ?? [];
  assert.equal(parallelRefreshes.length, 2);
});
