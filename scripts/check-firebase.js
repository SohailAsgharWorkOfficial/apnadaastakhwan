/**
 * Diagnose the Firebase setup for this project.
 *
 *   npm run check:firebase
 *
 * Checks the env vars, the Cloud Storage bucket, the Firestore catalog and
 * the composite indexes that the customer Dashboard query needs.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ── load .env (Node 20.6+ has loadEnvFile) ───────────────────────────── */
function loadEnv() {
  try {
    process.loadEnvFile(join(ROOT, '.env'));
    return;
  } catch {
    /* fall through */
  }
  try {
    const raw = readFileSync(join(ROOT, '.env'), 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) return;
      const value = m[2].replace(/^["']|["']$/g, '');
      if (process.env[m[1]] === undefined) process.env[m[1]] = value;
    });
  } catch {
    console.log('! .env not found — relying on ambient environment variables.');
  }
}
loadEnv();

const ok = (s) => `\x1b[32m${s}\x1b[0m`;
const bad = (s) => `\x1b[31m${s}\x1b[0m`;
const warn = (s) => `\x1b[33m${s}\x1b[0m`;
const info = (s) => `\x1b[36m${s}\x1b[0m`;

let failures = 0;
const pass = (m) => console.log(`  ${ok('PASS')}  ${m}`);
const fail = (m) => {
  failures += 1;
  console.log(`  ${bad('FAIL')}  ${m}`);
};
const note = (m) => console.log(`  ${info('INFO')}  ${m}`);
const caution = (m) => console.log(`  ${warn('WARN')}  ${m}`);

console.log('\n\x1b[1mApnaDastarkhwan — Firebase diagnostics\x1b[0m\n');

/* ── 1. env vars ───────────────────────────────────────────────────────── */
console.log('1. Environment variables');
const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];
for (const key of REQUIRED) {
  const v = process.env[key];
  if (!v || v.includes('YOUR_')) fail(`${key} is missing or still a placeholder`);
  else pass(`${key} is set`);
}

const PROJECT = process.env.VITE_FIREBASE_PROJECT_ID;
const BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET;
const API_KEY = process.env.VITE_FIREBASE_API_KEY;

/* ── 2. Cloudinary ────────────────────────────────────────────────────── */
console.log('\n2. Cloudinary (media)');
const CLOUD = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD) {
  fail('VITE_CLOUDINARY_CLOUD_NAME is missing from .env');
  console.log(
    `       ${info('Find it:')} Cloudinary console → Settings → Cloud name`
  );
} else {
  pass(`cloud name is "${CLOUD}"`);
}

if (!PRESET) {
  fail('VITE_CLOUDINARY_UPLOAD_PRESET is missing from .env');
  console.log(
    `       ${info('Create one:')} Cloudinary console → Settings → Upload → Upload presets\n` +
      `            Use an ${info('unsigned')} preset (it is used for the public dish photos)`
  );
} else {
  pass(`upload preset is "${PRESET}"`);
}

// The signing function must be reachable for payment receipts.
const FUNCTION_URL = (
  process.env.VITE_CLOUDINARY_FUNCTION_URL ||
  'http://localhost:5173/api/cloudinary'
).replace(/\/+$/, '');

try {
  const res = await fetch(`${FUNCTION_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ping' }),
  });
  if (res.ok) {
    const body = await res.json();
    pass(`signing function is up (${body.service || 'cloudinary-sign'}) at ${FUNCTION_URL}`);
  } else {
    fail(`signing function returned HTTP ${res.status} at ${FUNCTION_URL}`);
    console.log(
      `       ${info('Fix:')} deploy netlify/functions/ (Netlify) or api/ (Vercel) with\n` +
        `            CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET set.`
    );
  }
} catch (e) {
  fail(`signing function unreachable at ${FUNCTION_URL}: ${e.message}`);
  console.log(
    `       ${info('Fix:')} deploy netlify/functions/ (Netlify) or api/ (Vercel), then set\n` +
      `            VITE_CLOUDINARY_FUNCTION_URL if you are running locally.`
  );
}

/* ── 3. Firestore catalog ──────────────────────────────────────────────── */
console.log('\n3. Firestore catalog (public read)');
if (PROJECT && API_KEY) {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/plans?key=${API_KEY}`
    );
    const body = await res.text();
    if (res.ok) {
      const count = (body.match(/"name":\s*"projects\/[^"]*\/documents\/plans\//g) || []).length;
      if (count > 0) pass(`plans collection has ${count} document(s)`);
      else {
        caution('plans collection is EMPTY — run `npm run seed` (with admin credentials)');
      }
    } else if (res.status === 403) {
      caution('Firestore API refused the REST read (normal — the browser SDK still works)');
    } else {
      caution(`Firestore REST read returned HTTP ${res.status}`);
    }
  } catch (e) {
    caution(`Could not reach Firestore: ${e.message}`);
  }
}

/* ── 4. composite indexes ──────────────────────────────────────────────── */
console.log('\n4. Composite indexes');
const idxFile = join(ROOT, 'firestore.indexes.json');
if (!existsSync(idxFile)) {
  fail('firestore.indexes.json is missing');
} else {
  pass('firestore.indexes.json exists');
  const idx = JSON.parse(readFileSync(idxFile, 'utf8'));
  const subs = (idx.indexes || []).filter((i) => i.collectionGroup === 'subscriptions');
  if (subs.length) pass(`${subs.length} subscription index(es) declared`);
  else fail('no index declared for the subscriptions collection');
  console.log(
    `       ${info('Deploy:')} firebase deploy --only firestore:indexes\n` +
      `       ${info('Or create it:')} Firebase Console → Firestore → Indexes → Add index\n` +
      `            collection: subscriptions · fields: userId (Asc) + createdAt (Desc)`
  );
}

/* ── 5. security rules ─────────────────────────────────────────────────── */
console.log('\n5. Security rules files');
for (const f of ['firestore.rules', 'storage.rules']) {
  if (existsSync(join(ROOT, f))) pass(`${f} exists`);
  else fail(`${f} is missing`);
}

/* ── summary ───────────────────────────────────────────────────────────── */
console.log('');
if (failures === 0) {
  console.log(ok('\x1b[1mAll checks passed.\x1b[0m\n'));
} else {
  console.log(bad(`\x1b[1m${failures} check(s) need attention.\x1b[0m\n`));
}
process.exit(failures === 0 ? 0 : 1);
