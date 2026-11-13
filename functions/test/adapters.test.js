/**
 * Tests for the Netlify and Vercel function adapters.
 *
 *   node --test functions/test/
 *
 * The adapters translate between the platform's request/response shape and the
 * Web-standard handler, which is where this kind of glue usually breaks.
 */
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

const PROJECT_ID = 'test-project';
const KID = 'test-key-1';

let keyPair;
let jwks;
const realFetch = globalThis.fetch;

function b64url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function makeToken(uid = 'admin-uid') {
  const header = { alg: 'RS256', typ: 'JWT', kid: KID };
  const payload = {
    aud: PROJECT_ID,
    exp: Math.floor(Date.now() / 1000) + 3600,
    uid,
    sub: uid,
  };
  const signingInput = `${b64url(Buffer.from(JSON.stringify(header)))}.${b64url(
    Buffer.from(JSON.stringify(payload))
  )}`;
  const signature = await webcrypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyPair.privateKey,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${b64url(signature)}`;
}

function mockFetch(url) {
  const u = String(url);
  if (u.includes('securetoken')) {
    return Promise.resolve(new Response(JSON.stringify(jwks), { status: 200 }));
  }
  if (u.includes('firestore.googleapis.com')) {
    const uid = u.split('/documents/users/')[1];
    const roles = { 'admin-uid': 'admin', 'customer-uid': 'customer' };
    if (!roles[uid]) return Promise.resolve(new Response('{}', { status: 404 }));
    return Promise.resolve(
      new Response(
        JSON.stringify({ fields: { role: { stringValue: roles[uid] } } }),
        { status: 200 }
      )
    );
  }
  return realFetch(url);
}

before(async () => {
  keyPair = await webcrypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
  const pub = await webcrypto.subtle.exportKey('jwk', keyPair.publicKey);
  jwks = { keys: [{ ...pub, kid: KID, alg: 'RS256', use: 'sig' }] };
});

beforeEach(() => {
  globalThis.fetch = mockFetch;
  process.env.FIREBASE_PROJECT_ID = PROJECT_ID;
  process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
  process.env.CLOUDINARY_API_KEY = '1234567890';
  process.env.CLOUDINARY_API_SECRET = 'secret';
});

after(() => {
  globalThis.fetch = realFetch;
});

/* ── Netlify adapter ────────────────────────────────────────────────── */

describe('Netlify adapter', () => {
  test('answers a ping without a token', async () => {
    const { default: handler } = await import('../../netlify/functions/cloudinary.js');
    const res = await handler(
      new Request('https://fn.local/.netlify/functions/cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' }),
      })
    );
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
  });

  test('rejects a request with no token', async () => {
    const { default: handler } = await import('../../netlify/functions/cloudinary.js');
    const res = await handler(
      new Request('https://fn.local/.netlify/functions/cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign-upload' }),
      })
    );
    assert.equal(res.status, 401);
  });

  test('signs an upload for an admin', async () => {
    const { default: handler } = await import('../../netlify/functions/cloudinary.js');
    const token = await makeToken();
    const res = await handler(
      new Request('https://fn.local/.netlify/functions/cloudinary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'sign-upload', folder: 'menu/x' }),
      })
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.cloudName, 'demo-cloud');
    assert.ok(body.signature);
  });
});

/* ── Vercel adapter ─────────────────────────────────────────────────── */

describe('Vercel adapter', () => {
  /** Minimal mock of Vercel's Node (req, res) pair. */
  function mockRes() {
    const res = {
      statusCode: null,
      headers: {},
      body: null,
      setHeader(k, v) {
        this.headers[k] = v;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        this.headers['Content-Type'] = 'application/json';
        return this;
      },
      send(payload) {
        this.body = payload;
        return this;
      },
      end() {
        return this;
      },
    };
    return res;
  }

  test('answers a ping without a token', async () => {
    const { default: handler } = await import('../../api/cloudinary.js');
    const req = {
      method: 'POST',
      headers: { origin: 'https://app.vercel.app', 'content-type': 'application/json' },
      body: { action: 'ping' },
    };
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).ok, true);
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://app.vercel.app');
  });

  test('rejects a request with no token', async () => {
    const { default: handler } = await import('../../api/cloudinary.js');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { action: 'sign-upload' },
    };
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 401);
    assert.match(JSON.parse(res.body).error, /authorization/i);
  });

  test('signs an upload for an admin', async () => {
    const { default: handler } = await import('../../api/cloudinary.js');
    const token = await makeToken();
    const req = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: { action: 'sign-upload', folder: 'menu/x' },
    };
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.cloudName, 'demo-cloud');
    assert.ok(body.signature);
    assert.ok(body.uploadUrl.includes('/v1_1/demo-cloud/image/upload'));
  });

  test('a non-admin cannot sign a public upload', async () => {
    const { default: handler } = await import('../../api/cloudinary.js');
    const token = await makeToken('customer-uid');
    const req = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: { action: 'sign-upload', folder: 'menu/x', type: 'upload' },
    };
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 403);
  });

  test('handles a body that arrives as a raw string', async () => {
    const { default: handler } = await import('../../api/cloudinary.js');
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'ping' }),
    };
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
  });

  test('handles OPTIONS with a 204', async () => {
    const { default: handler } = await import('../../api/cloudinary.js');
    const req = { method: 'OPTIONS', headers: {} };
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 204);
  });
});
