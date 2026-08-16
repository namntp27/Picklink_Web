import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/courts/Checkout.tsx', import.meta.url), 'utf8');

test('checkout resolves a match booking when its URL has only bookingId', () => {
  assert.ok(source.includes('getCheckoutBookingContext(token, bookingId)'));
  assert.ok(source.includes("next.set('matchId', String(context.matchId))"));
  assert.ok(source.includes('navigate({ search: `?${next.toString()}` }, { replace: true })'));
  assert.ok(source.includes('needsMatchCheck ? null : <CourtCheckout />'));
});
