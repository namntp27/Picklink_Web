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

test('sepay api token is entered masked and never rendered from the api', () => {
  assert.match(source, /type=\{isTokenVisible \? 'text' : 'password'\}/);
  assert.match(source, /setIsTokenVisible\(\(current\) => !current\)/);
  assert.match(source, /account\.hasSePayApiToken/);
  assert.match(source, /tokenStatus\.masked/);
  // The plain token only ever travels outbound; nothing may read one back off the response.
  assert.doesNotMatch(source, /account\.sePayApiToken/);
});

test('a routine bank-details save leaves an existing token untouched', () => {
  assert.match(source, /isTokenFieldOpen = !tokenStatus\.configured \|\| isReplacingToken/);
  assert.match(source, /\.\.\.\(isTokenFieldOpen && trimmedToken \? \{ sePayApiToken: trimmedToken \} : \{\}\)/);
  assert.match(source, /Thay đổi Token/);
  assert.match(source, /my\.sepay\.vn/);
});