import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageSource = readFileSync(new URL('../../../src/pages/owner/OwnerDashboard.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/owner.ts', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../../../src/App.tsx', import.meta.url), 'utf8');
const ownerMessagesSource = readFileSync(new URL('../../../src/pages/owner/OwnerMessages.tsx', import.meta.url), 'utf8');
const ownerShellSource = readFileSync(new URL('../../../src/pages/owner/components/OwnerShell.tsx', import.meta.url), 'utf8');
const ownerCssSource = readFileSync(new URL('../../../src/pages/owner/owner.css', import.meta.url), 'utf8');

test('owner schedule booking drawer shows slot check-in status', () => {
  assert.match(pageSource, /Trạng thái check-in/);
  assert.ok(pageSource.includes('selectedSlot.checkInStatus'));
  assert.match(apiSource, /checkInStatus\?: string \| null/);
});

test('owner schedule disables cancellation after any slot starts', () => {
  assert.ok(pageSource.includes('disabled={!selectedSlotItem.canCancel}'));
  assert.match(pageSource, /Booking đã bắt đầu hoặc có slot thuộc quá khứ nên không thể hủy/);
  assert.ok(apiSource.includes('canCancel: item.canCancel ?? true'));
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
