import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { calculateNutritionPlan } from './nutritionEngine';
import { generateDailyPlan } from './mealPlanGenerator';

const SHARE_COLLECTION = 'sharedProfiles';
const RECENT_WORKOUT_LIMIT = 12;
const DEFAULT_EXPIRY_DAYS = 30;
const DEFAULT_SHARE_BASE_URL = 'https://smithgym.vercel.app';
const ENV_SHARE_BASE_URL =
  typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_SHARE_BASE_URL : undefined;
const SHARE_BASE_URL = ENV_SHARE_BASE_URL || DEFAULT_SHARE_BASE_URL;

const ROLE_LABELS = {
  friend: 'חבר לאימון',
  coach: 'מאמן',
};

export const SHARE_PRESETS = {
  friend: {
    role: 'friend',
    permissions: {
      profile: true,
      workouts: true,
      nutrition: false,
      bodyMetrics: false,
    },
  },
  coach: {
    role: 'coach',
    permissions: {
      profile: true,
      workouts: true,
      nutrition: true,
      bodyMetrics: true,
    },
  },
};

export function getShareUrl(shareId) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return buildWebShareUrl(window.location.origin, shareId);
  }

  return buildWebShareUrl(SHARE_BASE_URL, shareId);
}

export async function createProfileShare(uid, userProfile, options) {
  if (!uid) {
    throw new Error('Missing user id');
  }

  const role = options?.role || 'coach';
  const permissions = {
    ...SHARE_PRESETS[role]?.permissions,
    ...options?.permissions,
  };
  const shareId = createShareId(role);
  const expiresAt = Timestamp.fromDate(addDays(new Date(), DEFAULT_EXPIRY_DAYS));
  const snapshot = await buildShareSnapshot(uid, userProfile, permissions);

  const shareData = {
    ownerId: uid,
    role,
    roleLabel: ROLE_LABELS[role] || ROLE_LABELS.coach,
    permissions,
    status: 'active',
    snapshot,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    expiresAt,
  };

  await setDoc(doc(db, SHARE_COLLECTION, shareId), shareData);

  return {
    shareId,
    url: getShareUrl(shareId),
    ...shareData,
  };
}

export async function loadSharedProfile(shareId) {
  if (!shareId) return null;

  const shareDoc = await getDoc(doc(db, SHARE_COLLECTION, shareId));
  if (!shareDoc.exists()) return null;

  return {
    id: shareDoc.id,
    ...shareDoc.data(),
  };
}

async function buildShareSnapshot(uid, userProfile, permissions) {
  const [workouts, nutrition] = await Promise.all([
    permissions.workouts ? loadWorkoutSnapshot(uid) : null,
    permissions.nutrition ? loadNutritionSnapshot(userProfile) : null,
  ]);

  return {
    profile: buildProfileSnapshot(userProfile, permissions),
    workouts,
    nutrition,
    generatedAt: new Date().toISOString(),
  };
}

function buildProfileSnapshot(userProfile = {}, permissions) {
  const snapshot = {
    name: userProfile.name || 'מתאמן',
    goal: userProfile.goal || 'cut',
    activityLevel: userProfile.activityLevel || 'moderate',
  };

  if (permissions.bodyMetrics) {
    snapshot.age = userProfile.age || '';
    snapshot.height = userProfile.height || '';
    snapshot.weight = userProfile.weight || '';
    snapshot.gender = userProfile.gender || '';
  }

  return snapshot;
}

async function loadWorkoutSnapshot(uid) {
  const [currentLogsSnapshot, legacyLogsSnapshot] = await Promise.all([
    getDocs(query(
      collection(db, 'users', uid, 'workout', 'logs', 'sessions'),
      orderBy('completedAt', 'desc'),
      limit(RECENT_WORKOUT_LIMIT)
    )),
    getDocs(query(
      collection(db, 'users', uid, 'workoutLogs'),
      orderBy('createdAt', 'desc'),
      limit(RECENT_WORKOUT_LIMIT)
    )),
  ]);

  const sessions = [
    ...currentLogsSnapshot.docs.map((logDoc) => normalizeWorkoutSession(logDoc, 'completedAt')),
    ...legacyLogsSnapshot.docs.map((logDoc) => normalizeWorkoutSession(logDoc, 'createdAt')),
  ]
    .sort((a, b) => getTimestampMillis(b.shareSortTime) - getTimestampMillis(a.shareSortTime))
    .slice(0, RECENT_WORKOUT_LIMIT)
    .map(({ shareSortTime, ...session }) => session);

  return {
    recentSessions: sessions,
  };
}

function loadNutritionSnapshot(userProfile) {
  if (!userProfile?.weight || !userProfile?.height || !userProfile?.age) {
    return null;
  }

  const nutritionPlan = calculateNutritionPlan(userProfile);

  return {
    targets: {
      targetCalories: nutritionPlan.targetCalories,
      macros: nutritionPlan.macros,
      bmi: nutritionPlan.bmi,
      tdee: nutritionPlan.tdee,
    },
    dailyMealPlan: generateDailyPlan(nutritionPlan.meals),
  };
}

function createShareId(role) {
  const entropy = Math.random().toString(36).slice(2, 10);
  return `${role}-${Date.now().toString(36)}-${entropy}`;
}

function buildWebShareUrl(baseUrl, shareId) {
  const normalizedBase = (baseUrl || DEFAULT_SHARE_BASE_URL).replace(/\/+$/, '');
  return `${normalizedBase}/share/${encodeURIComponent(shareId)}`;
}

function normalizeWorkoutSession(logDoc, timestampField) {
  const data = logDoc.data();

  return {
    id: logDoc.id,
    ...data,
    shareSortTime: data[timestampField] || data.completedAt || data.createdAt || data.date || null,
  };
}

function getTimestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number') return value;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
