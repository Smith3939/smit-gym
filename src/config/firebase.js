import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDcdHFKnZylIGgRFheehyxQ6y-cFcSj0ug',
  authDomain: 'smith-gymai.firebaseapp.com',
  projectId: 'smith-gymai',
  storageBucket: 'smith-gymai.firebasestorage.app',
  messagingSenderId: '202077379455',
  appId: '1:202077379455:web:44d792c236bfa5bbfa184a',
  measurementId: 'G-4TBSWVXGV8',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;
