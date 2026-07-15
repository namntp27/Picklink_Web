import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');

test('staff dashboard verifies and processes the selected check-in group', async () => {
  const api = await readFile(path.join(root, 'src/api/staff.ts'), 'utf8');
  const dashboard = await readFile(path.join(root, 'src/pages/staff/StaffDashboard.tsx'), 'utf8');

  assert.match(api, /verifyStaffBookingCodeByCode/);
  assert.match(api, /checkInStaffCheckInGroup/);
  assert.match(api, /markStaffCheckInGroupNoShow/);
  assert.match(dashboard, /verified\.checkInGroups\.find/);
  assert.match(dashboard, /verifyStaffBookingCodeByCode/);
  assert.match(dashboard, /checkInStaffCheckInGroup/);
  assert.match(dashboard, /markStaffCheckInGroupNoShow/);
  assert.doesNotMatch(dashboard, /await load\(\);/);
  assert.match(dashboard, /void getStaffNotifications\(token\)/);
  assert.doesNotMatch(dashboard, /bookingResult, notificationResult/);
});
