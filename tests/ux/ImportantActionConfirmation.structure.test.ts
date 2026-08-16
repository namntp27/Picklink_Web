import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const readSource = (relativePath: string) => readFileSync(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8',
);

const sourceFilesUnder = (relativeDirectory: string): string[] => {
  const directory = new URL(`../../${relativeDirectory}/`, import.meta.url);
  return readdirSync(directory).flatMap((entry) => {
    const child = `${relativeDirectory}/${entry}`;
    if (statSync(new URL(`../../${child}`, import.meta.url)).isDirectory()) return sourceFilesUnder(child);
    return entry.endsWith('.tsx') || entry.endsWith('.ts') ? [child] : [];
  });
};

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
    assert.match(
      readSource(relativePath),
      /await (confirm|prompt)\(\{/,
      `${relativePath} must confirm critical actions`,
    );
  }
});

test('no screen falls back to a native browser dialog', () => {
  // Native dialogs ignore the app's styling and can be suppressed by the browser, which silently
  // turns "are you sure?" into "nothing happened". Every screen goes through ConfirmDialogProvider.
  const offenders = sourceFilesUnder('src/pages')
    .filter((file) => /window\.(confirm|alert|prompt)\(/.test(readSource(file)));

  assert.deepEqual(offenders, []);
});

test('match membership and replacement accept/reject buttons cannot call APIs immediately', () => {
  const detail = readSource('src/pages/matches/MatchDetail.tsx');
  const replacementPanel = readSource('src/pages/matches/MatchSlotReplacementPanel.tsx');

  assert.match(detail, /await confirm\(\{ title: `Chấp nhận \$\{participant\.playerName\} vào phòng\?`/);
  assert.match(detail, /await confirm\(\{ title: `Từ chối yêu cầu tham gia của \$\{participant\.playerName\}\?`/);
  assert.match(replacementPanel, /await confirm\(\{ title: `Duyệt \$\{request\.playerName\} vào nhóm thay thế/);
  assert.match(replacementPanel, /await confirm\(\{ title: `Từ chối \$\{request\.playerName\} chơi thay/);
});
