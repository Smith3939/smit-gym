/**
 * Workout Storage Service
 * Handles Firestore persistence for workout programs, session logs,
 * exercise swap history, and cooldown logic for program variation.
 */

import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Cooldown configuration
 */
const WORKOUT_COOLDOWNS = {
  singleExerciseSwap: 24 * 60 * 60 * 1000,        // 24 hours between single exercise swaps
  fullSessionVariation: 14 * 24 * 60 * 60 * 1000,  // 2 weeks between full session AI variation
  fullProgramRegeneration: 30 * 24 * 60 * 60 * 1000, // 1 month between full program regeneration
  maxDailySwaps: 2,                                  // Max exercise swaps per day
};

/**
 * Save user's current workout program to Firestore
 * @param {string} uid - User ID
 * @param {object} program - Generated workout program
 * @returns {Promise<void>}
 */
export async function saveWorkoutProgram(uid, program) {
  if (!uid) return;

  const programData = {
    ...program,
    savedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastFullVariation: null,
    lastProgramRegeneration: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', uid, 'workout', 'currentProgram'), programData);
}

/**
 * Load user's saved workout program from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<object|null>} Saved program or null
 */
export async function loadWorkoutProgram(uid) {
  if (!uid) return null;

  try {
    const programDoc = await getDoc(doc(db, 'users', uid, 'workout', 'currentProgram'));
    if (programDoc.exists()) {
      return programDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error loading workout program:', error);
    return null;
  }
}

/**
 * Update the workout program after a swap or variation
 * @param {string} uid - User ID
 * @param {object} updatedProgram - Updated program object
 * @returns {Promise<void>}
 */
export async function updateWorkoutProgram(uid, updatedProgram) {
  if (!uid) return;

  await updateDoc(doc(db, 'users', uid, 'workout', 'currentProgram'), {
    ...updatedProgram,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Save a completed workout session log
 * @param {string} uid - User ID
 * @param {object} sessionLog - { dayKey, sessionName, exercises, setLogs, duration }
 * @returns {Promise<string>} Log ID
 */
export async function saveWorkoutSession(uid, sessionLog) {
  if (!uid) return null;

  const logId = `${Date.now()}`;
  const logData = {
    ...sessionLog,
    completedAt: serverTimestamp(),
    date: new Date().toISOString().split('T')[0],
  };

  await setDoc(doc(db, 'users', uid, 'workout', 'logs', 'sessions', logId), logData);

  // Update workout counter
  const counterRef = doc(db, 'users', uid, 'workout', 'stats');
  const counterDoc = await getDoc(counterRef);

  if (counterDoc.exists()) {
    const data = counterDoc.data();
    await updateDoc(counterRef, {
      totalSessions: (data.totalSessions || 0) + 1,
      lastWorkout: serverTimestamp(),
      thisWeekSessions: getThisWeekCount(data),
    });
  } else {
    await setDoc(counterRef, {
      totalSessions: 1,
      lastWorkout: serverTimestamp(),
      thisWeekSessions: 1,
      weekStart: getWeekStart(),
    });
  }

  return logId;
}

/**
 * Record an exercise swap
 * @param {string} uid - User ID
 * @param {object} swapDetails - { dayKey, exerciseIndex, oldExercise, newExercise }
 * @returns {Promise<void>}
 */
export async function recordExerciseSwap(uid, swapDetails) {
  if (!uid) return;

  const today = new Date().toISOString().split('T')[0];
  const swapId = `${Date.now()}`;

  await setDoc(doc(db, 'users', uid, 'workout', 'swapHistory', 'swaps', swapId), {
    ...swapDetails,
    date: today,
    timestamp: serverTimestamp(),
  });

  // Update daily swap counter
  const counterRef = doc(db, 'users', uid, 'workout', 'swapCounter');
  const counterDoc = await getDoc(counterRef);

  if (counterDoc.exists()) {
    const data = counterDoc.data();
    if (data.date === today) {
      await updateDoc(counterRef, {
        count: (data.count || 0) + 1,
        lastSwap: serverTimestamp(),
      });
    } else {
      await setDoc(counterRef, { date: today, count: 1, lastSwap: serverTimestamp() });
    }
  } else {
    await setDoc(counterRef, { date: today, count: 1, lastSwap: serverTimestamp() });
  }
}

/**
 * Check if user can swap an exercise (daily limit check)
 * @param {string} uid - User ID
 * @returns {Promise<object>} { canSwap, reason, swapsRemaining }
 */
export async function checkExerciseSwapCooldown(uid) {
  if (!uid) return { canSwap: false, reason: 'לא מחובר', swapsRemaining: 0 };

  try {
    const counterRef = doc(db, 'users', uid, 'workout', 'swapCounter');
    const counterDoc = await getDoc(counterRef);

    if (!counterDoc.exists()) {
      return { canSwap: true, reason: '', swapsRemaining: WORKOUT_COOLDOWNS.maxDailySwaps };
    }

    const data = counterDoc.data();
    const today = new Date().toISOString().split('T')[0];

    if (data.date === today && data.count >= WORKOUT_COOLDOWNS.maxDailySwaps) {
      return {
        canSwap: false,
        reason: `הגעת למגבלה היומית (${WORKOUT_COOLDOWNS.maxDailySwaps} החלפות ליום).\nנסה שוב מחר.`,
        swapsRemaining: 0,
      };
    }

    const remaining = data.date === today
      ? WORKOUT_COOLDOWNS.maxDailySwaps - (data.count || 0)
      : WORKOUT_COOLDOWNS.maxDailySwaps;

    return { canSwap: true, reason: '', swapsRemaining: remaining };
  } catch (error) {
    console.error('Error checking swap cooldown:', error);
    return { canSwap: true, reason: '', swapsRemaining: WORKOUT_COOLDOWNS.maxDailySwaps };
  }
}

/**
 * Check if user can variate an entire session (2-week cooldown)
 * @param {string} uid - User ID
 * @param {string} dayKey - Which day to check
 * @returns {Promise<object>} { canVariate, reason, daysRemaining }
 */
export async function checkSessionVariationCooldown(uid, dayKey) {
  if (!uid) return { canVariate: false, reason: 'לא מחובר', daysRemaining: 0 };

  try {
    const programDoc = await getDoc(doc(db, 'users', uid, 'workout', 'currentProgram'));

    if (!programDoc.exists()) {
      return { canVariate: true, reason: '', daysRemaining: 0 };
    }

    const data = programDoc.data();
    const lastVariation = data.lastFullVariation?.toDate?.();

    if (!lastVariation) {
      return { canVariate: true, reason: '', daysRemaining: 0 };
    }

    const timeSince = Date.now() - lastVariation.getTime();
    const cooldown = WORKOUT_COOLDOWNS.fullSessionVariation;

    if (timeSince < cooldown) {
      const daysRemaining = Math.ceil((cooldown - timeSince) / (24 * 60 * 60 * 1000));
      return {
        canVariate: false,
        reason: `ניתן לגוון את האימון בעוד ${daysRemaining} ימים.\nהגבלה: פעם בשבועיים.`,
        daysRemaining,
      };
    }

    return { canVariate: true, reason: '', daysRemaining: 0 };
  } catch (error) {
    console.error('Error checking variation cooldown:', error);
    return { canVariate: true, reason: '', daysRemaining: 0 };
  }
}

/**
 * Check if user can regenerate their entire program (1-month cooldown)
 * @param {string} uid - User ID
 * @returns {Promise<object>} { canRegenerate, reason, daysRemaining }
 */
export async function checkProgramRegenerationCooldown(uid) {
  if (!uid) return { canRegenerate: false, reason: 'לא מחובר', daysRemaining: 0 };

  try {
    const programDoc = await getDoc(doc(db, 'users', uid, 'workout', 'currentProgram'));

    if (!programDoc.exists()) {
      return { canRegenerate: true, reason: '', daysRemaining: 0 };
    }

    const data = programDoc.data();
    const lastRegen = data.lastProgramRegeneration?.toDate?.();

    if (!lastRegen) {
      return { canRegenerate: true, reason: '', daysRemaining: 0 };
    }

    const timeSince = Date.now() - lastRegen.getTime();
    const cooldown = WORKOUT_COOLDOWNS.fullProgramRegeneration;

    if (timeSince < cooldown) {
      const daysRemaining = Math.ceil((cooldown - timeSince) / (24 * 60 * 60 * 1000));
      return {
        canRegenerate: false,
        reason: `ניתן לייצר תוכנית חדשה בעוד ${daysRemaining} ימים.\nהגבלה: פעם בחודש.`,
        daysRemaining,
      };
    }

    return { canRegenerate: true, reason: '', daysRemaining: 0 };
  } catch (error) {
    console.error('Error checking regeneration cooldown:', error);
    return { canRegenerate: true, reason: '', daysRemaining: 0 };
  }
}

/**
 * Mark that a full session variation was performed
 * @param {string} uid - User ID
 * @returns {Promise<void>}
 */
export async function markSessionVariation(uid) {
  if (!uid) return;

  await updateDoc(doc(db, 'users', uid, 'workout', 'currentProgram'), {
    lastFullVariation: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get workout statistics
 * @param {string} uid - User ID
 * @returns {Promise<object>} Stats object
 */
export async function getWorkoutStats(uid) {
  if (!uid) return null;

  try {
    const statsDoc = await getDoc(doc(db, 'users', uid, 'workout', 'stats'));
    if (statsDoc.exists()) {
      return statsDoc.data();
    }
    return { totalSessions: 0, thisWeekSessions: 0 };
  } catch (error) {
    console.error('Error getting workout stats:', error);
    return { totalSessions: 0, thisWeekSessions: 0 };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

function getThisWeekCount(data) {
  const currentWeekStart = getWeekStart();
  if (data.weekStart === currentWeekStart) {
    return (data.thisWeekSessions || 0) + 1;
  }
  return 1; // New week
}
