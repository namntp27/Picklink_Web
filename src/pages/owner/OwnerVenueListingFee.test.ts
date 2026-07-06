import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./OwnerVenueDetail.tsx', import.meta.url), 'utf8');

test('owner venue detail exposes listing fee preview and receipt submission', () => {
  assert.match(source, /previewOwnerListingFee/);
  assert.match(source, /submitOwnerListingFeePayment/);
  assert.match(source, /listingStatus/);
  assert.match(source, /listingExpiresAt/);
  assert.match(source, /listingReceipt/);
});
