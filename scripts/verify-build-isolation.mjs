import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, 'dist');
const forbiddenMarkers = {
  player: ['/admin/users', '/owner/bookings', 'AdminDashboard', 'OwnerDashboard'],
  owner: ['/admin/users', '/my-bookings', 'AdminDashboard', 'MyBookings'],
  admin: ['/owner/bookings', '/my-bookings', 'OwnerDashboard', 'MyBookings'],
};

const filesBelow = (directory) => readdirSync(directory).flatMap((name) => {
  const absolutePath = path.join(directory, name);
  return statSync(absolutePath).isDirectory() ? filesBelow(absolutePath) : [absolutePath];
});

for (const [target, markers] of Object.entries(forbiddenMarkers)) {
  const appDist = path.join(distRoot, target);
  const indexHtml = path.join(appDist, 'index.html');
  if (!existsSync(indexHtml)) throw new Error(`Missing ${target} build artifact`);

  const javascript = filesBelow(appDist)
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  const leakedMarker = markers.find((marker) => javascript.includes(marker));
  if (leakedMarker) {
    throw new Error(`${target} bundle contains a route or page from another app: ${leakedMarker}`);
  }
}

console.log('Verified isolated player, owner, and admin build artifacts.');
