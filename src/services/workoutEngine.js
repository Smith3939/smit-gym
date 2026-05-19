/**
 * Workout Program Generator Engine
 * Generates personalized training programs (AB, ABC, Full Body, Push/Pull/Legs)
 * based on user goals, experience level, and available training days.
 */

import { EXERCISES, MUSCLE_GROUPS } from '../data/exercises';

/**
 * Program split types and their muscle group distributions
 */
export const PROGRAM_TYPES = {
  AB: {
    id: 'AB',
    name: 'תוכנית A/B',
    description: 'חלוקה ל-2 אימונים - מתאים ל-2-4 אימונים בשבוע',
    days: 2,
    splits: {
      A: {
        name: 'אימון A - חזה, יד אחורית, רגליים',
        muscleGroups: ['chest', 'triceps', 'legs'],
      },
      B: {
        name: 'אימון B - גב, כתפיים, יד קדמית',
        muscleGroups: ['back', 'shoulders', 'biceps'],
      },
    },
  },
  ABC: {
    id: 'ABC',
    name: 'תוכנית A/B/C',
    description: 'חלוקה ל-3 אימונים - מתאים ל-3-6 אימונים בשבוע',
    days: 3,
    splits: {
      A: {
        name: 'אימון A - חזה ויד אחורית',
        muscleGroups: ['chest', 'triceps'],
      },
      B: {
        name: 'אימון B - גב ויד קדמית',
        muscleGroups: ['back', 'biceps'],
      },
      C: {
        name: 'אימון C - רגליים וכתפיים',
        muscleGroups: ['legs', 'shoulders'],
      },
    },
  },
  PPL: {
    id: 'PPL',
    name: 'Push / Pull / Legs',
    description: 'דחיפה, משיכה, רגליים - מתאים ל-3-6 אימונים בשבוע',
    days: 3,
    splits: {
      Push: {
        name: 'Push - חזה, כתפיים, יד אחורית',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
      },
      Pull: {
        name: 'Pull - גב ויד קדמית',
        muscleGroups: ['back', 'biceps'],
      },
      Legs: {
        name: 'Legs - רגליים',
        muscleGroups: ['legs'],
      },
    },
  },
  FULL_BODY: {
    id: 'FULL_BODY',
    name: 'Full Body',
    description: 'אימון כל הגוף - מתאים ל-2-3 אימונים בשבוע',
    days: 1,
    splits: {
      Full: {
        name: 'אימון כל הגוף',
        muscleGroups: ['chest', 'back', 'shoulders', 'legs', 'biceps', 'triceps'],
      },
    },
  },
  DAILY: {
    id: 'DAILY',
    name: 'כל יום שריר אחר',
    description: 'כל אימון מתמקד בשריר אחד - מתאים ל-5-6 אימונים בשבוע',
    days: 5,
    splits: {
      'יום חזה': {
        name: 'יום חזה',
        muscleGroups: ['chest'],
      },
      'יום גב': {
        name: 'יום גב',
        muscleGroups: ['back'],
      },
      'יום כתפיים': {
        name: 'יום כתפיים',
        muscleGroups: ['shoulders'],
      },
      'יום רגליים': {
        name: 'יום רגליים',
        muscleGroups: ['legs'],
      },
      'יום ידיים': {
        name: 'יום ידיים',
        muscleGroups: ['biceps', 'triceps'],
      },
    },
  },
};

/**
 * Exercise selection rules by goal
 */
const GOAL_CONFIG = {
  cut: {
    setsPerMuscle: { primary: 4, secondary: 3 },
    repsRange: '10-15',
    restSeconds: 60,
    exercisesPerMuscle: { primary: 4, secondary: 3 },
    includeCardio: true,
    prioritize: 'compound', // Prefer compound movements for calorie burn
  },
  bulk: {
    setsPerMuscle: { primary: 4, secondary: 3 },
    repsRange: '6-10',
    restSeconds: 120,
    exercisesPerMuscle: { primary: 5, secondary: 4 },
    includeCardio: false,
    prioritize: 'heavy', // Prefer heavy compound lifts
  },
  maintain: {
    setsPerMuscle: { primary: 3, secondary: 3 },
    repsRange: '8-12',
    restSeconds: 90,
    exercisesPerMuscle: { primary: 4, secondary: 3 },
    includeCardio: true,
    prioritize: 'balanced',
  },
};

/**
 * Compound exercises that should be prioritized (first in workout)
 */
