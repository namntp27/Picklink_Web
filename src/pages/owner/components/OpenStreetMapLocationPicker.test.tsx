import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  LocationSearchControls,
  submitSearchOnEnter,
} from './LocationSearchControls';
import { createLocationSelectionController } from './locationSelection';

test('location search does not nest a form inside the venue form', () => {
  const markup = renderToStaticMarkup(
    <form>
      <LocationSearchControls
        isSearching={false}
        onQueryChange={() => undefined}
        onSearch={() => undefined}
        query=""
      />
    </form>,
  );
  assert.equal(markup.match(/<form/g)?.length, 1);
  assert.match(markup, /type="button"/);
});

test('Enter prevents the outer form submit and runs only search', () => {
  let prevented = false;
  let searches = 0;
  submitSearchOnEnter(
    { key: 'Enter', preventDefault: () => { prevented = true; } },
    () => { searches += 1; },
  );
  assert.equal(prevented, true);
  assert.equal(searches, 1);
});

test('reverse lookup failure clears a stale address while retaining coordinates', async () => {
  const controller = createLocationSelectionController(async () => {
    throw new Error('offline');
  });
  assert.deepEqual(await controller.select(21, 105), {
    status: 'failure',
    value: { address: '', latitude: '21.0000000', longitude: '105.0000000' },
  });
});

test('an older reverse response cannot overwrite a newer selection', async () => {
  const pending = new Map<number, (address: string) => void>();
  const controller = createLocationSelectionController(
    (lat) => new Promise<string>((resolve) => pending.set(lat, resolve)),
  );
  const first = controller.select(21, 105);
  const second = controller.select(22, 106);
  pending.get(22)?.('B');
  assert.equal((await second).status, 'success');
  pending.get(21)?.('A');
  assert.deepEqual(await first, { status: 'stale' });
});
