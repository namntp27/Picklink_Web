import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer, type ViteDevServer } from 'vite';
import type { TicketSessionInput } from '../../src/api/ticketing';

let ticketing: typeof import('../../src/api/ticketing');
let vite: ViteDevServer;

before(async () => {
  vite = await createServer({
    appType: 'custom',
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, ws: false, middlewareMode: true },
  });
  ticketing = await vite.ssrLoadModule('/src/api/ticketing.ts') as typeof ticketing;
});

after(async () => {
  await vite.close();
});

test('public discovery sends every supported ticket-session filter', async (context) => {
  const originalFetch = globalThis.fetch;
  let requestUrl = '';
  let authorization: string | null = null;

  globalThis.fetch = (async (input, init) => {
    requestUrl = String(input);
    authorization = new Headers(init?.headers).get('Authorization');
    return Response.json({ items: [], page: 2, pageSize: 12, totalCount: 0, totalPages: 0 });
  }) as typeof fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  await ticketing.getTicketSessions({
    search: 'cuối tuần',
    venueId: 7,
    date: '2026-07-20',
    skillLevel: '3',
    playFormat: '2vs2',
    minPrice: 50000,
    maxPrice: 150000,
    onlyAvailable: true,
    page: 2,
    pageSize: 12,
  });

  const url = new URL(requestUrl, 'http://localhost');
  assert.equal(url.pathname, '/api/ticket-sessions');
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    search: 'cuối tuần',
    venueId: '7',
    date: '2026-07-20',
    skillLevel: '3',
    playFormat: '2vs2',
    minPrice: '50000',
    maxPrice: '150000',
    onlyAvailable: 'true',
    page: '2',
    pageSize: '12',
  });
  assert.equal(authorization, null);
});

test('player, owner and staff commands follow the ticketing backend contract', async (context) => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ path: string; method: string; body: unknown; authorization: string | null }> = [];

  globalThis.fetch = (async (input, init) => {
    calls.push({
      path: new URL(String(input), 'http://localhost').pathname,
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      authorization: new Headers(init?.headers).get('Authorization'),
    });
    return Response.json({});
  }) as typeof fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const input: TicketSessionInput = {
    venueId: 2,
    courtId: 5,
    date: '2026-07-21',
    startTime: '18:00:00',
    endTime: '20:00:00',
    title: 'Kèo tối thứ ba',
    description: 'Vui vẻ',
    skillLevel: '3',
    playFormat: '2vs2',
    maxPlayers: 8,
    ticketPrice: 80000,
  };

  await ticketing.buySessionTicket('token', 11);
  await ticketing.cancelPlayerTicket('token', 22, 'Bận đột xuất');
  await ticketing.createOwnerTicketSession('token', input);
  await ticketing.updateOwnerTicketSession('token', 11, input);
  await ticketing.publishOwnerTicketSession('token', 11);
  await ticketing.cancelOwnerTicketSession('token', 11, 'Sân bảo trì');
  await ticketing.getOwnerTicketSessionParticipants('token', 11);
  await ticketing.checkInOwnerSessionTicket('token', 11, ' PLT-OWNER123 ');
  await ticketing.completeOwnerTicketRefund('token', 11, 22, 'REF-22');
  await ticketing.completeOwnerAdditionalRefund('token', 11, 22, 33, 'REF-33');
  await ticketing.getStaffTicketSessionParticipants('token', 11);
  await ticketing.checkInSessionTicket('token', 'PLT-ABC123');

  assert.deepEqual(calls.map(({ path, method, body }) => ({ path, method, body })), [
    { path: '/api/ticket-sessions/11/tickets', method: 'POST', body: undefined },
    { path: '/api/player/tickets/22/cancel', method: 'POST', body: { reason: 'Bận đột xuất' } },
    { path: '/api/owner/ticket-sessions', method: 'POST', body: input },
    { path: '/api/owner/ticket-sessions/11', method: 'PUT', body: input },
    { path: '/api/owner/ticket-sessions/11/publish', method: 'POST', body: undefined },
    { path: '/api/owner/ticket-sessions/11/cancel', method: 'POST', body: { reason: 'Sân bảo trì' } },
    { path: '/api/owner/ticket-sessions/11/participants', method: 'GET', body: undefined },
    { path: '/api/owner/ticket-sessions/11/tickets/check-in', method: 'POST', body: { ticketCode: 'PLT-OWNER123' } },
    { path: '/api/owner/ticket-sessions/11/tickets/22/refund', method: 'POST', body: { reference: 'REF-22' } },
    { path: '/api/owner/ticket-sessions/11/tickets/22/sepay-transactions/33/refund', method: 'POST', body: { reference: 'REF-33' } },
    { path: '/api/staff/ticket-sessions/11/participants', method: 'GET', body: undefined },
    { path: '/api/staff/tickets/check-in', method: 'POST', body: { ticketCode: 'PLT-ABC123' } },
  ]);
  assert.ok(calls.every((call) => call.authorization === 'Bearer token'));
});
