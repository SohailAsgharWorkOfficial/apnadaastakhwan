/**
 * Does the Firestore SDK's streaming Listen work from this machine?
 * Run from the project root: node scripts/check-sdk.js
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim();
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const db = getFirestore(app);

const started = Date.now();
let done = false;

onSnapshot(
  collection(db, 'plans'),
  (snap) => {
    done = true;
    console.log(
      `onSnapshot RESOLVED in ${Date.now() - started}ms — ${snap.docs.length} plan docs`
    );
    snap.docs.forEach((d) => {
      console.log(`  ${d.id}  "${d.data().title}"  isActive=${d.data().isActive}`);
    });
    process.exit(0);
  },
  (err) => {
    done = true;
    console.log(`onSnapshot ERROR after ${Date.now() - started}ms — ${err.code}: ${err.message}`);
    process.exit(1);
  }
);

setTimeout(() => {
  if (!done) {
    console.log(`onSnapshot STILL PENDING after ${Date.now() - started}ms — no data, no error`);
    process.exit(2);
  }
}, 25000);
