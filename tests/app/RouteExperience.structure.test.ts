import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const mainLayout = readFileSync(new URL('../../src/components/layout/MainLayout.tsx', import.meta.url), 'utf8');
const routeExperience = readFileSync(new URL('../../src/components/navigation/RouteExperience.tsx', import.meta.url), 'utf8');
const routeFallback = readFileSync(new URL('../../src/components/navigation/RouteLoadingFallback.tsx', import.meta.url), 'utf8');
const routePrefetch = readFileSync(new URL('../../src/navigation/routePrefetch.ts', import.meta.url), 'utf8');

test('route changes render immediately without a long sequential exit and enter', () => {
  assert.match(mainLayout, /mode="popLayout"/);
  assert.doesNotMatch(mainLayout, /mode="wait"/);
  assert.doesNotMatch(mainLayout, /scale:/);
  assert.match(mainLayout, /<Suspense fallback=\{<RouteLoadingFallback withHeaderOffset \/>\}>/);
});

test('route experience resets push navigation and prefetches links from user intent', () => {
  assert.match(routeExperience, /navigationType === 'POP'/);
  assert.match(routeExperience, /document\.documentElement\.scrollTop = 0/);
  assert.match(routeExperience, /pointerover/);
  assert.match(routeExperience, /pointerdown/);
  assert.match(routeExperience, /focusin/);
  assert.match(routeExperience, /prefetchRoute\(url\.pathname, token, url\.search\)/);
  assert.match(routePrefetch, /commonDataLoaders/);
  assert.match(routePrefetch, /prefetchApiData/);
  assert.match(routePrefetch, /getMatchDetail/);
});

test('lazy route fallback reserves page geometry with accessible skeletons', () => {
  assert.match(routeFallback, /aria-live="polite"/);
  assert.match(routeFallback, /min-h-\[calc\(100dvh-4rem\)\]/);
  assert.match(routeFallback, /motion-reduce:animate-none/);
});
