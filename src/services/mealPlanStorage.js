/**
 * Meal Plan Storage Service
 * Handles Firestore persistence for user meal plans,
 * swap history, and cooldown logic.
 */

import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Cooldown configuration (in milliseconds)
 */
const SWAP_COOLDOWNS = {
  singleFood: 24 * 60 * 60 * 1000,          // 24 hours between single food swaps
  fullMealPlan: 14 * 24 * 60 * 60 * 1000,   // 2 weeks between full plan regeneration
  maxDailySwaps: 3,                           // Max food swaps per day
};

/**
 * Save user's current meal plan to Firestore
 * @param {string} uid - User ID
 * @param {object} mealPlan - Generated daily meal plan
 * @param {object} nutritionTargets - Calculated nutrition targets (calories, macros)
 * @returns {Promise<void>}
 */
export async function saveMealPlan(uid, mealPlan, nutritionTargets) {
  if (!uid) return;

  const planData = {
    mealPlan,
    nutritionTargets: {
      targetCalories: nutritionTargets.targetCalories,
      macros: nutritionTargets.macros,
      bmi: nutritionTargets.bmi,
      tdee: nutritionTargets.tdee,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastFullRegeneration: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', uid, 'nutrition', 'currentPlan'), planData);
}

/**
 * Load user's saved meal plan from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<object|null>} Saved plan data or null
 */
export async function loadMealPlan(uid) {
  if (!uid) return null;

  try {
    const planDoc = await getDoc(doc(db, 'users', uid, 'nutrition', 'currentPlan'));
    if (planDoc.exists()) {
      return planDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error loading meal plan:', error);
    return null;
  }
}

/**
 * Record a food swap in the history
 * @param {string} uid - User ID
 * @param {object} swapDetails - { mealId, slotIndex, oldFood, newFood }
 * @returns {Promise<void>}
 */
export async function recordSwap(uid, swapDetails) {
  if (!uid) return;

  const today = new Date().toISOString().split('T')[0];
  const swapId = `${Date.now()}`;

  await setDoc(doc(db, 'users', uid, 'nutrition', 'swapHistory', 'swaps', swapId), {
    ...swapDetails,
    date: today,
    timestamp: serverTimestamp(),
  });

  // Update daily swap counter
  const counterRef = doc(db, 'users', uid, 'nutrition', 'swapCounter');
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
 * Check if user can perform a food swap (cooldown check)
 * @param {string} uid - User ID
 * @returns {Promise<object>} { canSwap: boolean, reason: string, remainingTime: number }
 */
export async function checkSwapCooldown(uid) {
  if (!uid) return { canSwap: false, reason: 'לא מחובר', remainingTime: 0 };

  try {
    const counterRef = doc(db, 'users', uid, 'nutrition', 'swapCounter');
    const counterDoc = await getDoc(counterRef);

    if (!counterDoc.exists()) {
      return { canSwap: true, reason: '', remainingTime: 0 };
    }

    const data = counterDoc.data();
    const today = new Date().toISOString().split('T')[0];

    // Check daily limit
    if (data.date === today && data.count >= SWAP_COOLDOWNS.maxDailySwaps) {
      return {
        canSwap: false,
        reason: `הגעת למגבלה היומית (${SWAP_COOLDOWNS.maxDailySwaps} החלפות ליום)`,
        remainingTime: getTimeUntilMidnight(),
      };
    }

    return { canSwap: true, reason: '', remainingTime: 0 };
  } catch (error) {
    console.error('Error checking swap cooldown:', error);
    // Allow swap on error (don't block user)
    return { canSwap: true, reason: '', remainingTime: 0 };
  }
}

/**
 * Check if user can regenerate their full meal plan
 * @param {string} uid - User ID
 * @returns {Promise<object>} { canRegenerate: boolean, reason: string, nextAvailable: Date }
 */
export async function checkRegenerationCooldown(uid) {
  if (!uid) return { canRegenerate: false, reason: 'לא מחובר', nextAvailable: null };

  try {
    const planDoc = await getDoc(doc(db, 'users', uid, 'nutrition', 'currentPlan'));

    if (!planDoc.exists()) {
      return { canRegenerate: true, reason: '', nextAvailable: null };
    }

    const data = planDoc.data();
    const lastRegen = data.lastFullRegeneration?.toDate?.();

    if (!lastRegen) {
      return { canRegenerate: true, reason: '', nextAvailable: null };
    }

    const timeSinceRegen = Date.now() - lastRegen.getTime();
    const cooldown = SWAP_COOLDOWNS.fullMealPlan;

    if (timeSinceRegen < cooldown) {
      const nextAvailable = new Date(lastRegen.getTime() + cooldown);
      const daysRemaining = Math.ceil((cooldown - timeSinceRegen) / (24 * 60 * 60 * 1000));
      return {
        canRegenerate: false,
        reason: `ניתן לייצר תפריט חדש בעוד ${daysRemaining} ימים`,
        nextAvailable,
      };
    }

    return { canRegenerate: true, reason: '', nextAvailable: null };
  } catch (error) {
    console.error('Error checking regeneration cooldown:', error);
    return { canRegenerate: true, reason: '', nextAvailable: null };
  }
}

/**
 * Update the meal plan after a swap
 * @param {string} uid - User ID
 * @param {object} updatedMealPlan - Updated meal plan object
 * @returns {Promise<void>}
 */
export async function updateMealPlanAfterSwap(uid, updatedMealPlan) {
  if (!uid) return;

  await updateDoc(doc(db, 'users', uid, 'nutrition', 'currentPlan'), {
    mealPlan: updatedMealPlan,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Helper: Get milliseconds until midnight
 */
function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/**
 * Get swap history for display
 * @param {string} uid - User ID
 * @param {number} limit - Max entries to return
 * @returns {Promise<object[]>} Array of swap records
 */
export async function getSwapHistory(uid, limit = 10) {
  if (!uid) return [];

  try {
    // For simplicity, we'll read from the counter doc
    // In production, you'd query the swaps subcollection with orderBy/limit
    const counterDoc = await getDoc(doc(db, 'users', uid, 'nutrition', 'swapCounter'));
    if (counterDoc.exists()) {
      return [counterDoc.data()];
    }
    return [];
  } catch (error) {
    console.error('Error getting swap history:', error);
    return [];
  }
}
