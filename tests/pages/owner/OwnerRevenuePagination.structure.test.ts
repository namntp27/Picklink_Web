import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageSource = readFileSync(new URL('../../../src/pages/owner/OwnerRevenue.tsx', import.meta.url), 'utf8');
const adapterSource = readFileSync(new URL('../../../src/pages/owner/ownerBookingAdapter.ts', import.meta.url), 'utf8');

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

test('a custom date range validates and reloads the revenue report', () => {
  assert.ok(pageSource.includes("type RevenuePeriod = 'today' | 'week' | 'month' | 'custom';"));
  assert.ok(pageSource.includes('const maxRevenueRangeDays = 367;'));
  assert.ok(pageSource.includes("setActivePeriod('custom');"));
  assert.ok(pageSource.includes('getCustomDateRange(customRange.from, customRange.to)'));
  assert.ok(pageSource.includes('aria-label="Từ ngày doanh thu"'));
  assert.ok(pageSource.includes('aria-label="Đến ngày doanh thu"'));
});

test('the custom-range chart keeps every selected day in a horizontal scroller', () => {
  assert.ok(pageSource.includes("const chartDates = activePeriod === 'month'"));
  assert.ok(pageSource.includes('className="mt-6 h-[280px] overflow-x-scroll pb-3"'));
  assert.ok(pageSource.includes('className="flex h-full min-w-full w-max items-end gap-3 border-b border-outline-variant px-2"'));
});

test('summary cards filter and reveal the payment history', () => {
  assert.ok(pageSource.includes('const showTransactions = (status: TransactionStatus) => {'));
  assert.equal((pageSource.match(/onClick: \(\) => showTransactions\('paid'\)/g) ?? []).length, 3);
  // The "Chờ thanh toán" card jumps to 'all' rather than 'pending' — not-yet-paid holds aren't in
  // the itemized list below, so filtering to 'pending' would land on an empty view.
  assert.ok(pageSource.includes("onClick: () => showTransactions('all')"));
  assert.ok(pageSource.includes("onClick={() => showTransactions('refunded')}"));
  assert.ok(pageSource.includes('id="owner-revenue-history"'));
  assert.ok(pageSource.includes("scrollIntoView({ behavior: 'smooth', block: 'start' })"));
});

test('payment history shows the newest transaction first', () => {
  assert.ok(pageSource.includes('.sort((first, second) => Date.parse(second.paidAt) - Date.parse(first.paidAt));'));
});

test('refund total uses the payment value returned by the revenue report', () => {
  assert.ok(pageSource.includes('const refundedAmount = revenueReport?.refundedAmount ?? 0;'));
  assert.ok(!pageSource.includes('const refundedAmount = refundedTransactions.reduce'));
});

test('refund history excludes cancelled bookings without a refund payment', () => {
  assert.ok(pageSource.includes('const refundAmount = record.refundAmount ?? ('));
  assert.ok(pageSource.includes("activeStatus === 'refunded'"));
  assert.ok(pageSource.includes('transaction.refundAmount > 0'));
});

test('refund history falls back to the booking payment status during an API restart', () => {
  assert.ok(pageSource.includes("record.paymentStatus === 'RefundPending' || record.paymentStatus === 'Refunded'"));
  assert.ok(pageSource.includes('refundAmount,'));
});

test('payment methods in revenue are translated by the owner booking adapter', () => {
  assert.ok(adapterSource.includes('const paymentMethodLabel'));
  assert.ok(adapterSource.includes('BankTransfer:'));
  assert.ok(adapterSource.includes('paymentMethod: formatPaymentMethod(record.paymentMethod)'));
});
