/**
 * AI Workout Service
 * Handles AI-powered exercise variation and program adjustments.
 * Returns structured JSON responses that can be directly applied to the workout program.
 */

import { EXERCISES, MUSCLE_GROUPS } from '../data/exercises';
import { getExerciseAlternatives } from './workoutEngine';
import { callClaude, parseClaudeJson } from './claudeClient';

/**
 * System prompt for workout AI actions
 */
const WORKOUT_SYSTEM_PROMPT = `אתה מאמן כושר מקצועי בשם "מאמן Smit".
אתה מחזיר תשובות בפורמט JSON בלבד.

כשמבקשים ממך להחליף תרגיל, אתה מחזיר JSON עם:
- alternatives: מערך של תרגילים חלופיים
- reasoning: הסבר קצר בעברית למה ההחלפה מתאימה

כשמבקשים ממך לגוון תוכנית אימון, אתה מחזיר JSON עם:
- exercises: מערך תרגילים חדשים
- reasoning: הסבר על השינויים

חשוב: 
- תמיד תתאים את ההמלצות למטרה של המתאמן
- שמור על איזון בין תרגילי מורכבים (compound) לבידוד (isolation)
- תרגילי compound צריכים להיות ראשונים באימון
- התאם סטים וחזרות למטרה (חיטוב: 10-15, מסה: 6-10, שמירה: 8-12)`;

/**
 * Build exercise database context for AI
 */
function getExerciseDatabaseContext() {
  let context = 'מאגר תרגילים זמין:\n';
  for (const [groupKey, exercises] of Object.entries(EXERCISES)) {
    const groupName = MUSCLE_GROUPS.find((g) => g.id === groupKey)?.name || groupKey;
    context += `\n${groupName} (${groupKey}):\n`;
    exercises.forEach((ex) => {
      context += `- ${ex.id}: ${ex.name} (${ex.defaultSets} סטים, ${ex.defaultReps} חזרות)\n`;
    });
  }
  return context;
}

/**
 * Request AI to suggest exercise alternatives
 * @param {object} currentExercise - { exerciseId, name, muscleGroup, sets, reps }
 * @param {object} userProfile - User profile for personalization
 * @param {string[]} currentProgramIds - All exercise IDs in current program (to avoid duplicates)
 * @param {string} userRequest - Optional specific request
 * @returns {object} { alternatives: [...], reasoning: string }
 */
