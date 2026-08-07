import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');

test('staff dashboard scan atomically checks in without a second present command', async () => {
  const api = await readFile(path.join(root, 'src/api/staff.ts'), 'utf8');
  const dashboard = await readFile(path.join(root, 'src/pages/staff/StaffDashboard.tsx'), 'utf8');
  const styles = await readFile(path.join(root, 'src/pages/staff/staff.css'), 'utf8');

  assert.match(api, /verifyStaffBookingCodeByCode/);
  assert.doesNotMatch(api, /checkInStaff(?:Booking|CheckInGroup|MatchParticipant)/);
  assert.match(api, /markStaffCheckInGroupNoShow/);
  assert.match(dashboard, /verified\.checkInGroups\.find/);
  assert.match(dashboard, /verifyStaffBookingCodeByCode/);
  assert.match(dashboard, /verified\.verifiedCheckInGroupId/);
  assert.match(dashboard, /verified\.verifiedPlayerId/);
  assert.match(dashboard, /attendanceStatus === 'Present'/);
  assert.doesNotMatch(dashboard, /checkInStaff(?:Booking|CheckInGroup|MatchParticipant)/);
  assert.match(dashboard, /markStaffCheckInGroupNoShow/);
  assert.match(dashboard, /pageSize: 10/);
  assert.match(dashboard, /bookingPagination\.page - 1/);
  assert.match(dashboard, /selected\.checkInGroups\.map/);
  assert.match(dashboard, /missingCheckInGroup/);
  assert.doesNotMatch(api, /checkInCode:/);
  assert.doesNotMatch(styles, /\.staff-list-scroll\s*\{[^}]*max-height/s);
  assert.doesNotMatch(dashboard, /await load\(\);/);
  // Notifications are their own query, so a slow notification feed cannot hold up the booking
  // queue, and useApiQuery discards results from runs a newer one superseded.
  assert.match(dashboard, /\['staff-notifications', token\]/);
  assert.match(dashboard, /getStaffNotifications\(token!\)\.catch\(\(\) => emptyNotifications\)/);
  assert.doesNotMatch(dashboard, /getStaffNotifications\([^)]*\),\r?\n\s*\]\)/);
  assert.doesNotMatch(dashboard, /bookingResult, notificationResult/);
});
