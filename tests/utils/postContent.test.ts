import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getPostDisplayText } from '../../src/utils/postContent';

test('extracts readable text from a serialized community post', () => {
  const content = JSON.stringify({
    title: '',
    body: 'Lorem ipsum dolor sit amet.',
    location: '',
    mode: 'discussion',
    lookingFor: false,
    slots: '',
    levelRange: '',
    playTime: '',
    matchId: null,
    tags: [],
  });

  assert.equal(getPostDisplayText(content), 'Lorem ipsum dolor sit amet.');
});

test('ignores encoded trailing spaces after a serialized post', () => {
  const content = '{"title":"","body":"Nội dung bài viết","tags":[]} &#x20;';

  assert.equal(getPostDisplayText(content), 'Nội dung bài viết');
});

test('keeps legacy plain-text posts unchanged', () => {
  assert.equal(getPostDisplayText('Bài viết cũ &#x20;'), 'Bài viết cũ &#x20;');
  assert.equal(getPostDisplayText(null), '');
});

test('includes a stored title when one is present', () => {
  assert.equal(
    getPostDisplayText('{"title":"Kèo tối nay","body":"Cần thêm hai người chơi"}'),
    'Kèo tối nay\nCần thêm hai người chơi',
  );
});
