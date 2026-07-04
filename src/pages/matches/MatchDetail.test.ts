import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const matchDetailSource = readFileSync(
  new URL('./MatchDetail.tsx', import.meta.url),
  'utf8',
);

const communityCss = readFileSync(
  new URL('../community/community.css', import.meta.url),
  'utf8',
);

const matchesApiSource = readFileSync(
  new URL('../../api/matches.ts', import.meta.url),
  'utf8',
);

const paymentApiSource = readFileSync(
  new URL('../../api/payment.ts', import.meta.url),
  'utf8',
);

test('match detail visually distinguishes host and regular members', () => {
  assert.match(matchDetailSource, /match-member-card--host/);
  assert.match(matchDetailSource, /match-member-card--participant/);
  assert.match(matchDetailSource, /match-role-badge--host/);
  assert.match(matchDetailSource, /match-role-badge--participant/);
  assert.match(matchDetailSource, /aria-label=.*Chủ phòng/);

  assert.match(communityCss, /\.match-member-card--host/);
  assert.match(communityCss, /\.match-member-card--participant/);
  assert.match(communityCss, /\.match-role-badge--host/);
  assert.match(communityCss, /\.match-role-badge--participant/);
});

test('match detail previews and submits one receipt for multiple selected payment shares', () => {
  assert.match(matchesApiSource, /paymentId\?: number \| null/);
  assert.match(matchesApiSource, /qrImageUrl\?: string \| null/);
  assert.match(matchesApiSource, /transferContent\?: string \| null/);
  assert.match(matchesApiSource, /paymentRejectionReason\?: string \| null/);

  assert.match(paymentApiSource, /export type BatchPaymentPreview/);
  assert.match(paymentApiSource, /previewBatchPayment/);
  assert.match(paymentApiSource, /submitBatchBankTransfer/);
  assert.match(paymentApiSource, /payerIds\.forEach/);
  assert.match(paymentApiSource, /formData\.append\('payerIds', String\(payerId\)\)/);

  assert.match(matchDetailSource, /selectedPaymentPlayerIds/);
  assert.match(matchDetailSource, /paymentTargets/);
  assert.match(matchDetailSource, /type="checkbox"/);
  assert.match(matchDetailSource, /batchPreview\.totalAmount/);
  assert.match(matchDetailSource, /Gửi thanh toán cho/);
  assert.match(matchDetailSource, /submitBatchBankTransfer\(token, match\.bookingId!, selectedPaymentPlayerIds, receipt\)/);
});

test('match detail renders voted slots yellow while selected slots stay black', () => {
  assert.match(matchDetailSource, /match-slot-button--selected/);
  assert.match(matchDetailSource, /match-slot-button--voted/);

  const votedIndex = communityCss.indexOf('.match-slot-button--voted');
  const selectedIndex = communityCss.indexOf('.match-slot-button--selected');

  assert.ok(votedIndex >= 0, 'Missing voted slot CSS rule.');
  assert.ok(selectedIndex > votedIndex, 'Selected slot CSS must be declared after voted CSS to win the cascade.');
  assert.match(communityCss, /\.match-slot-button--voted[\s\S]*#facc15/);
  assert.match(communityCss, /\.match-slot-button--selected[\s\S]*#0b2228/);
});

test('approved host or member can create a booking when the match is ready', () => {
  assert.match(matchDetailSource, /isApprovedMember && match\.status === 'ReadyToBook'/);
  assert.match(matchDetailSource, /Chủ phòng hoặc thành viên đã được duyệt/);
  assert.match(matchDetailSource, /<button[^>]+onClick=\{createBooking\}[^>]*>[\s\S]*Tạo booking và chuyển sang thanh toán/);
  assert.doesNotMatch(matchDetailSource, /Chỉ chủ phòng mới/);
  assert.doesNotMatch(matchDetailSource, /match\.isHost\s*\?\s*\(/);
});

test('match detail wires compatible slot voting API and guidance', () => {
  assert.match(matchesApiSource, /export type MatchSlotOption/);
  assert.match(matchesApiSource, /getMatchSlotOptions/);
  assert.match(matchesApiSource, /voteMatchSlot/);
  assert.match(matchesApiSource, /unvoteMatchSlot/);

  assert.match(matchDetailSource, /getMatchSlotOptions/);
  assert.match(matchDetailSource, /voteMatchSlot/);
  assert.match(matchDetailSource, /unvoteMatchSlot/);
  assert.match(matchDetailSource, /match-slot-button--compatible/);
  assert.match(matchDetailSource, /Rảnh/);
  assert.match(matchDetailSource, /Dùng chat để thảo luận, vote các slot rảnh chung rồi tạo booking khi cả nhóm chốt\./);
});
