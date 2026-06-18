import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { calculateNutritionPlan } from './nutritionEngine';
import { generateDailyPlan } from './mealPlanGenerator';

const SHARE_COLLECTION = 'sharedProfiles';
const RECENT_WORKOUT_LIMIT = 12;
const DEFAULT_EXPIRY_DAYS = 30;

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
    return `${window.location.origin}/share/${shareId}`;
  }

  return `smitgym://share/${shareId}`;
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
  const logsQuery = query(
    collection(db, 'users', uid, 'workoutLogs'),
    orderBy('createdAt', 'desc'),
    limit(RECENT_WORKOUT_LIMIT)
  );
  const logsSnapshot = await getDocs(logsQuery);

  return {
    recentSessions: logsSnapshot.docs.map((logDoc) => ({
      id: logDoc.id,
      ...logDoc.data(),
    })),
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

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
