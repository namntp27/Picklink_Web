import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = new URL('../../../../', import.meta.url);
const source = (relativePath: string) => readFileSync(new URL(relativePath, root), 'utf8');
const matchService = source('PicklinkBackend/PicklinkBackend/Services/Matches/MatchService.Open.cs');
const registration = source('PicklinkBackend/PicklinkBackend/Startup/ServiceRegistration.cs');
const bookingHold = source('PicklinkBackend/PicklinkBackend/Services/Bookings/BookingHoldExpirationService.cs');
const paymentService = source('PicklinkBackend/PicklinkBackend/Services/Payments/PaymentService.cs');
const detail = source('Picklink_Web/src/pages/matches/MatchDetail.tsx');
const api = source('Picklink_Web/src/api/matches.ts');

test('match rooms never expire and only cancel after the last approved player leaves', () => {
  assert.ok(!existsSync(new URL('PicklinkBackend/PicklinkBackend/Services/Matches/MatchExpirationService.cs', root)));
  assert.ok(!registration.includes('MatchExpirationService'));
  assert.ok(matchService.includes('var roomCancelled = remainingPlayers.Count == 0;'));
  assert.ok(matchService.includes('match.Status = "Cancelled";'));
  assert.ok(matchService.includes('match.HostPlayerId = nextHost.PlayerId;'));
  assert.ok(!matchService.includes('CancelOpenMatch('));
  assert.ok(!matchService.includes('ReopenMatch('));
  assert.ok(!matchService.includes('match.AvailableDateTo >= today'));
  assert.ok(bookingHold.includes('booking.Match.Status = "ReadyToBook";'));
  assert.ok(paymentService.includes('match.Status = "ReadyToBook";'));
  assert.ok(!api.includes('export const cancelMatch'));
  assert.ok(!api.includes('export const reopenMatch'));
  assert.ok(!detail.includes('cancelMatch(token, matchId)'));
  assert.ok(detail.includes("isApprovedMember && ['Recruiting', 'ReadyToBook'].includes(match.status)"));
});
