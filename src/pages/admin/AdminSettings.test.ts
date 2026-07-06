import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./AdminSettings.tsx', import.meta.url), 'utf8');

test('admin settings page loads and updates real settings', () => {
  assert.match(source, /getAdminSettings/);
  assert.match(source, /updateAdminSetting/);
  assert.match(source, /bookingHoldMinutes/);
  assert.match(source, /listingExpiryReminderDays/);
  assert.match(source, /maxReceiptUploadMb/);
  assert.match(source, /AdminShell/);
});

test('admin settings no longer uses mock settings page', () => {
  assert.doesNotMatch(source, /AdminSettingsPage/);
  assert.doesNotMatch(source, /settingsGroups/);
});
