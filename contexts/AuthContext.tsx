'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser, getUser } from '@/lib/firestore';
import { User } from '@/types';

// Check demo mode from env or localStorage (for client-side navigation)
const getDemoMode = () => {
  if (typeof window !== 'undefined') {
    // Check localStorage first (set when clicking demo button)
    const localStorageDemo = localStorage.getItem('defterli_demo_mode_set');
    if (localStorageDemo === 'true') {
      return true;
    }
  }
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

const DEMO_MODE = typeof window !== 'undefined' ? getDemoMode() : (process.env.NEXT_PUBLIC_DEMO_MODE === 'true');

// Mock user for demo mode
const MOCK_USER: User = {
  uid: 'demo-user-123',
  role: 'accountant',
  plan: 'demo',
  storageUsed: 0,
  storageLimit: 1000000000, // 1GB
  createdAt: new Date(),
};

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isDemoMode: boolean;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(DEMO_MODE);

  const enterDemoMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('defterli_demo_mode_set', 'true');
    }
    setIsDemoMode(true);
    setUser({ uid: MOCK_USER.uid, email: 'demo@defterli.com' } as FirebaseUser);
    setUserData(MOCK_USER);
    setLoading(false);
  };

  useEffect(() => {
    // Check localStorage for demo mode (set when clicking demo button)
    if (typeof window !== 'undefined') {
      const localStorageDemo = localStorage.getItem('defterli_demo_mode_set');
      if (localStorageDemo === 'true') {
        setIsDemoMode(true);
      }
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (isDemoMode) {
      // Demo mode: Set mock user immediately
      setUser({ uid: MOCK_USER.uid, email: 'demo@defterli.com' } as FirebaseUser);
      setUserData(MOCK_USER);
      setLoading(false);
      return () => unsubscribe?.();
    }

    // Normal mode: Use Firebase authentication
    if (!auth) {
      setLoading(false);
      return () => unsubscribe?.();
    }

    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          try {
            let data = await getUser(firebaseUser.uid);
            if (!data) {
              // Create user document if it doesn't exist with Google account info
              await createUser(firebaseUser.uid, {
                uid: firebaseUser.uid,
                role: 'accountant',
                email: firebaseUser.email || undefined,
                displayName: firebaseUser.displayName || undefined,
                photoURL: firebaseUser.photoURL || undefined,
                storageUsed: 0,
                storageLimit: 1000000000, // 1GB default
              });
              data = await getUser(firebaseUser.uid);
            } else {
              // Update existing user with Google account info if available
              if (firebaseUser.email || firebaseUser.displayName || firebaseUser.photoURL) {
                await createUser(firebaseUser.uid, {
                  uid: firebaseUser.uid,
                  role: 'accountant',
                  email: firebaseUser.email || data.email,
                  displayName: firebaseUser.displayName || data.displayName,
                  photoURL: firebaseUser.photoURL || data.photoURL,
                  storageUsed: data.storageUsed || 0,
                  storageLimit: data.storageLimit || 1000000000,
                });
                data = await getUser(firebaseUser.uid);
              }
            }
            setUserData(data);
          } catch (error) {
            console.error('Error loading user data:', error);
            setUserData(null);
          }
        } else {
          setUserData(null);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Firebase auth error:', error);
      setLoading(false);
    }

    return () => unsubscribe?.();
  }, [isDemoMode]);

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      // Demo mode: Just set mock user
      setUser({ uid: MOCK_USER.uid, email } as FirebaseUser);
      setUserData(MOCK_USER);
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (isDemoMode) {
      // Demo mode: Just set mock user
      setUser({ uid: MOCK_USER.uid, email } as FirebaseUser);
      setUserData(MOCK_USER);
      return;
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await createUser(userCredential.user.uid, {
        uid: userCredential.user.uid,
        role: 'accountant',
        storageUsed: 0,
        storageLimit: 1000000000, // 1GB default
      });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase yapılandırması eksik');
    }
    
    // Google ile giriş yapıldığında demo modunu devre dışı bırak
    if (isDemoMode && typeof window !== 'undefined') {
      localStorage.removeItem('defterli_demo_mode_set');
      setIsDemoMode(false);
    }
    
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Google ile giriş yapıldıktan sonra kullanıcı verilerini kontrol et ve Google bilgileriyle güncelle
    try {
      const googleUser = userCredential.user;
      let data = await getUser(googleUser.uid);
      
      if (!data) {
        // Create user document with Google account info
        await createUser(googleUser.uid, {
          uid: googleUser.uid,
          role: 'accountant',
          email: googleUser.email || undefined,
          displayName: googleUser.displayName || undefined,
          photoURL: googleUser.photoURL || undefined,
          storageUsed: 0,
          storageLimit: 1000000000, // 1GB default
        });
      } else {
        // Update existing user with Google account info (overwrite demo data)
        await createUser(googleUser.uid, {
          uid: googleUser.uid,
          role: 'accountant',
          email: googleUser.email || data.email,
          displayName: googleUser.displayName || data.displayName,
          photoURL: googleUser.photoURL || data.photoURL,
          storageUsed: data.storageUsed || 0,
          storageLimit: data.storageLimit || 1000000000,
        });
      }
      
      // Reload user data to get updated info
      const updatedData = await getUser(googleUser.uid);
      if (updatedData) {
        setUserData(updatedData);
      }
    } catch (error) {
      console.error('Error creating/loading user data:', error);
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null);
      setUserData(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('defterli_demo_mode_set');
      }
      setIsDemoMode(false);
      return;
    }
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, signUp, signInWithGoogle, signOut, isDemoMode, enterDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
