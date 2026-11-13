/**
 * Shared Cloudinary helpers for the Netlify / Vercel serverless function.
 *
 * Two jobs:
 *   1. Verify the caller's Firebase ID token (so only signed-in users can
 *      request upload signatures).
 *   2. Sign Cloudinary uploads and delivery URLs with the API secret.
 *
 * The API secret never leaves the server — the browser only ever receives a
 * short-lived signature.
 */
import { createHash } from 'node:crypto';

/* ── Firebase ID token verification ───────────────────────────────────── */

const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwksCache = null;

function b64urlToBytes(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = Buffer.from(s + pad, 'base64');
  return new Uint8Array(bin);
}

/**
 * Verify a Firebase ID token against Google's published keys.
 * @returns {Promise<{uid: string, email?: string}>}
 */
export async function verifyIdToken(idToken, projectId) {
  if (!idToken) throw Object.assign(new Error('Missing authorization token'), { status: 401 });

  const parts = idToken.split('.');
  if (parts.length !== 3) throw Object.assign(new Error('Malformed token'), { status: 401 });

  const header = JSON.parse(Buffer.from(b64urlToBytes(parts[0])).toString('utf8'));
  const payload = JSON.parse(Buffer.from(b64urlToBytes(parts[1])).toString('utf8'));

  if (header.alg !== 'RS256') {
    throw Object.assign(new Error('Unsupported token algorithm'), { status: 401 });
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    throw Object.assign(new Error('Token expired'), { status: 401 });
  }
  if (payload.iss && !payload.iss.startsWith('https://securetoken.google.com/')) {
    throw Object.assign(new Error('Untrusted token issuer'), { status: 401 });
  }
  if (projectId && payload.aud !== projectId) {
    throw Object.assign(new Error('Wrong audience'), { status: 401 });
  }

  if (!jwksCache || Date.now() - jwksCache.fetchedAt > 3600_000) {
    const res = await fetch(JWKS_URL);
    if (!res.ok) {
      throw Object.assign(new Error('Could not fetch signing keys'), { status: 500 });
    }
    jwksCache = { fetchedAt: Date.now(), keys: (await res.json()).keys || [] };
  }

  const jwk = jwksCache.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw Object.assign(new Error('Unknown signing key'), { status: 401 });

  const crypto = globalThis.crypto || (await import('node:crypto')).webcrypto;
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
  if (!ok) throw Object.assign(new Error('Invalid token signature'), { status: 401 });

  return { uid: payload.uid || payload.sub, email: payload.email };
}

/**
 * Read the caller's role from Firestore using their own token, so Firestore's
 * security rules remain the source of truth.
 */
export async function getUserRole(uid, idToken, projectId) {
  if (!projectId) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
    if (!res.ok) return null;
    const doc = await res.json();
    return doc?.fields?.role?.stringValue || null;
  } catch {
    return null;
  }
}

/* ── Cloudinary signing ──────────────────────────────────────────────── */

export const sha1 = (value) => createHash('sha1').update(value).digest('hex');

/**
 * Sign an upload. Cloudinary expects the SHA-1 of the sorted, signed
 * parameters joined with "&", suffixed with the API secret.
 *
 * @param {object} params  parameters that will be sent with the upload
 * @param {string} apiSecret
 */
export function signUpload(params, apiSecret) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  return sha1(`${toSign}${apiSecret}`);
}

/**
 * Build a signed delivery URL for an authenticated (private) asset.
 *
 * The delivery signature is SHA-1 of "<publicId><timestamp><apiSecret>",
 * where publicId includes the file extension.
 */
export function signedDeliveryUrl({ cloudName, publicId, apiSecret, resourceType = 'image', type = 'authenticated', timestamp }) {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signature = sha1(`${publicId}${ts}${apiSecret}`);
  const encoded = publicId.split('/').map(encodeURIComponent).join('/');
  return {
    url: `https://res.cloudinary.com/${cloudName}/${resourceType}/${type}/s--${signature}--/v${ts}/${encoded}`,
    timestamp: ts,
  };
}

/** Sanitise a folder path into safe Cloudinary path segments. */
export function safeFolder(input) {
  return String(input || '')
    .split('/')
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '-'))
    .map((segment) => segment.replace(/^\.+/, ''))
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/')
    .slice(0, 120);
}
