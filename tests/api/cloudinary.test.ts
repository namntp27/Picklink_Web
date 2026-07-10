import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer, type ViteDevServer } from 'vite';

let cloudinary: typeof import('../../src/api/cloudinary');
let vite: ViteDevServer;

before(async () => {
  vite = await createServer({
    appType: 'custom',
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, ws: false, middlewareMode: true },
  });
  cloudinary = await vite.ssrLoadModule('/src/api/cloudinary.ts') as typeof cloudinary;
});

after(async () => {
  await vite.close();
});

test('upload signs only the folder and uses the server timestamp', async (context) => {
  const originalFetch = globalThis.fetch;
  const originalXmlHttpRequest = globalThis.XMLHttpRequest;
  let signaturePayload: unknown;
  let uploadBody: FormData | undefined;

  globalThis.fetch = (async (_input, init) => {
    signaturePayload = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      apiKey: 'api-key',
      cloudName: 'cloud-name',
      signature: 'upload-signature',
      timestamp: 'server-upload-timestamp',
    }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  }) as typeof fetch;

  class FakeXmlHttpRequest {
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;
    responseText = JSON.stringify({
      public_id: 'picklink_clubs/uploaded',
      secure_url: 'https://example.test/uploaded.png',
    });
    status = 200;
    statusText = 'OK';
    upload = { addEventListener: () => undefined };

    open() {}

    send(body: Document | XMLHttpRequestBodyInit | null) {
      uploadBody = body as FormData;
      this.onload?.();
    }
  }

  globalThis.XMLHttpRequest = FakeXmlHttpRequest as unknown as typeof XMLHttpRequest;
  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.XMLHttpRequest = originalXmlHttpRequest;
  });

  await cloudinary.uploadToCloudinary(
    'token',
    new Blob(['image'], { type: 'image/png' }) as File,
  );

  assert.deepEqual(signaturePayload, {
    parameters: { folder: 'picklink_clubs' },
  });
  assert.ok(uploadBody);
  assert.equal(uploadBody.get('timestamp'), 'server-upload-timestamp');
});

test('upload falls back to the local club cover endpoint when Cloudinary is not configured', async (context) => {
  const originalFetch = globalThis.fetch;
  const originalXmlHttpRequest = globalThis.XMLHttpRequest;
  const calls: Array<{ url: string; body?: BodyInit | null }> = [];

  globalThis.XMLHttpRequest = class {
    upload = { addEventListener: () => undefined };
    open() {
      throw new Error('Cloudinary upload should not be attempted without a signature.');
    }
  } as unknown as typeof XMLHttpRequest;

  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    calls.push({ url, body: init?.body ?? null });

    if (url.endsWith('/api/upload/signature')) {
      return new Response(JSON.stringify({
        message: 'Cloudinary is not configured on the server.',
      }), {
        headers: { 'content-type': 'application/json' },
        status: 500,
      });
    }

    if (url.endsWith('/api/upload/club-cover')) {
      return new Response(JSON.stringify({
        url: '/uploads/group-covers/club-cover-test.png',
      }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      });
    }

    return new Response('{}', { status: 404 });
  }) as typeof fetch;

  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.XMLHttpRequest = originalXmlHttpRequest;
  });

  const result = await cloudinary.uploadToCloudinary(
    'token',
    new File(['image'], 'cover.png', { type: 'image/png' }),
  );

  assert.deepEqual(result, {
    url: '/uploads/group-covers/club-cover-test.png',
    publicId: 'local-club-cover',
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, '/api/upload/club-cover');
  assert.ok(calls[1].body instanceof FormData);
  assert.equal((calls[1].body as FormData).get('image') instanceof File, true);
});

test('client does not expose a direct Cloudinary destroy operation', () => {
  assert.equal('deleteFromCloudinary' in cloudinary, false);
});


