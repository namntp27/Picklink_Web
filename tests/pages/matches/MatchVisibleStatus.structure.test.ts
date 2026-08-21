import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = new URL('../../../../', import.meta.url);
const source = (relativePath: string) => readFileSync(new URL(relativePath, root), 'utf8');

test('visible match rooms expose only member-driven room statuses', () => {
  const api = source('Picklink_Web/src/api/matches.ts');
  const detail = source('Picklink_Web/src/pages/matches/MatchDetail.tsx');
  const list = source('Picklink_Web/src/pages/matches/MyMatches.tsx');
  const service = source('PicklinkBackend/PicklinkBackend/Services/Matches/Implementations/MatchService.cs');
  const roomStatusLabels = detail.slice(
    detail.indexOf('const statusLabels'),
    detail.indexOf('const paymentStatusLabels'),
  );

  assert.match(api, /export type MatchStatus =\s*\| 'Recruiting'\s*\| 'ReadyToBook';/);
  assert.match(api, /operationalStatus: MatchOperationalStatus;/);
  assert.match(service, /Status = MatchRoomLifecyclePolicy\.RoomStatusFor/);
  assert.match(service, /OperationalStatus = match\.Status/);
  assert.doesNotMatch(roomStatusLabels, /Expired: 'Đã hết hạn'/);
  assert.doesNotMatch(list, /Expired: \{ label: 'Đã hết hạn'/);
});

test('booking controls use operational status instead of the displayed room status', () => {
  const detail = source('Picklink_Web/src/pages/matches/MatchDetail.tsx');

  assert.match(detail, /match\.operationalStatus === 'BookingPending'/);
  assert.match(detail, /match\.operationalStatus === 'Completed'/);
});
