import assert from 'node:assert/strict';
import { test } from 'node:test';

import { repairMojibake } from '../../src/utils/textEncoding';

const makeMojibake = (value: string) => new TextDecoder('windows-1252').decode(new TextEncoder().encode(value));

test('repairMojibake fixes stored payment history text', () => {
  const original = 'Player x\u00e1c nh\u1eadn \u0111\u00e3 chuy\u1ec3n kho\u1ea3n';

  assert.equal(repairMojibake(makeMojibake(makeMojibake(original))), original);
  assert.equal(repairMojibake('sai ti\u1ec1n'), 'sai ti\u1ec1n');
  assert.equal(repairMojibake(null), '');
});