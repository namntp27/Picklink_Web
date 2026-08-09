import type { OwnerStaffAssignment, StaffPermission } from '../../api/owner';

export type OwnerStaffVenueAssignment = {
  staffId: number;
  venueId: number;
  venueName: string;
  isActive: boolean;
};

export type OwnerStaffRow = OwnerStaffAssignment & {
  venueIds: number[];
  assignedVenues: OwnerStaffVenueAssignment[];
};

export const groupOwnerStaffAssignments = (
  assignments: OwnerStaffAssignment[],
): OwnerStaffRow[] => {
  const assignmentsByUser = new Map<number, OwnerStaffAssignment[]>();

  assignments.forEach((assignment) => {
    const current = assignmentsByUser.get(assignment.userId) ?? [];
    current.push(assignment);
    assignmentsByUser.set(assignment.userId, current);
  });

  return Array.from(assignmentsByUser.values()).map((userAssignments) => {
    const activeAssignments = userAssignments.filter((assignment) => assignment.isActive);
    const managedAssignments = activeAssignments.length ? activeAssignments : userAssignments;
    const representative = managedAssignments[0];
    const permissions = Array.from(new Set(
      managedAssignments.flatMap((assignment) => assignment.permissions),
    )) as StaffPermission[];
    const venuesById = new Map<number, OwnerStaffVenueAssignment>();

    userAssignments.forEach((assignment) => {
      const existing = venuesById.get(assignment.venueId);
      if (!existing || assignment.isActive) {
        venuesById.set(assignment.venueId, {
          staffId: assignment.staffId,
          venueId: assignment.venueId,
          venueName: assignment.venueName,
          isActive: assignment.isActive,
        });
      }
    });

    return {
      ...representative,
      permissions,
      isActive: activeAssignments.length > 0,
      venueIds: Array.from(new Set(managedAssignments.map((assignment) => assignment.venueId))),
      assignedVenues: Array.from(venuesById.values()),
    };
  });
};
