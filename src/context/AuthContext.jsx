import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // firebase auth user
  const [profile, setProfile] = useState(null); // firestore users doc
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = () => {};
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
      if (unsubProfile) unsubProfile();
      if (fbUser) {
        unsubProfile = onSnapshot(
          doc(db, 'users', fbUser.uid),
          (snap) => setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null),
          () => setProfile(null)
        );
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => {
      unsub();
      unsubProfile();
    };
  }, []);

  const register = useCallback(async (name, email, password, phone) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      phone,
      address: '',
      area: '',
      role: 'customer',
      createdAt: new Date().toISOString(),
    });
    return cred.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Ensure the profile doc exists (e.g., accounts created before rules change)
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        name: cred.user.displayName || email.split('@')[0],
        email,
        phone: '',
        address: '',
        area: '',
        role: 'customer',
        createdAt: new Date().toISOString(),
      });
    }
    return cred.user;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    toast.success('Logged out. Khana yad rahega!');
  }, []);

  const updateUserProfile = useCallback(async (uid, data) => {
    await updateDoc(doc(db, 'users', uid), data);
    toast.success('Profile updated');
  }, []);

  const isAdmin = profile?.role === 'admin';

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    register,
    login,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
