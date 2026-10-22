import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { logoutUser, updateUserProfile } from '../services/authService';
import { ensureUserProfile } from '../services/googleAuthService';
import { scrubExactPublicLocation } from '../services/socialService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profile = await ensureUserProfile(firebaseUser);
          setUserProfile(profile);
        } catch (e) {
          console.log('Error fetching profile:', e);
        }
        // Drop any exact GPS still stored on this user's public profile.
        // Non-fatal: login still works if the public doc isn't writable yet.
        try {
          await scrubExactPublicLocation(firebaseUser.uid);
        } catch (e) {
          console.log('Public location scrub failed:', e);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateProfile = async (data) => {
    if (!user) return;
    await updateUserProfile(user.uid, data);
    setUserProfile((prev) => ({ ...prev, ...data }));
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      setUserProfile,
      updateProfile,
      logout,
      loading,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