const COMPOUND_EXERCISES = {
  chest: ['bench_press', 'incline_bench', 'chest_press_machine'],
  back: ['lat_pulldown_wide', 'barbell_row', 'pullup', 'cable_row'],
  shoulders: ['shoulder_press_free', 'shoulder_press_machine'],
  legs: ['squat', 'leg_press', 'lunges', 'hip_thrust'],
  biceps: ['barbell_curl', 'dumbbell_curl'],
  triceps: ['french_press', 'parallel_bars'],
};

/**
 * Determine if a muscle group is primary or secondary in a given split
 * Primary = the main focus, gets more exercises
 * Secondary = supporting, gets fewer exercises
 */
function getMuscleRole(muscleGroup, allMusclesInSplit) {
  // If only 1-2 muscles in split, all are primary
  if (allMusclesInSplit.length <= 2) return 'primary';

  // Arms are usually secondary
  if (['biceps', 'triceps'].includes(muscleGroup)) return 'secondary';

  return 'primary';
}

/**
 * Select exercises for a muscle group based on goal and role
 * @param {string} muscleGroup - Muscle group key
 * @param {string} goal - 'cut' | 'bulk' | 'maintain'
 * @param {string} role - 'primary' | 'secondary'
 * @param {string[]} excludeIds - Exercise IDs to exclude (for variation)
 * @returns {object[]} Selected exercises with sets/reps
 */
export function selectExercises(muscleGroup, goal = 'cut', role = 'primary', excludeIds = []) {
  const config = GOAL_CONFIG[goal] || GOAL_CONFIG.cut;
  const available = EXERCISES[muscleGroup] || [];
  const count = config.exercisesPerMuscle[role] || 3;

  // Filter out excluded exercises
  let pool = available.filter((ex) => !excludeIds.includes(ex.id));
  if (pool.length === 0) pool = available; // Fallback if all excluded

  // Prioritize compound exercises first
  const compounds = COMPOUND_EXERCISES[muscleGroup] || [];
  const compoundExercises = pool.filter((ex) => compounds.includes(ex.id));
  const isolationExercises = pool.filter((ex) => !compounds.includes(ex.id));

  // Build selection: compounds first, then isolation
  let selected = [];

  // Always include warmup if available
  const warmup = pool.find((ex) => ex.id.includes('warmup'));
  if (warmup) {
    selected.push({
      exerciseId: warmup.id,
      muscleGroup,
      name: warmup.name,
      sets: 2,
      reps: warmup.defaultReps,
      isWarmup: true,
    });
  }

  // Add compound exercises
  const compoundsToAdd = compoundExercises
    .filter((ex) => !ex.id.includes('warmup'))
    .slice(0, Math.min(2, count));

  compoundsToAdd.forEach((ex) => {
    selected.push({
      exerciseId: ex.id,
      muscleGroup,
      name: ex.name,
      sets: config.setsPerMuscle[role],
      reps: goal === 'bulk' ? '6-8' : ex.defaultReps,
      isCompound: true,
    });
  });

  // Fill remaining with isolation exercises
  const remaining = count - selected.length + (warmup ? 1 : 0);
  const isolationsToAdd = isolationExercises
    .filter((ex) => !ex.id.includes('warmup'))
    .slice(0, Math.max(0, remaining));

  isolationsToAdd.forEach((ex) => {
    selected.push({
      exerciseId: ex.id,
      muscleGroup,
      name: ex.name,
      sets: config.setsPerMuscle[role] - 1,
      reps: ex.defaultReps,
      isCompound: false,
    });
  });

  return selected.slice(0, count + (warmup ? 1 : 0));
}

/**
 * Generate a single workout session for a split day
 * @param {object} splitConfig - { name, muscleGroups }
 * @param {string} goal - User's goal
 * @param {string[]} excludeIds - Exercises to exclude for variation
 * @returns {object} Generated workout session
 */
export function generateWorkoutSession(splitConfig, goal = 'cut', excludeIds = []) {
  const { name, muscleGroups } = splitConfig;
  const config = GOAL_CONFIG[goal] || GOAL_CONFIG.cut;

  let exercises = [];

  muscleGroups.forEach((muscleGroup) => {
    const role = getMuscleRole(muscleGroup, muscleGroups);
    const muscleExercises = selectExercises(muscleGroup, goal, role, excludeIds);
    exercises = [...exercises, ...muscleExercises];
  });

  // Add abs at the end if it's a cut/maintain program and not a legs day
  if ((goal === 'cut' || goal === 'maintain') && !muscleGroups.includes('legs')) {
    const absExercises = selectExercises('abs', goal, 'secondary', []);
    exercises = [...exercises, ...absExercises.slice(0, 2)];
  }

  // Add cardio at the end if configured
  if (config.includeCardio) {
    const cardio = EXERCISES.cardio?.[0];
    if (cardio) {
      exercises.push({
        exerciseId: cardio.id,
        muscleGroup: 'cardio',
        name: cardio.name,
        sets: 1,
        reps: '15-20 דקות',
        isCardio: true,
      });
    }
  }

  return {
    name,
    muscleGroups,
    exercises,
    restBetweenSets: config.restSeconds,
    estimatedDuration: estimateWorkoutDuration(exercises, config.restSeconds),
  };
}

