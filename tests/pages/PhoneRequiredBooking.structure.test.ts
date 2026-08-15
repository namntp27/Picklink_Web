import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('booking and checkout send players without a phone number to profile', () => {
  const client = source('../../src/api/client.ts');
  const pages = [
    source('../../src/pages/courts/CourtScheduleDetail.tsx'),
    source('../../src/pages/courts/Checkout.tsx'),
    source('../../src/pages/matches/MatchDetail.tsx'),
    source('../../src/pages/matches/MatchCheckout.tsx'),
  ];

  assert.match(client, /phoneNumberRequired: 'PHONE_NUMBER_REQUIRED'/);
  pages.forEach((page) => {
    assert.match(page, /ApiErrorCodes\.phoneNumberRequired/);
    assert.match(page, /window\.alert/);
    assert.match(page, /navigate\('\/profile'\)/);
  });
});
