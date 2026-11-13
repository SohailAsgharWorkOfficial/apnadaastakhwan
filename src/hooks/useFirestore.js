import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query as firestoreQuery,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Firestore subscription helpers with explicit loading + error states.
 * Without this, a failed snapshot leaves the UI stuck on an infinite loader.
 *
 * Filters are passed as primitive props so the subscription is only
 * re-created when the underlying query actually changes.
 */

/**
 * How long to wait for the first snapshot before telling the user that
 * something is wrong. Without this, a stalled connection leaves the UI
 * spinning forever with no way out.
 */
const FIRST_SNAPSHOT_TIMEOUT_MS = 12000;

/** Turn raw Firestore errors into something a customer can act on. */
function friendlyError(err) {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code === 'permission-denied' || /permission/i.test(msg)) {
    return new Error(
      'You do not have permission to view this. Please sign in again.'
    );
  }
  if (code === 'failed-precondition' || /requires an index/i.test(msg)) {
    return new Error(
      'This view needs a Firestore index that has not been created yet. Run: firebase deploy --only firestore:indexes'
    );
  }
  if (code === 'unavailable' || /network|offline/i.test(msg)) {
    return new Error(
      'We could not reach the server. Check your internet connection and try again.'
    );
  }
  return err;
}

export function useCollection(
  path,
  { whereField, whereValue, orderField, orderDir = 'desc', enabled = true } = {}
) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    setError(null);
    let q = collection(db, path);
    if (whereField && whereValue !== undefined) {
      q = firestoreQuery(q, where(whereField, '==', whereValue));
    }
    if (orderField) {
      q = firestoreQuery(q, orderBy(orderField, orderDir));
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
        setSlow(false);
      },
      (err) => {
        console.error(`Firestore collection "${path}" failed:`, err);
        setError(friendlyError(err));
        setLoading(false);
      }
    );

    // Watchdog — if nothing arrives in time, say so instead of spinning.
    const watchdog = setTimeout(() => {
      setSlow(true);
    }, FIRST_SNAPSHOT_TIMEOUT_MS);

    return () => {
      clearTimeout(watchdog);
      unsub();
    };
  }, [path, whereField, whereValue, orderField, orderDir, enabled, attempt]);

  return { data, loading, error, slow, retry };
}

/** Single-document subscription (e.g. config/addons). */
export function useDocument(docPath, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setSlow(false);
    setLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    setError(null);
    const unsub = onSnapshot(
      doc(db, ...docPath.split('/')),
      (snap) => {
        setData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
        setError(null);
        setSlow(false);
      },
      (err) => {
        console.error(`Firestore document "${docPath}" failed:`, err);
        setError(friendlyError(err));
        setLoading(false);
      }
    );

    const watchdog = setTimeout(() => {
      setSlow(true);
    }, FIRST_SNAPSHOT_TIMEOUT_MS);

    return () => {
      clearTimeout(watchdog);
      unsub();
    };
  }, [docPath, enabled, attempt]);

  return { data, loading, error, slow, retry };
}
