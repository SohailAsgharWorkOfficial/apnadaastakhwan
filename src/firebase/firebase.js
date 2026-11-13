import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
 * Firestore with a resilient transport.
 *
 * The default WebChannel transport (gRPC-web over HTTP/2) silently stalls on
 * some corporate proxies and mobile networks — the UI then spins forever.
 * `experimentalAutoDetectLongPolling` falls back to long polling automatically
 * when that happens, and costs nothing extra in the bundle (the long-polling
 * transport ships either way).
 *
 * The persistent IndexedDB cache is deliberately NOT enabled: it adds ~24 KB
 * gzip to every page load, which is a poor trade for a mostly-public menu
 * site on mobile data.
 */
function createFirestore() {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    // initializeFirestore throws if it is called twice (hot reload).
    return getFirestore(app);
  }
}

export const db = createFirestore();

export default app;
