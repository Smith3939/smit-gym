import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

// Web Client ID from Firebase Console > Authentication > Google > Web SDK configuration
// This will be auto-filled by Firebase after enabling Google sign-in
export const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
  });

  return { request, response, promptAsync };
}

export async function signInWithGoogleWeb() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signInWithGoogleCredential(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function ensureUserProfile(user) {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const providerId = user.providerData?.[0]?.providerId || 'password';
    const profile = {
      name: user.displayName || '',
      email: user.email,
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      age: '',
      height: '',
      weight: '',
      goal: 'cut',
      activityLevel: 'moderate',
      dailyCalories: 2000,
      dailyProtein: 150,
      dailyCarbs: 250,
      dailyFat: 60,
      waterGoal: 3.5,
      stepGoal: 12000,
      favorites: [],
      provider: providerId === 'google.com' ? 'google' : 'email',
    };
    await setDoc(userRef, profile);
    return profile;
  }

  return userDoc.data();
}
