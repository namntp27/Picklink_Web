import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (relativePath: string) => readFileSync(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8',
);

test('critical decisions across player, club, admin, and owner surfaces require confirmation', () => {
  const criticalSurfaces = [
    'src/pages/matches/MatchDetail.tsx',
    'src/pages/matches/MatchSlotReplacementPanel.tsx',
    'src/pages/matches/QueueDetail.tsx',
    'src/pages/clubs/ClubDashboard.tsx',
    'src/pages/clubs/ClubDetail.tsx',
    'src/pages/messages/Messages.tsx',
    'src/pages/admin/AdminCourts.tsx',
    'src/pages/admin/AdminReports.tsx',
    'src/pages/admin/AdminReviews.tsx',
    'src/pages/admin/AdminTransactions.tsx',
    'src/pages/admin/AdminUsers.tsx',
    'src/pages/owner/OwnerBookingDetail.tsx',
    'src/pages/owner/OwnerDashboard.tsx',
    'src/pages/owner/OwnerStaff.tsx',
    'src/pages/owner/components/OwnerTransactionReviewModal.tsx',
    'src/pages/owner/components/OwnerMatchTransactionReviewModal.tsx',
    'src/pages/courts/Checkout.tsx',
    'src/pages/matches/MatchCheckout.tsx',
  ];

  for (const relativePath of criticalSurfaces) {
    assert.match(readSource(relativePath), /window\.confirm\(/, `${relativePath} must confirm critical actions`);
  }
});

test('match membership and replacement accept/reject buttons cannot call APIs immediately', () => {
  const detail = readSource('src/pages/matches/MatchDetail.tsx');
  const replacementPanel = readSource('src/pages/matches/MatchSlotReplacementPanel.tsx');

  assert.match(detail, /window\.confirm\(`Chấp nhận \$\{participant\.playerName\} vào phòng\?`\)/);
  assert.match(detail, /window\.confirm\(`Từ chối yêu cầu tham gia của \$\{participant\.playerName\}\?`\)/);
  assert.match(replacementPanel, /window\.confirm\(`Duyệt \$\{request\.playerName\} vào nhóm thay thế/);
  assert.match(replacementPanel, /window\.confirm\(`Từ chối \$\{request\.playerName\} chơi thay/);
});