export async function requestExerciseSwap(currentExercise, userProfile, currentProgramIds = [], userRequest = '') {
  const exerciseContext = getExerciseDatabaseContext();

  const goalNames = { cut: 'חיטוב', bulk: 'עלייה במסה', maintain: 'שמירה' };
  const userGoal = goalNames[userProfile?.goal] || 'חיטוב';

  const prompt = `
${exerciseContext}

המתאמן רוצה להחליף את התרגיל: ${currentExercise.name} (${currentExercise.exerciseId})
קבוצת שריר: ${currentExercise.muscleGroup}
סטים נוכחיים: ${currentExercise.sets}
חזרות נוכחיות: ${currentExercise.reps}

תרגילים שכבר נמצאים בתוכנית (אל תציע אותם): ${currentProgramIds.join(', ')}

פרטי המתאמן:
- מטרה: ${userGoal}
- רמת פעילות: ${userProfile?.activityLevel || 'moderate'}

${userRequest ? `בקשה ספציפית: ${userRequest}` : ''}

החזר JSON בפורמט הבא בלבד (ללא markdown, ללא backticks):
{
  "alternatives": [
    {
      "exerciseId": "מזהה_תרגיל_מהמאגר",
      "name": "שם התרגיל",
      "muscleGroup": "קבוצת_שריר",
      "sets": מספר_סטים,
      "reps": "טווח_חזרות",
      "reason": "סיבה קצרה להמלצה",
      "benefit": "יתרון ספציפי של התרגיל"
    }
  ],
  "reasoning": "הסבר כללי קצר בעברית על ההחלפות המומלצות"
}

הנחיות:
1. הצע 3-4 חלופות מאותה קבוצת שריר (${currentExercise.muscleGroup})
2. השתמש רק בתרגילים מהמאגר
3. התאם סטים וחזרות למטרה (${userGoal})
4. אל תציע תרגילים שכבר בתוכנית
5. תן עדיפות לתרגילים שעובדים על אותו חלק בשריר`;

  try {
    const text = await callClaude({
      system: WORKOUT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1024,
    });
    const result = parseClaudeJson(text);

    // Validate alternatives against our database
    if (result.alternatives) {
      result.alternatives = result.alternatives
        .map((alt) => {
          // Verify exercise exists in our database
          const muscleExercises = EXERCISES[alt.muscleGroup || currentExercise.muscleGroup] || [];
          const dbExercise = muscleExercises.find((ex) => ex.id === alt.exerciseId);

          if (dbExercise) {
            return {
              exerciseId: dbExercise.id,
              name: dbExercise.name,
              muscleGroup: alt.muscleGroup || currentExercise.muscleGroup,
              sets: alt.sets || currentExercise.sets,
              reps: alt.reps || dbExercise.defaultReps,
              defaultSets: dbExercise.defaultSets,
              defaultReps: dbExercise.defaultReps,
              reason: alt.reason || '',
              benefit: alt.benefit || '',
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    return result;
  } catch (error) {
    if (error.code !== 'NO_API_KEY') {
      console.error('AI Workout Service Error:', error);
    }
    // Fallback to local alternatives
    return generateFallbackAlternatives(currentExercise, currentProgramIds);
  }
}

/**
 * Request AI to regenerate an entire workout day with variation
 * @param {object} currentSession - Current workout session
 * @param {object} userProfile - User profile
 * @param {string} variationType - 'similar' | 'different' | 'progressive'
 * @returns {object} New session with varied exercises
 */
export async function requestSessionVariation(currentSession, userProfile, variationType = 'similar') {
  const exerciseContext = getExerciseDatabaseContext();
  const goalNames = { cut: 'חיטוב', bulk: 'עלייה במסה', maintain: 'שמירה' };
  const userGoal = goalNames[userProfile?.goal] || 'חיטוב';

  const currentExerciseNames = currentSession.exercises
    .map((ex) => `${ex.name} (${ex.exerciseId})`)
    .join('\n- ');

  const variationInstructions = {
    similar: 'החלף תרגילים בתרגילים דומים שעובדים על אותם שרירים מזווית שונה',
    different: 'שנה את רוב התרגילים לתרגילים שונים לחלוטין מאותה קבוצת שריר',
    progressive: 'הוסף עומס - העלה סטים או החלף תרגילי בידוד בתרגילים מורכבים יותר',
  };

  const prompt = `
${exerciseContext}

המתאמן רוצה לגוון את האימון הבא:
שם: ${currentSession.name}
קבוצות שריר: ${currentSession.muscleGroups.join(', ')}

תרגילים נוכחיים:
- ${currentExerciseNames}

סוג הגיוון המבוקש: ${variationInstructions[variationType]}

פרטי המתאמן:
- מטרה: ${userGoal}

החזר JSON בפורמט הבא בלבד (ללא markdown):
{
  "exercises": [
    {
      "exerciseId": "מזהה_תרגיל",
      "muscleGroup": "קבוצת_שריר",
      "name": "שם",
      "sets": מספר,
      "reps": "טווח",
      "isCompound": true/false,
      "isWarmup": true/false
    }
  ],
  "reasoning": "הסבר קצר על השינויים שבוצעו",
  "tip": "טיפ למתאמן"
}

הנחיות:
1. שמור על אותן קבוצות שריר
2. התחל עם חימום, אח"כ compound, אח"כ isolation
3. התאם למטרה: ${userGoal}
4. השתמש רק בתרגילים מהמאגר`;

  try {
    const text = await callClaude({
      system: WORKOUT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1500,
    });
    const result = parseClaudeJson(text);

    // Validate exercises
    if (result.exercises) {
      result.exercises = result.exercises
        .map((ex) => {
          const muscleExercises = EXERCISES[ex.muscleGroup] || [];
          const dbExercise = muscleExercises.find((e) => e.id === ex.exerciseId);
          if (dbExercise) {
            return {
              exerciseId: dbExercise.id,
              muscleGroup: ex.muscleGroup,
              name: dbExercise.name,
              sets: ex.sets || dbExercise.defaultSets,
              reps: ex.reps || dbExercise.defaultReps,
              isCompound: ex.isCompound || false,
              isWarmup: ex.isWarmup || false,
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    return result;
  } catch (error) {
    if (error.code !== 'NO_API_KEY') {
      console.error('AI Session Variation Error:', error);
    }
    // Local fallback: swap each non-warmup/non-cardio exercise for a same-muscle
    // alternative so "vary with AI" still does something useful without a key.
    return generateFallbackVariation(currentSession);
  }
}

/**
 * Local fallback for session variation - swaps each main exercise for a
 * same-muscle-group alternative not already in the session.
 */
function generateFallbackVariation(currentSession) {
  const usedIds = currentSession.exercises.map((e) => e.exerciseId);
  const newExercises = currentSession.exercises.map((ex) => {
    if (ex.isWarmup || ex.isCardio) return ex;
    const alts = getExerciseAlternatives(ex.exerciseId, ex.muscleGroup, usedIds);
    const pick = alts && alts.length > 0 ? alts[0] : null;
    if (pick) {
      usedIds.push(pick.id);
      return {
        exerciseId: pick.id,
        muscleGroup: ex.muscleGroup,
        name: pick.name,
        sets: ex.sets,
        reps: pick.defaultReps || ex.reps,
        isCompound: ex.isCompound || false,
        isWarmup: false,
      };
    }
    return ex;
  });

  return {
    exercises: newExercises,
    reasoning: 'גיוון מקומי: כל תרגיל הוחלף בחלופה מאותה קבוצת שריר',
    tip: 'מומלץ לשמור על אותה טכניקה ולהתמקד בתחושת השריר',
  };
}

/**
 * Fallback alternative generation when AI is unavailable
 */
function generateFallbackAlternatives(currentExercise, currentProgramIds = []) {
  const alternatives = getExerciseAlternatives(
    currentExercise.exerciseId,
    currentExercise.muscleGroup,
    currentProgramIds
  ).slice(0, 4).map((alt) => ({
    ...alt,
    sets: currentExercise.sets,
    reps: alt.defaultReps,
    reason: 'חלופה מאותה קבוצת שריר',
    benefit: '',
  }));

  return {
    alternatives,
    reasoning: `הנה חלופות לתרגיל ${currentExercise.name} מאותה קבוצת שריר`,
  };
}
