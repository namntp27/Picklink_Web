import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let listingFees: typeof import('../../src/api/listingFees');
let calls: Array<{ url: string; init?: RequestInit }> = [];

beforeEach(async () => {
  const vite = await createServer({
    configFile: false,
    server: { middlewareMode: true },
  });
  listingFees = await vite.ssrLoadModule('/src/api/listingFees.ts') as typeof listingFees;
  await vite.close();

  calls = [];
  global.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      pricePerCourtPerMonth: 150000,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
});

test('admin listing fee APIs use protected platform-fee endpoints', async () => {
  await listingFees.getListingFeeSettings('token');
  await listingFees.updateListingFeeSettings('token', 180000);
  await listingFees.listListingFeePayments('token', { status: 'PendingReview', page: 2, pageSize: 10 });
  await listingFees.confirmListingFeePayment('token', 9);
  await listingFees.rejectListingFeePayment('token', 9, 'Sai số tiền');

  assert.equal(calls[0].url, '/api/admin/listing-fees/settings');
  assert.equal(calls[1].url, '/api/admin/listing-fees/settings');
  assert.equal(calls[1].init?.method, 'PUT');
  assert.equal(calls[1].init?.body, JSON.stringify({ pricePerCourtPerMonth: 180000 }));
  assert.equal(calls[2].url, '/api/admin/listing-fees/payments?status=PendingReview&page=2&pageSize=10');
  assert.equal(calls[3].url, '/api/admin/listing-fees/payments/9/confirm');
  assert.equal(calls[4].url, '/api/admin/listing-fees/payments/9/reject');
});

test('owner listing fee APIs preview and submit receipt for a venue', async () => {
  const receipt = new File(['x'], 'receipt.jpg', { type: 'image/jpeg' });

  await listingFees.previewOwnerListingFee('token', 12, 3);
  await listingFees.submitOwnerListingFeePayment('token', 12, 3, receipt);

  assert.equal(calls[0].url, '/api/owner/venues/12/listing-fee/preview?months=3');
  assert.equal(calls[1].url, '/api/owner/venues/12/listing-fee/payments');
  assert.equal(calls[1].init?.method, 'POST');
  assert.ok(calls[1].init?.body instanceof FormData);
});
