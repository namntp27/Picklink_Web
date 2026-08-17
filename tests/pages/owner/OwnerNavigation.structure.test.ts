import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const backLinkSource = readFileSync(new URL('../../../src/components/navigation/HistoryBackLink.tsx', import.meta.url), 'utf8');
const ownerPages = [
  'OwnerBookingDetail.tsx',
  'OwnerVenueDetail.tsx',
  'OwnerTicketSessionDetail.tsx',
  'OwnerCourtCreate.tsx',
  'OwnerCourtEdit.tsx',
];

test('owner back links preserve the page that opened the detail', () => {
  assert.ok(backLinkSource.includes("key !== 'default'"));
  assert.ok(backLinkSource.includes('navigate(-1)'));
  assert.ok(backLinkSource.includes('to={fallback}'));
  for (const page of ownerPages) {
    const source = readFileSync(new URL(`../../../src/pages/owner/${page}`, import.meta.url), 'utf8');
    assert.ok(source.includes('<OwnerBackLink'));
  }
});