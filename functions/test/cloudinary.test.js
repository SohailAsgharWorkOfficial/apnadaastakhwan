/**
 * Tests for the Cloudinary signing service.
 *
 *   node --test functions/test/
 *
 * Uses a real RSA keypair to mint genuine Firebase-style ID tokens, so the
 * verification path is exercised for real.
 */
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createHash } from 'node:crypto';

import {
  verifyIdToken,
  getUserRole,
  signUpload,
  signedDeliveryUrl,
  safeFolder,
} from '../lib/cloudinary.js';
import { handle } from '../lib/handler.js';

const { subtle } = webcrypto;
const PROJECT_ID = 'test-project';
const KID = 'test-key-1';
const API_SECRET = 'super-secret-value';

let keyPair;
let jwks;
const realFetch = globalThis.fetch;

/* ── helpers ─────────────────────────────────────────────────────────── */

function b64url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlJson(obj) {
  return b64url(Buffer.from(JSON.stringify(obj)));
}

async function makeToken({
  uid = 'admin-uid',
  aud = PROJECT_ID,
  exp = Math.floor(Date.now() / 1000) + 3600,
} = {}) {
  const header = { alg: 'RS256', typ: 'JWT', kid: KID };
  const payload = { aud, exp, iat: Math.floor(Date.now() / 1000), uid, sub: uid };
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  const signature = await subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyPair.privateKey,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${b64url(signature)}`;
}

function tamper(token) {
  const parts = token.split('.');
  const sig = Buffer.from(parts[2], 'base64url');
  sig[0] ^= 0xff;
  return `${parts[0]}.${parts[1]}.${sig.toString('base64url')}`;
}

function mockFetch(url, init = {}) {
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
  if (u.includes('api.cloudinary.com')) {
    return Promise.resolve(
      new Response(JSON.stringify({ result: 'ok' }), { status: 200 })
    );
  }
  return realFetch(url, init);
}

before(async () => {
  keyPair = await subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
  const pub = await subtle.exportKey('jwk', keyPair.publicKey);
  jwks = { keys: [{ ...pub, kid: KID, alg: 'RS256', use: 'sig' }] };
});

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

after(() => {
  globalThis.fetch = realFetch;
});

function env(overrides = {}) {
  return {
    FIREBASE_PROJECT_ID: PROJECT_ID,
    CLOUDINARY_CLOUD_NAME: 'demo-cloud',
    CLOUDINARY_API_KEY: '1234567890',
    CLOUDINARY_API_SECRET: API_SECRET,
    ...overrides,
  };
}

function post(body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request('https://fn.local/api/cloudinary', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

/* ── tests ──────────────────────────────────────────────────────────── */

describe('verifyIdToken', () => {
  test('accepts a valid token and returns the uid', async () => {
    const user = await verifyIdToken(await makeToken(), PROJECT_ID);
    assert.equal(user.uid, 'admin-uid');
  });

  test('rejects a tampered signature', async () => {
    const bad = tamper(await makeToken());
    await assert.rejects(() => verifyIdToken(bad, PROJECT_ID));
  });

  test('rejects an expired token', async () => {
    const token = await makeToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    await assert.rejects(() => verifyIdToken(token, PROJECT_ID));
  });

  test('rejects a token minted for another project', async () => {
    const token = await makeToken({ aud: 'other-project' });
    await assert.rejects(() => verifyIdToken(token, PROJECT_ID));
  });

  test('rejects a malformed token', async () => {
    await assert.rejects(() => verifyIdToken('not-a-token', PROJECT_ID));
    await assert.rejects(() => verifyIdToken('', PROJECT_ID));
  });
});

describe('signUpload', () => {
  test('matches Cloudinary\'s documented algorithm', () => {
    const params = { timestamp: 1700000000, folder: 'menu/week1', type: 'upload' };
    const expected = createHash('sha1')
      .update(`folder=menu/week1&timestamp=1700000000&type=upload${API_SECRET}`)
      .digest('hex');
    assert.equal(signUpload(params, API_SECRET), expected);
  });

  test('sorts parameters and skips empty values', () => {
    const signature = signUpload(
      { timestamp: 1, folder: 'a', type: 'upload', overwrite: '' },
      API_SECRET
    );
    const expected = createHash('sha1')
      .update(`folder=a&timestamp=1&type=upload${API_SECRET}`)
      .digest('hex');
    assert.equal(signature, expected);
  });
});

describe('signedDeliveryUrl', () => {
  test('builds a signed authenticated delivery URL', () => {
    const { url, timestamp } = signedDeliveryUrl({
      cloudName: 'demo-cloud',
      publicId: 'payments/abc123.jpg',
      apiSecret: API_SECRET,
      timestamp: 1700000000,
    });
    const expectedSig = createHash('sha1')
      .update(`payments/abc123.jpg1700000000${API_SECRET}`)
      .digest('hex');
    assert.ok(url.includes(`s--${expectedSig}--`), url);
    assert.ok(url.includes('/image/authenticated/'), url);
    assert.ok(url.includes('v1700000000/'), url);
    assert.equal(timestamp, 1700000000);
  });
});

describe('safeFolder', () => {
  test('drops traversal segments and leading dots', () => {
    assert.equal(safeFolder('../../etc/passwd'), 'etc/passwd');
    assert.equal(safeFolder('menu/../..'), 'menu');
    assert.equal(safeFolder('...hidden/file'), 'hidden/file');
  });

  test('keeps normal folders intact', () => {
    assert.equal(safeFolder('menu/week1_monday'), 'menu/week1_monday');
    assert.equal(safeFolder('payments/abc-123'), 'payments/abc-123');
  });
});

describe('handler', () => {
  test('ping works without a token', async () => {
    const res = await handle(post({ action: 'ping' }), env());
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
  });

  test('rejects a request with no token', async () => {
    const res = await handle(post({ action: 'sign-upload' }), env());
    assert.equal(res.status, 401);
  });

  test('rejects a tampered token', async () => {
    const res = await handle(
      post({ action: 'sign-upload' }, tamper(await makeToken())),
      env()
    );
    assert.equal(res.status, 401);
  });

  test('a non-admin cannot sign a public upload', async () => {
    const res = await handle(
      post(
        { action: 'sign-upload', folder: 'menu/x', type: 'upload' },
        await makeToken({ uid: 'customer-uid' })
      ),
      env()
    );
    assert.equal(res.status, 403);
  });

  test('an admin can sign a public upload', async () => {
    const res = await handle(
      post(
        { action: 'sign-upload', folder: 'menu/x', type: 'upload' },
        await makeToken()
      ),
      env()
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.cloudName, 'demo-cloud');
    assert.equal(body.folder, 'menu/x');
    assert.ok(body.signature);
    assert.ok(body.uploadUrl.includes('demo-cloud'));
  });

  test('a signed-in customer can sign a private upload', async () => {
    const res = await handle(
      post(
        { action: 'sign-upload', folder: 'payments/customer-uid', type: 'authenticated' },
        await makeToken({ uid: 'customer-uid' })
      ),
      env()
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.type, 'authenticated');
  });

  test('a customer cannot sign a delivery URL for someone else\'s receipt', async () => {
    const res = await handle(
      post(
        { action: 'sign-delivery', publicId: 'payments/someone-else/abc.jpg' },
        await makeToken({ uid: 'customer-uid' })
      ),
      env()
    );
    assert.equal(res.status, 403);
  });

  test('a customer can sign a delivery URL for their own receipt', async () => {
    const res = await handle(
      post(
        { action: 'sign-delivery', publicId: 'payments/customer-uid/abc.jpg' },
        await makeToken({ uid: 'customer-uid' })
      ),
      env()
    );
    assert.equal(res.status, 200);
    assert.ok((await res.json()).url.includes('/image/authenticated/'));
  });

  test('an admin can sign a delivery URL for any receipt', async () => {
    const res = await handle(
      post(
        { action: 'sign-delivery', publicId: 'payments/someone-else/abc.jpg' },
        await makeToken()
      ),
      env()
    );
    assert.equal(res.status, 200);
  });

  test('signing a delivery URL for a non-private asset is refused', async () => {
    const res = await handle(
      post(
        { action: 'sign-delivery', publicId: 'menu/week1/abc.jpg' },
        await makeToken()
      ),
      env()
    );
    assert.equal(res.status, 403);
  });

  test('only an admin can delete an asset', async () => {
    const forbidden = await handle(
      post(
        { action: 'sign-delete', publicId: 'menu/week1/abc.jpg' },
        await makeToken({ uid: 'customer-uid' })
      ),
      env()
    );
    assert.equal(forbidden.status, 403);

    const allowed = await handle(
      post(
        { action: 'sign-delete', publicId: 'menu/week1/abc.jpg' },
        await makeToken()
      ),
      env()
    );
    assert.equal(allowed.status, 200);
  });

  test('missing Cloudinary configuration returns a helpful error', async () => {
    const res = await handle(
      post({ action: 'sign-upload' }, await makeToken()),
      env({ CLOUDINARY_API_SECRET: undefined })
    );
    assert.equal(res.status, 500);
    assert.match((await res.json()).error, /not configured/i);
  });
});
