import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('player, owner, and admin have independent Vite entries', () => {
  for (const target of ['player', 'owner', 'admin']) {
    assert.ok(existsSync(new URL(`../../apps/${target}/index.html`, import.meta.url)));
    assert.ok(existsSync(new URL(`../../apps/${target}/src/main.tsx`, import.meta.url)));

    const config = read(`vite.${target}.config.ts`);
    assert.ok(config.includes(`createAppViteConfig('${target}')`));
  }
});

test('Vite targets have unique ports, caches, and output directories', () => {
  const config = read('vite.shared.config.ts');
  const packageJson = read('package.json');
  const artifactVerifier = read('scripts/verify-build-isolation.mjs');

  assert.match(config, /player: \{ devPort: 3000, previewPort: 4173 \}/);
  assert.match(config, /owner: \{ devPort: 3001, previewPort: 4174 \}/);
  assert.match(config, /admin: \{ devPort: 3002, previewPort: 4175 \}/);
  assert.match(config, /'picklink-vite-cache', target/);
  assert.match(config, /'dist', target/);
  assert.match(config, /'apps', target/);
  assert.match(config, /preview: \{[\s\S]*?proxy,/);
  assert.ok(packageJson.includes('"verify:build-isolation"'));
  assert.match(artifactVerifier, /forbiddenMarkers/);
  assert.match(artifactVerifier, /Missing \$\{target\} build artifact/);

  for (const target of ['player', 'owner', 'admin']) {
    assert.ok(packageJson.includes(`"dev:${target}"`));
    assert.ok(packageJson.includes(`"build:${target}"`));
    assert.ok(packageJson.includes(`"preview:${target}"`));
  }
});

test('development proxy closes abandoned realtime upstream streams', () => {
  const config = read('vite.shared.config.ts');

  assert.match(config, /request\.url\?\.startsWith\('\/api\/realtime\/'\)/);
  assert.match(config, /request\.once\('aborted'/);
  assert.match(config, /response\.once\('close'/);
  assert.match(config, /clientSocket\?\.once\('close'/);
  assert.match(config, /proxyResponse\.destroy\(\)/);
});

test('route prefetch modules do not rejoin role-specific bundles', () => {
  const player = read('src/navigation/routePrefetch.ts');
  const owner = read('src/navigation/ownerRoutePrefetch.ts');
  const admin = read('src/navigation/adminRoutePrefetch.ts');

  assert.doesNotMatch(player, /pages\/(admin|owner|staff)\//);
  assert.doesNotMatch(owner, /pages\/admin\//);
  assert.doesNotMatch(admin, /pages\/(owner|staff|home|matches)\//);
});
