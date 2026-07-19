import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/owner/OwnerSettings.tsx', import.meta.url), 'utf8');

test('owner bank account accepts only 5 to 30 digits', () => {
  assert.ok(source.includes('/^\\d{5,30}$/'));
  assert.ok(source.includes("replace(/\\D/g, '')"));
  assert.doesNotMatch(source, /\/\^d\{5,30\}\$\/|replace\(\/D\/g/);
});

test('owner bank account saves the normalized payment contract', () => {
  assert.match(source, /saveOwnerBankAccount\(token/);
  assert.match(source, /accountNumber: payout\.accountNumber/);
  assert.match(source, /accountHolderName: payout\.accountHolder\.trim\(\)/);
});