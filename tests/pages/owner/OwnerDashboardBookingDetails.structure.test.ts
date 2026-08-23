import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageSource = readFileSync(new URL('../../../src/pages/owner/OwnerDashboard.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/owner.ts', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../../../apps/owner/src/OwnerApp.tsx', import.meta.url), 'utf8');
const ownerMessagesSource = readFileSync(new URL('../../../src/pages/owner/OwnerMessages.tsx', import.meta.url), 'utf8');
const ownerShellSource = readFileSync(new URL('../../../src/pages/owner/components/OwnerShell.tsx', import.meta.url), 'utf8');
const ownerCssSource = readFileSync(new URL('../../../src/pages/owner/owner.css', import.meta.url), 'utf8');

test('owner schedule booking drawer shows slot check-in status', () => {
  assert.match(pageSource, /Trạng thái check-in/);
  assert.ok(pageSource.includes('selectedSlot.checkInStatus'));
  assert.match(apiSource, /checkInStatus\?: string \| null/);
});

test('owner schedule disables cancellation per occurrence, not for the whole multi-slot booking', () => {
  // A whole-month package keeps its still-upcoming days cancellable even after an earlier day
  // started or was checked in — only the specific clicked occurrence gates the button.
  assert.ok(pageSource.includes('disabled={!selectedSlot!.canCancel}'));
  assert.match(pageSource, /Buổi này đã bắt đầu hoặc người chơi đã check-in nên không thể hủy/);
  assert.match(apiSource, /canCancel: boolean;/);
});

test('owner cancels just the clicked occurrence of a multi-slot booking, not the whole booking', () => {
  assert.ok(pageSource.includes('cancelOwnerBookingCheckInGroup(token, item.bookingId, groupId, cancelReason.trim())'));
  assert.match(pageSource, /const groupId = status === 'Cancelled' \? selectedSlot\?\.bookingCheckInGroupId : null;/);
  assert.ok(apiSource.includes('export const cancelOwnerBookingCheckInGroup'));
  assert.match(apiSource, /bookingCheckInGroupId\?: number \| null;/);
});

test('owner messages are separate from the player community inbox', () => {
  assert.ok(pageSource.includes('Liên hệ khách hàng'));
  assert.ok(pageSource.includes('/owner/messages?chatWithUserId=${selectedSlotItem.customerUserId}&bookingId=${selectedSlotItem.bookingId}'));
  assert.match(apiSource, /customerUserId\?: number \| null/);
  assert.ok(appSource.includes('<Route path="/owner/messages" element={<OwnerMessages />} />'));
  assert.doesNotMatch(appSource, /allowedRoles=\{\['player', 'owner'\]\}/);
  assert.ok(ownerShellSource.includes('Tin nhắn khách hàng'));
  assert.ok(ownerShellSource.includes('to="/owner/messages"'));
  assert.ok(ownerShellSource.includes("activeId === 'messages'"));
  assert.ok(ownerShellSource.includes('useUnreadMessageSenderCount'));
  assert.ok(ownerShellSource.includes('unreadMessageSenderCount'));
  assert.ok(ownerShellSource.includes('Math.min(unreadMessageSenderCount, 99)'));
  assert.doesNotMatch(ownerShellSource, /\{ id: 'messages'/);
  assert.ok(ownerMessagesSource.includes('<OwnerShell activeId="messages"'));
  assert.ok(ownerMessagesSource.includes('getDirectConversations'));
  assert.ok(ownerMessagesSource.includes('conversation.unreadMessageCount > 0'));
  assert.ok(ownerMessagesSource.includes('tin chưa đọc'));
  assert.ok(ownerMessagesSource.includes('unreadMessageCount: 0'));
  assert.ok(ownerMessagesSource.includes('getOwnerBooking'));
  assert.ok(ownerMessagesSource.includes('contentClassName="owner-messages-content"'));
  assert.ok(ownerMessagesSource.includes('innerClassName="owner-messages-inner max-w-[1500px]"'));
  assert.doesNotMatch(ownerMessagesSource, /min-h-\[680px\]|max-h-\[590px\]/);
  assert.match(ownerCssSource, /height: calc\(100dvh - 60px\)/);
  assert.match(ownerCssSource, /grid-template-rows: auto minmax\(0, 1fr\)/);
  assert.doesNotMatch(ownerMessagesSource, /getGroups|groupToConversation|sendGroupMessage/);
});
