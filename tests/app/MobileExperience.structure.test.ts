import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const globalCss = readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8');
const header = readFileSync(new URL('../../src/components/layout/Header.tsx', import.meta.url), 'utf8');
const messages = readFileSync(new URL('../../src/pages/messages/Messages.tsx', import.meta.url), 'utf8');
const ownerMessages = readFileSync(new URL('../../src/pages/owner/OwnerMessages.tsx', import.meta.url), 'utf8');
const clubDashboard = readFileSync(new URL('../../src/pages/clubs/ClubDashboard.tsx', import.meta.url), 'utf8');

test('mobile viewport and shared controls keep the safe viewport without disabling zoom', () => {
  assert.match(indexHtml, /lang="vi"/);
  assert.match(indexHtml, /width=device-width, initial-scale=1/);
  assert.doesNotMatch(indexHtml, /user-scalable=no|maximum-scale=1/);
  assert.match(globalCss, /env\(safe-area-inset-bottom\)/);
  assert.match(globalCss, /font-size: 16px !important/);
});

test('mobile navigation and message screens keep one scroll surface at a time', () => {
  assert.match(header, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(messages, /activeConversationId \? 'hidden lg:flex' : 'flex'/);
  assert.match(messages, /Quay lại danh sách hội thoại/);
  assert.match(ownerMessages, /isMobileListOpen \? 'flex' : 'hidden'/);
  assert.match(ownerMessages, /setIsMobileListOpen\(true\)/);
  assert.doesNotMatch(clubDashboard, /grid h-\[680px\] grid-cols-1/);
  assert.match(clubDashboard, /h-\[calc\(100dvh-10rem\)\]/);
});
