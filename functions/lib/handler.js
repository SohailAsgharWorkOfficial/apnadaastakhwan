/**
 * Cloudinary signing service — shared by the Netlify and Vercel adapters.
 *
 * POST /sign-upload    { folder, type }  -> signed upload parameters
 * POST /sign-delivery  { publicId }      -> signed delivery URL for a private asset
 *
 * The caller must send a Firebase ID token in the Authorization header.
 */
import {
  verifyIdToken,
  getUserRole,
  signUpload,
  signedDeliveryUrl,
  safeFolder,
} from './cloudinary.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function bearer(request) {
  const header = request.headers.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/** Admin, or the customer who owns a private asset. */
async function canWrite(uid, token, env, { requireAdmin = false } = {}) {
  if (requireAdmin) {
    const role = await getUserRole(uid, token, env.FIREBASE_PROJECT_ID);
    return role === 'admin' || (env.ADMIN_UIDS || '').split(',').includes(uid);
  }
  return true;
}

export async function handle(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return json(
      {
        error:
          'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the function environment.',
      },
      500
    );
  }

  const token = bearer(request);

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = (body.action || '').toLowerCase();

  /* ── liveness check (no token needed) ──────────────────────────── */
  if (action === 'ping') {
    return json({
      ok: true,
      service: 'cloudinary-sign',
      cloudName: CLOUDINARY_CLOUD_NAME,
      time: new Date().toISOString(),
    });
  }

  if (!token) return json({ error: 'Missing authorization token' }, 401);

  let caller;
  try {
    caller = await verifyIdToken(token, env.FIREBASE_PROJECT_ID);
  } catch (err) {
    return json({ error: `Not signed in: ${err.message}` }, err.status || 401);
  }

  /* ── sign an upload ─────────────────────────────────────────────── */
  if (action === 'sign-upload') {
    const type = body.type === 'authenticated' ? 'authenticated' : 'upload';
    const folder = safeFolder(body.folder || 'uploads');

    // Private assets (payment receipts) may be uploaded by any signed-in
    // customer; public assets (dish photos) only by an admin.
    const requireAdmin = type !== 'authenticated';
    if (!(await canWrite(caller.uid, token, env, { requireAdmin }))) {
      return json({ error: 'Only administrators can upload public images' }, 403);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      timestamp,
      folder,
      type,
      ...(body.overwrite ? { overwrite: 'true' } : {}),
    };

    const signature = signUpload(params, CLOUDINARY_API_SECRET);

    return json({
      ok: true,
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      signature,
      timestamp,
      folder,
      type,
      uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    });
  }

  /* ── sign a delivery URL for a private asset ────────────────────── */
  if (action === 'sign-delivery') {
    const publicId = String(body.publicId || '').trim();
    if (!publicId) return json({ error: 'publicId is required' }, 400);
    if (!publicId.startsWith('payments/')) {
      return json({ error: 'Only payment assets are private' }, 403);
    }

    const role = await getUserRole(caller.uid, token, env.FIREBASE_PROJECT_ID);
    const isAdmin = role === 'admin' || (env.ADMIN_UIDS || '').split(',').includes(caller.uid);

    // Admins can view every receipt; a customer can view only their own
    // (their uid is the first folder segment).
    const owner = publicId.split('/')[1];
    if (!isAdmin && owner !== caller.uid) {
      return json({ error: 'Forbidden' }, 403);
    }

    const { url } = signedDeliveryUrl({
      cloudName: CLOUDINARY_CLOUD_NAME,
      publicId,
      apiSecret: CLOUDINARY_API_SECRET,
      type: 'authenticated',
    });

    return json({ ok: true, url });
  }

  /* ── delete an asset ────────────────────────────────────────────── */
  if (action === 'sign-delete') {
    const publicId = String(body.publicId || '').trim();
    if (!publicId) return json({ error: 'publicId is required' }, 400);

    const role = await getUserRole(caller.uid, token, env.FIREBASE_PROJECT_ID);
    const isAdmin =
      role === 'admin' || (env.ADMIN_UIDS || '').split(',').includes(caller.uid);
    if (!isAdmin) {
      return json({ error: 'Only administrators can delete files' }, 403);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signUpload({ public_id: publicId, timestamp }, CLOUDINARY_API_SECRET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/delete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: CLOUDINARY_API_KEY,
          timestamp,
          signature,
          public_id: publicId,
        }),
      }
    );

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json(
        { error: payload?.error?.message || 'Delete failed' },
        res.status || 500
      );
    }
    return json({ ok: true, result: payload.result || 'deleted' });
  }

  return json({ error: 'Unknown action' }, 400);
}
