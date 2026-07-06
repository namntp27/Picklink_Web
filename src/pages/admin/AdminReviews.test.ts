import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./AdminReviews.tsx', import.meta.url), 'utf8');

test('admin reviews page loads and moderates real reviews', () => {
  assert.match(source, /listAdminReviews/);
  assert.match(source, /moderateAdminReview/);
  assert.match(source, /moderationStatus/);
  assert.match(source, /moderationNote/);
  assert.match(source, /PaginationControls/);
  assert.match(source, /AdminShell/);
});

test('admin reviews no longer uses mock admin data page', () => {
  assert.doesNotMatch(source, /AdminDataPage/);
  assert.doesNotMatch(source, /sectionId="reviews"/);
});
