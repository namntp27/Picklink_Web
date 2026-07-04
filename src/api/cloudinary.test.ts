import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer, type ViteDevServer } from 'vite';

let cloudinary: typeof import('./cloudinary');
let vite: ViteDevServer;

before(async () => {
  vite = await createServer({
    appType: 'custom',
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true },
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

test('client does not expose a direct Cloudinary destroy operation', () => {
  assert.equal('deleteFromCloudinary' in cloudinary, false);
});
