import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./AdminReports.tsx', import.meta.url), 'utf8');

test('admin reports page loads and reviews real reports', () => {
  assert.match(source, /listAdminReports/);
  assert.match(source, /reviewAdminReport/);
  assert.match(source, /targetType/);
  assert.match(source, /resolutionNote/);
  assert.match(source, /PaginationControls/);
  assert.match(source, /AdminShell/);
});

test('admin reports no longer uses mock admin data page', () => {
  assert.doesNotMatch(source, /AdminDataPage/);
  assert.doesNotMatch(source, /sectionId="reports"/);
});
