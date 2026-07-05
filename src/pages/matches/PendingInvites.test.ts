import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pendingInvitesSource = readFileSync(
  new URL('./PendingInvites.tsx', import.meta.url),
  'utf8',
);

const matchesApiSource = readFileSync(
  new URL('../../api/matches.ts', import.meta.url),
  'utf8',
);

const profileApiSource = readFileSync(
  new URL('../../api/profile.ts', import.meta.url),
  'utf8',
);

const playerProfileDialogSource = readFileSync(
  new URL('./components/PlayerProfileDialog.tsx', import.meta.url),
  'utf8',
);

const matchVenueMapDialogSource = readFileSync(
  new URL('./components/MatchVenueMapDialog.tsx', import.meta.url),
  'utf8',
);

const bookCourtSource = readFileSync(
  new URL('../courts/BookCourt.tsx', import.meta.url),
  'utf8',
);

const createOpponentSource = readFileSync(
  new URL('./Opponents.tsx', import.meta.url),
  'utf8',
);

test('opponents search debounces free-text location filters before requesting matches', () => {
  assert.match(pendingInvitesSource, /debouncedProvince/);
  assert.match(pendingInvitesSource, /debouncedWard/);
  assert.match(pendingInvitesSource, /setTimeout/);
  assert.doesNotMatch(pendingInvitesSource, /province:\s*filters\.province\s*\|\|\s*undefined/);
  assert.doesNotMatch(pendingInvitesSource, /ward:\s*filters\.ward\s*\|\|\s*undefined/);
});

test('opponents search cancels stale match requests so old responses cannot overwrite new filters', () => {
  assert.match(pendingInvitesSource, /AbortController/);
  assert.match(pendingInvitesSource, /requestIdRef/);
  assert.match(pendingInvitesSource, /signal:\s*controller\.signal/);
  assert.match(matchesApiSource, /options:\s*Pick<RequestInit,\s*'signal'>/);
});

test('opponents cards expose the host avatar and open the public player profile', () => {
  assert.match(pendingInvitesSource, /hostAvatarUrl/);
  assert.match(pendingInvitesSource, /setSelectedHost\(match\)/);
  assert.match(pendingInvitesSource, /<PlayerProfileDialog/);
  assert.match(profileApiSource, /\/api\/Profile\/players\/\$\{playerId\}/);
});

test('public player profile dialog loads on demand and handles cancellation', () => {
  assert.match(playerProfileDialogSource, /getPublicPlayerProfile\(playerId/);
  assert.match(playerProfileDialogSource, /AbortController/);
  assert.match(playerProfileDialogSource, /controller\.abort\(\)/);
  assert.match(playerProfileDialogSource, /aria-modal="true"/);
});

test('opponents defaults to other hosts and exposes only mine or other choices', () => {
  assert.match(pendingInvitesSource, /owner:\s*'other'/);
  assert.match(pendingInvitesSource, /owner:\s*filters\.owner/);
  assert.match(pendingInvitesSource, /<option value="other">Của người khác<\/option>/);
  assert.match(pendingInvitesSource, /<option value="mine">Của tôi<\/option>/);
  assert.doesNotMatch(pendingInvitesSource, /<option value="all">Tất cả lời mời<\/option>/);
  assert.match(matchesApiSource, /owner\?:\s*'mine'\s*\|\s*'other'/);
});

test('opponents opens an on-demand map for preferred venues with coordinates', () => {
  assert.match(pendingInvitesSource, /setMappedMatch\(match\)/);
  assert.match(pendingInvitesSource, /<MatchVenueMapDialog/);
  assert.match(pendingInvitesSource, /typeof venue\.latitude === 'number'/);
  assert.match(pendingInvitesSource, /typeof venue\.longitude === 'number'/);
});

test('opponents cards render each selected availability slot instead of one broad time range', () => {
  assert.match(pendingInvitesSource, /Các slot đã chọn/);
  assert.match(pendingInvitesSource, /match\.availabilitySlots/);
  assert.match(pendingInvitesSource, /slot\.timeStart/);
  assert.match(pendingInvitesSource, /slot\.timeEnd/);
  assert.match(pendingInvitesSource, /match\.preferredTimeStart/);
  assert.doesNotMatch(pendingInvitesSource, />Giờ mong muốn</);
});

test('match venue map provides geolocation, driving distance, and route geometry', () => {
  assert.match(matchVenueMapDialogSource, /navigator\.geolocation\.watchPosition/);
  assert.match(matchVenueMapDialogSource, /enableHighAccuracy:\s*true/);
  assert.match(matchVenueMapDialogSource, /maximumAge:\s*0/);
  assert.match(matchVenueMapDialogSource, /coords\.accuracy/);
  assert.match(matchVenueMapDialogSource, /draggable/);
  assert.match(matchVenueMapDialogSource, /dragend/);
  assert.match(matchVenueMapDialogSource, /router\.project-osrm\.org\/table\/v1\/driving/);
  assert.match(matchVenueMapDialogSource, /router\.project-osrm\.org\/route\/v1\/driving/);
  assert.match(matchVenueMapDialogSource, /geometries=geojson/);
  assert.match(matchVenueMapDialogSource, /<Polyline/);
  assert.match(matchVenueMapDialogSource, /google\.com\/maps\/dir/);
});

test('match venue map uses a Google Maps-like route sidebar and visual language', () => {
  assert.match(matchVenueMapDialogSource, /lg:grid-cols-\[360px_minmax\(0,1fr\)\]/);
  assert.match(matchVenueMapDialogSource, /match-venue-map-google/);
  assert.match(matchVenueMapDialogSource, /#1a73e8/);
  assert.match(matchVenueMapDialogSource, /#ea4335/);
  assert.match(matchVenueMapDialogSource, /Mở trong Google Maps/);
});

test('book court reuses the route map for visible booking venues', () => {
  assert.match(bookCourtSource, /<MatchVenueMapDialog/);
  assert.match(bookCourtSource, /venues=\{mappedVenues\}/);
  assert.match(bookCourtSource, /Xem khoảng cách và lộ trình/);
  assert.match(bookCourtSource, /accuracy:\s*number/);
  assert.match(bookCourtSource, /enableHighAccuracy:\s*true/);
});

test('create opponent reuses the route map and keeps multi-venue selection synchronized', () => {
  assert.match(createOpponentSource, /<MatchVenueMapDialog/);
  assert.match(createOpponentSource, /selectedVenueIds=\{selectedVenueIds\}/);
  assert.match(createOpponentSource, /onVenueToggle=\{toggleVenue\}/);
  assert.match(createOpponentSource, /Xem khoảng cách và lộ trình/);
  assert.match(matchVenueMapDialogSource, /onVenueToggle/);
  assert.match(matchVenueMapDialogSource, /selectedVenueIds/);
  assert.match(createOpponentSource, /accuracy:\s*number/);
  assert.match(createOpponentSource, /enableHighAccuracy:\s*true/);
});
