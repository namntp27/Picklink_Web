import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./AdminTransactions.tsx', import.meta.url), 'utf8');

test('admin transactions manages real listing fee settings and payments', () => {
  assert.match(source, /getListingFeeSettings/);
  assert.match(source, /updateListingFeeSettings/);
  assert.match(source, /listListingFeePayments/);
  assert.match(source, /confirmListingFeePayment/);
  assert.match(source, /rejectListingFeePayment/);
  assert.match(source, /PaginationControls/);
  assert.match(source, /AdminShell/);
});

test('admin transactions no longer uses mock admin data page', () => {
  assert.doesNotMatch(source, /AdminDataPage/);
  assert.doesNotMatch(source, /sectionId="transactions"/);
});