/**
 * Generate a complete training program
 * @param {string} programType - 'AB' | 'ABC' | 'PPL' | 'FULL_BODY' | 'DAILY'
 * @param {string} goal - 'cut' | 'bulk' | 'maintain'
 * @param {string[]} excludeIds - Exercises to exclude
 * @returns {object} Complete program with all sessions
 */
export function generateProgram(programType = 'AB', goal = 'cut', excludeIds = []) {
  const programConfig = PROGRAM_TYPES[programType];
  if (!programConfig) {
    return generateProgram('AB', goal, excludeIds); // Fallback to AB
  }

  const sessions = {};

  Object.entries(programConfig.splits).forEach(([dayKey, splitConfig]) => {
    sessions[dayKey] = generateWorkoutSession(splitConfig, goal, excludeIds);
  });

  return {
    type: programType,
    name: programConfig.name,
    description: programConfig.description,
    days: programConfig.days,
    goal,
    sessions,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get a single exercise alternative for swapping
 * @param {string} exerciseId - Current exercise to replace
 * @param {string} muscleGroup - Muscle group
 * @param {string[]} currentProgramExerciseIds - All exercises currently in program (to avoid duplicates)
 * @returns {object[]} Alternative exercises
 */
export function getExerciseAlternatives(exerciseId, muscleGroup, currentProgramExerciseIds = []) {
  const available = EXERCISES[muscleGroup] || [];

  return available
    .filter((ex) => ex.id !== exerciseId && !currentProgramExerciseIds.includes(ex.id))
    .filter((ex) => !ex.id.includes('warmup'))
    .map((ex) => ({
      exerciseId: ex.id,
      muscleGroup,
      name: ex.name,
      defaultSets: ex.defaultSets,
      defaultReps: ex.defaultReps,
    }));
}

/**
 * Swap a single exercise in the program
 * @param {object} program - Current program
 * @param {string} dayKey - Which day (A, B, C, etc.)
 * @param {number} exerciseIndex - Index of exercise to swap
 * @param {object} newExercise - New exercise to put in place
 * @returns {object} Updated program
 */
export function swapExerciseInProgram(program, dayKey, exerciseIndex, newExercise) {
  const updated = JSON.parse(JSON.stringify(program)); // Deep clone
  const session = updated.sessions[dayKey];

  if (session && session.exercises[exerciseIndex]) {
    const oldExercise = session.exercises[exerciseIndex];
    session.exercises[exerciseIndex] = {
      ...newExercise,
      sets: oldExercise.sets,
      reps: newExercise.defaultReps || oldExercise.reps,
      muscleGroup: oldExercise.muscleGroup,
      isCompound: oldExercise.isCompound,
    };
  }

  updated.updatedAt = new Date().toISOString();
  return updated;
}

/**
 * Estimate workout duration in minutes
 * @param {object[]} exercises - Array of exercises
 * @param {number} restSeconds - Rest between sets
 * @returns {number} Estimated minutes
 */
function estimateWorkoutDuration(exercises, restSeconds) {
  let totalSeconds = 0;

  exercises.forEach((ex) => {
    if (ex.isCardio) {
      totalSeconds += 20 * 60; // 20 min cardio
    } else if (ex.isWarmup) {
      totalSeconds += 3 * 60; // 3 min warmup
    } else {
      const sets = ex.sets || 3;
      const setDuration = 45; // 45 seconds per set (execution)
      totalSeconds += sets * (setDuration + restSeconds);
    }
  });

  return Math.round(totalSeconds / 60);
}

/**
 * Suggest a program type based on user's activity level
 * @param {string} activityLevel - 'low' | 'moderate' | 'high'
 * @returns {string} Suggested program type key
 */
export function suggestProgramType(activityLevel = 'moderate') {
  switch (activityLevel) {
    case 'low':
      return 'FULL_BODY';
    case 'moderate':
      return 'AB';
    case 'high':
      return 'ABC';
    default:
      return 'AB';
  }
}

/**
 * Get all available program types for display
 * @returns {object[]} Array of program type options
 */
export function getAvailableProgramTypes() {
  return Object.values(PROGRAM_TYPES).map((pt) => ({
    id: pt.id,
    name: pt.name,
    description: pt.description,
    days: pt.days,
  }));
}
