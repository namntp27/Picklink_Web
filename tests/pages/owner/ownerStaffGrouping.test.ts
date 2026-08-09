import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { OwnerStaffAssignment } from '../../../src/api/owner';
import { groupOwnerStaffAssignments } from '../../../src/pages/owner/ownerStaffGrouping';

const assignment = (
  staffId: number,
  userId: number,
  venueId: number,
  venueName: string,
  isActive = true,
): OwnerStaffAssignment => ({
  staffId,
  userId,
  username: `staff-${userId}`,
  email: `staff-${userId}@example.com`,
  venueId,
  venueName,
  role: 'Nhân viên vận hành',
  permissions: ['ViewBookings', 'CheckIn'],
  isActive,
  assignedAt: '2026-08-09T00:00:00Z',
});

test('one staff account is rendered as one row with every assigned venue', () => {
  const rows = groupOwnerStaffAssignments([
    assignment(11, 101, 1, 'Sân Ecopark'),
    assignment(12, 101, 2, 'Sân Nghĩa Trụ'),
    assignment(21, 202, 3, 'Sân Trung Tâm'),
  ]);

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].venueIds, [1, 2]);
  assert.deepEqual(rows[0].assignedVenues.map((venue) => venue.venueName), [
    'Sân Ecopark',
    'Sân Nghĩa Trụ',
  ]);
});

test('row status and managed venues follow the active assignments', () => {
  const [row] = groupOwnerStaffAssignments([
    assignment(11, 101, 1, 'Sân đang quản lý'),
    assignment(12, 101, 2, 'Sân đã thu hồi', false),
  ]);

  assert.equal(row.isActive, true);
  assert.deepEqual(row.venueIds, [1]);
  assert.deepEqual(row.assignedVenues, [
    { staffId: 11, venueId: 1, venueName: 'Sân đang quản lý', isActive: true },
    { staffId: 12, venueId: 2, venueName: 'Sân đã thu hồi', isActive: false },
  ]);
});
