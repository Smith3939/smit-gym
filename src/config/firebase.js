import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const defaultAuthDomain = 'smith-gymai.firebaseapp.com';

const firebaseConfig = {
  apiKey: 'AIzaSyDcdHFKnZylIGgRFheehyxQ6y-cFcSj0ug',
  authDomain: defaultAuthDomain,
  projectId: 'smith-gymai',
  storageBucket: 'smith-gymai.firebasestorage.app',
  messagingSenderId: '202077379455',
  appId: '1:202077379455:web:44d792c236bfa5bbfa184a',
  measurementId: 'G-4TBSWVXGV8',
};

const app = initializeApp(firebaseConfig);

let authInstance;

if (Platform.OS === 'web') {
  // Web platform - use standard getAuth (uses browser localStorage automatically)
  authInstance = getAuth(app);
} else {
  // Native platforms (iOS/Android) - use AsyncStorage for persistence
  try {
    const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // Fallback to standard auth if persistence setup fails
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const db = getFirestore(app);
export const functions = getFunctions(app, 'europe-west1');

export default app;
