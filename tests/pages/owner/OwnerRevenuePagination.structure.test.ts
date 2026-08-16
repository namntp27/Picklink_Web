import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageSource = readFileSync(new URL('../../../src/pages/owner/OwnerRevenue.tsx', import.meta.url), 'utf8');

test('payment history pages the rows through the shared pagination control', () => {
  assert.ok(pageSource.includes("import { PaginationControls } from '../../components/PaginationControls'"));
  assert.ok(pageSource.includes('const historyPageSize = 10;'));
  assert.ok(pageSource.includes('<PaginationControls onPageChange={setHistoryPage} page={historyPagination} />'));
  // The control hides itself on a single page; its frame must not linger as an empty box.
  assert.ok(pageSource.includes('{filteredTransactions.length > historyPageSize && ('));
  assert.ok(pageSource.includes('pagedTransactions.map((transaction) => {'));
  assert.match(pageSource, /const pagedTransactions = filteredTransactions\.slice\(/);
});

test('the page number is clamped so totals and the empty state stay correct', () => {
  // Totals come from the whole filtered list, never from the visible slice.
  assert.ok(pageSource.includes('totalCount: filteredTransactions.length'));
  assert.ok(pageSource.includes('{filteredTransactions.length === 0 && ('));

  // A realtime reload can shrink the list under the current page.
  assert.ok(pageSource.includes('const currentHistoryPage = Math.min(historyPage, historyTotalPages);'));
  assert.match(pageSource, /Math\.max\(1, Math\.ceil\(filteredTransactions\.length \/ historyPageSize\)\)/);
});

test('changing a filter returns to the first page', () => {
  assert.ok(pageSource.includes('setActivePeriod(option.value); setHistoryPage(1);'));
  assert.ok(pageSource.includes('setActiveStatus(option.value); setHistoryPage(1);'));
  assert.ok(pageSource.includes('setSearchTerm(event.target.value); setHistoryPage(1);'));
});
