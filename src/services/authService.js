import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export async function registerUser(email, password, name) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  const profileData = {
    name,
    email,
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
  };

  await setDoc(doc(db, 'users', user.uid), profileData);
  return { user, profile: profileData };
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const profileDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
  return {
    user: userCredential.user,
    profile: profileDoc.exists() ? profileDoc.data() : null,
  };
}

export async function logoutUser() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function updateUserProfile(uid, data) {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

  await setDoc(doc(db, 'users', uid), cleanData, { merge: true });
}

export async function getUserProfile(uid) {
  const profileDoc = await getDoc(doc(db, 'users', uid));
  return profileDoc.exists() ? profileDoc.data() : null;
}

export async function saveWorkoutLog(uid, workoutData) {
  const logId = `${Date.now()}`;
  await setDoc(doc(db, 'users', uid, 'workoutLogs', logId), {
    ...workoutData,
    createdAt: serverTimestamp(),
  });
  return logId;
}

export async function saveWeightEntry(uid, weight) {
  const entryId = `${Date.now()}`;
  await setDoc(doc(db, 'users', uid, 'weightHistory', entryId), {
    weight,
    date: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
  return entryId;
}

export async function saveWaterEntry(uid, glasses) {
  const today = new Date().toISOString().split('T')[0];
  await setDoc(doc(db, 'users', uid, 'waterLog', today), {
    glasses,
    date: today,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
