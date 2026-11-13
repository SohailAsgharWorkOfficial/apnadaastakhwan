import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

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
 * Firestore with resilient transport.
 *
 * The default WebChannel transport (gRPC-web over HTTP/2) silently stalls on
 * some corporate proxies, mobile networks and older routers — the UI just
 * spins forever. `experimentalAutoDetectLongPolling` falls back to long
 * polling automatically when that happens.
 *
 * The local cache is also made persistent so the menu and plans stay readable
 * offline and survive a dropped connection.
 */
function createFirestore() {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // IndexedDB can be unavailable (private mode, blocked storage) and
    // initializeFirestore throws if it is called twice (hot reload).
    try {
      return initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    } catch {
      return getFirestore(app);
    }
  }
}

export const db = createFirestore();

export default app;
