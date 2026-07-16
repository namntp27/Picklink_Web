import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/clubs/CreateClub.tsx', import.meta.url), 'utf8');

test('create club form lets users choose a local cover image before creating the club', () => {
  assert.match(source, /from '..\/..\/api\/cloudinary';/);
  assert.match(source, /const \[coverFile, setCoverFile\] = useState<File \| null>\(null\);/);
  assert.match(source, /const \[coverPreviewUrl, setCoverPreviewUrl\] = useState<string \| null>\(null\);/);
  assert.match(source, /URL\.createObjectURL\(coverFile\)/);
  assert.match(source, /URL\.revokeObjectURL\(previewUrl\)/);
  assert.match(source, /accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(source, /type="file"/);
  assert.match(source, /coverPreviewUrl \?/);
});

test('create club uploads the selected cover image and sends its URL as coverImageUrl', () => {
  assert.match(source, /const uploadedCover = coverFile\s*\?\s*await uploadToCloudinary\(token, coverFile/);
  assert.match(source, /coverImageUrl: uploadedCover\?\.url/);
  assert.match(source, /setUploadProgress/);
});
