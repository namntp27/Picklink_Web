import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(
  new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url),
  'utf8',
);
const querySource = readFileSync(new URL('../../../src/hooks/useApiQuery.ts', import.meta.url), 'utf8');
const prefetchSource = readFileSync(new URL('../../../src/navigation/routePrefetch.ts', import.meta.url), 'utf8');

test('match room renders prefetched or revisited detail without an empty loading frame', () => {
  assert.match(detailSource, /data: match,\s*error: matchLoadError,\s*refresh: loadMatch,\s*\} = useApiQuery\(/s);
  assert.match(detailSource, /\['match-detail', token, matchId\]/);
  assert.match(detailSource, /\(\) => getMatchDetail\(token!, matchId\)/);
  assert.doesNotMatch(detailSource, /const \[match, setMatch\] = useState/);

  assert.match(querySource, /export const primeApiQueryCache/);
  assert.match(prefetchSource, /primeApiQueryCache\(\['match-detail', token, id\], detail\)/);
});
