import { auth } from '../firebase/firebase';

/**
 * Media storage via Cloudinary.
 *
 * Why Cloudinary over Firebase Storage: the free plan needs no billing card
 * and gives 25 monthly credits (1 credit = 1 GB storage, 1 GB delivered
 * bandwidth or 1,000 transformations) — plenty for a menu of dish photos and a
 * handful of payment receipts.
 *
 * Two upload paths:
 *   • Dish photos — an *unsigned* upload preset. Public CDN URLs, no backend.
 *   • Payment receipts — a *signed*, `authenticated` upload via the serverless
 *     function. The delivery URL is signed on demand, so a receipt is never
 *     publicly guessable.
 *
 * Env:
 *   VITE_CLOUDINARY_CLOUD_NAME   e.g. apnadastakhwan
 *   VITE_CLOUDINARY_UPLOAD_PRESET e.g. adn_menu (unsigned preset for dish photos)
 *   VITE_CLOUDINARY_FUNCTION_URL  where the signing function lives
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

/** Auto-detect the signing function's URL from the hosting platform. */
function resolveFunctionUrl() {
  const explicit = import.meta.env.VITE_CLOUDINARY_FUNCTION_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  if (typeof window === 'undefined') return '/api/cloudinary';
  const host = window.location.hostname;
  if (host.endsWith('.netlify.app')) return '/.netlify/functions/cloudinary';
  if (host.endsWith('.vercel.app')) return '/api/cloudinary';
  return '/api/cloudinary';
}

const FUNCTION_URL = resolveFunctionUrl();

const MISSING_ENV_MESSAGE =
  'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env — see README for the setup.';

/** Ask Firebase for a fresh ID token for the signed-in user. */
export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to upload files.');
  return user.getIdToken();
}

/* ──────────────────────────────────────────────────────────────────────────
   Health
   ────────────────────────────────────────────────────────────────────────── */

export const CLOUDINARY_UNAVAILABLE_MESSAGE =
  'The Cloudinary signing service is not reachable. Deploy the /api/cloudinary function (Netlify or Vercel) and check the environment variables.';

let healthPromise = null;

export function checkMediaService({ force = false } = {}) {
  if (healthPromise && !force) return healthPromise;

  healthPromise = (async () => {
    if (!CLOUD_NAME) {
      return { ok: false, message: MISSING_ENV_MESSAGE };
    }
    try {
      const res = await fetch(`${FUNCTION_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' }),
      });
      if (!res.ok) {
        return {
          ok: false,
          message: `The signing function returned HTTP ${res.status} at ${FUNCTION_URL}. Deploy it and check its environment variables.`,
        };
      }
      return { ok: true, message: 'Cloudinary is ready.' };
    } catch (err) {
      return {
        ok: false,
        message: `Could not reach the signing function at ${FUNCTION_URL}: ${err.message}`,
      };
    }
  })();

  return healthPromise;
}

/* ──────────────────────────────────────────────────────────────────────────
   Uploads
   ────────────────────────────────────────────────────────────────────────── */

/** Sanitise a folder path into safe Cloudinary path segments. */
const safeFolder = (p) =>
  String(p || '')
    .split('/')
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '-'))
    .map((segment) => segment.replace(/^\.+/, ''))
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/')
    .slice(0, 120);

async function postToCloudinary(params, file) {
  const body = new FormData();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) body.append(key, String(value));
  });
  body.append('file', file, file.name || 'upload');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body }
  );

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = payload?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Cloudinary upload failed: ${detail}`);
  }
  return payload;
}

/** Ask the serverless function to sign an upload. */
async function requestSignature(action, body) {
  const token = await getIdToken();
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...body }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || `Signing request failed (HTTP ${res.status})`);
  }
  return payload;
}

/**
 * Upload a public image (dish photos) using the unsigned upload preset.
 * @returns {Promise<{url: string, publicId: string, path: string}>}
 */
export async function uploadImage(folder, file) {
  if (!file) throw new Error('No file selected');
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error(MISSING_ENV_MESSAGE);

  const payload = await postToCloudinary(
    {
      upload_preset: UPLOAD_PRESET,
      folder: safeFolder(folder),
    },
    file
  );

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    path: payload.public_id,
  };
}

/**
 * Upload a private file (payment receipts) using a signed, authenticated
 * upload. The stored value is the public_id — a delivery URL is signed on
 * demand by the serverless function.
 */
export async function uploadPrivateFile(folder, file) {
  if (!file) throw new Error('No file selected');

  const signed = await requestSignature('sign-upload', {
    folder: safeFolder(folder),
    type: 'authenticated',
  });

  const payload = await postToCloudinary(
    {
      api_key: signed.apiKey,
      timestamp: signed.timestamp,
      signature: signed.signature,
      folder: signed.folder,
      type: 'authenticated',
    },
    file
  );

  return {
    url: payload.public_id, // not directly fetchable — needs a signed delivery URL
    publicId: payload.public_id,
    path: payload.public_id,
  };
}

/** Upload any public file to an exact folder. */
export async function uploadFile(folder, file) {
  return uploadImage(folder, file);
}

/** Best-effort delete — never throws. */
export async function removeFile(value) {
  const publicId = publicIdFrom(value);
  if (!publicId) return;
  try {
    await requestSignature('sign-delete', { publicId });
  } catch {
    /* not permitted or the function is down — ignore */
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Reading
   ────────────────────────────────────────────────────────────────────────── */

/** Is this stored value a private public_id that needs a signed URL? */
export const isPrivateAsset = (value) =>
  typeof value === 'string' && value.startsWith('payments/') && !/^https?:\/\//i.test(value);

/** Extract a Cloudinary public_id from a stored value or URL. */
export function publicIdFrom(value) {
  if (!value || typeof value !== 'string') return '';
  if (!/^https?:\/\//i.test(value)) return value;

  // https://res.cloudinary.com/<cloud>/image/<type>/v<version>/<public_id>.<ext>
  const match = value.match(/\/image\/[^/]+\/(?:s--[^/]+--\/)?v\d+\/(.+)$/);
  if (!match) return '';
  return match[1].replace(/\.[a-z0-9]+$/i, '');
}

/**
 * Resolve a stored value to an <img src>.
 * Private assets return '' — they must be loaded through fetchPrivateImage.
 */
export function resolveImageUrl(value) {
  if (!value || typeof value !== 'string') return '';
  if (isPrivateAsset(value)) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return '';
}

/**
 * Load a private asset: ask the function for a signed delivery URL, then fetch
 * it as a blob (the signed URL is public, so no auth header is needed).
 */
export async function fetchPrivateImage(value) {
  const publicId = publicIdFrom(value);
  if (!publicId) throw new Error('Not a private asset');

  const signed = await requestSignature('sign-delivery', { publicId });
  const res = await fetch(signed.url);
  if (!res.ok) {
    throw new Error(`Could not load the file (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/** True when the value looks like a stored key rather than a URL. */
export const isStorageKey = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  !/^https?:\/\//i.test(value);

export { CLOUD_NAME, UPLOAD_PRESET, FUNCTION_URL, safeFolder };
