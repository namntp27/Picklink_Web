import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path: string) => readFileSync(new URL('../../../' + path, import.meta.url), 'utf8');

test('ticketing routes stay separate from matchmaking and cover every role workspace', () => {
  const playerApp = read('apps/player/src/PlayerApp.tsx');
  const ownerApp = read('apps/owner/src/OwnerApp.tsx');
  const ownerShell = read('src/pages/owner/components/OwnerShell.tsx');

  assert.match(playerApp, /path="ticket-sessions"/);
  assert.match(playerApp, /path="ticket-sessions\/:id"/);
  assert.match(playerApp, /path="my-tickets"/);
  assert.match(playerApp, /path="my-tickets\/:id"/);
  assert.match(ownerApp, /path="\/owner\/ticket-sessions"/);
  assert.match(ownerApp, /path="\/owner\/ticket-sessions\/:id"/);
  assert.match(ownerShell, /id: 'ticketSessions'/);
  assert.match(ownerShell, /id: 'matchBookings'/);
});

test('owner and staff ticketing screens expose protected lifecycle actions', () => {
  const ownerList = read('src/pages/owner/OwnerTicketSessions.tsx');
  const ownerDetail = read('src/pages/owner/OwnerTicketSessionDetail.tsx');
  const staff = read('src/pages/staff/StaffDashboard.tsx');

  assert.match(ownerList, /createOwnerTicketSession/);
  assert.match(ownerList, /getOwnerVenues/);
  assert.match(ownerDetail, /publishOwnerTicketSession/);
  assert.match(ownerDetail, /cancelOwnerTicketSession/);
  assert.doesNotMatch(ownerDetail, /completeOwnerTicketRefund/);
  assert.doesNotMatch(ownerDetail, /completeOwnerAdditionalRefund/);
  assert.match(ownerDetail, /Vé đã thanh toán không được hoàn lại/);
  assert.match(ownerList, /max=\{maxTicketSessionDate\(\)\}/);
  assert.match(ownerDetail, /max=\{maxTicketSessionDate\(\)\}/);
  assert.match(ownerDetail, /checkInOwnerSessionTicket/);
  assert.match(ownerDetail, /onSubmit={submitCheckIn}/);
  assert.match(ownerDetail, /ticket\.status === 'Paid'\s*&& ticket\.paymentStatus === 'Paid'/);
  assert.match(ownerDetail, /ticket\.status === 'CheckedIn'\s*\|\| Boolean\(ticket\.checkedInAt\)/);
  assert.match(staff, /getStaffTicketSessions/);
  assert.match(staff, /getStaffTicketSessionParticipants/);
  assert.match(staff, /checkInSessionTicket/);
  assert.match(staff, /participant\.paymentStatus === 'Paid'/);
  assert.match(staff, /participant\.ticketStatus === 'CheckedIn'/);
});

test('owner schedule renders and creates ticket sessions without exposing schedule-entry deletion', () => {
  const dashboard = read('src/pages/owner/OwnerDashboard.tsx');
  const timeline = read('src/pages/owner/components/OwnerTimelineGrid.tsx');

  assert.match(dashboard, /selectedSlotItem\.entryType === 'TicketSession'/);
  assert.match(dashboard, /to="\/owner\/ticket-sessions"/);
  assert.match(dashboard, /createOwnerTicketSession/);
  assert.match(dashboard, /<option value="TicketSession">Xé vé<\/option>/);
  assert.doesNotMatch(dashboard, /<option value="Event">/);
  assert.match(timeline, /TicketSession: 'Xé vé'/);
});
test('owner shell exposes realtime payment and ticket notifications', () => {
  const playerApp = read('apps/player/src/PlayerApp.tsx');
  const ownerApp = read('apps/owner/src/OwnerApp.tsx');
  const ownerShell = read('src/pages/owner/components/OwnerShell.tsx');
  const ownerNotifications = read('src/pages/owner/OwnerNotifications.tsx');
  const notificationsApi = read('src/api/notifications.ts');
  const notificationsPage = read('src/pages/notifications/Notifications.tsx');

  // Shared with Header/AdminShell/Notifications via useUnreadNotificationCount instead of
  // OwnerShell keeping its own fetch + realtime subscription.
  assert.match(ownerShell, /useUnreadNotificationCount/);
  assert.match(playerApp, /allowedRoles=\{\['player'\]\}[\s\S]*?<Route path="notifications"/);
  assert.equal((playerApp.match(/path="notifications"/g) ?? []).length, 1);
  assert.match(ownerApp, /path="\/owner\/notifications"/);
  assert.match(ownerShell, /to="\/owner\/notifications"/);
  assert.match(ownerNotifications, /OwnerShell activeId="notifications"/);
  assert.match(ownerNotifications, /Notifications workspace="owner"/);
  assert.match(ownerShell, /unreadNotificationCount/);
  assert.match(notificationsApi, /'ticket'/);
  assert.match(notificationsPage, /value: 'ticket'/);
});
