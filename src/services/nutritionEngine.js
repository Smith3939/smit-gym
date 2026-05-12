/**
 * Nutrition Calculation Engine
 * Calculates BMI, BMR, TDEE, and macro distribution based on user profile.
 */

/**
 * Calculate BMI (Body Mass Index)
 * @param {number} weightKg - Weight in kilograms
 * @param {number} heightCm - Height in centimeters
 * @returns {object} { value, category }
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return { value: 0, category: 'unknown' };
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const rounded = Math.round(bmi * 10) / 10;

  let category;
  if (bmi < 18.5) category = 'underweight';
  else if (bmi < 25) category = 'normal';
  else if (bmi < 30) category = 'overweight';
  else category = 'obese';

  return { value: rounded, category };
}

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor equation
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @param {string} gender - 'male' or 'female'
 * @returns {number} BMR in kcal/day
 */
export function calculateBMR(weightKg, heightCm, age, gender = 'male') {
  if (!weightKg || !heightCm || !age) return 0;

  if (gender === 'female') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  // Male (default)
  return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

/**
 * Activity level multipliers for TDEE calculation
 */
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,       // Little to no exercise
  low: 1.375,           // 1-2 workouts per week
  moderate: 1.55,       // 3-4 workouts per week
  high: 1.725,          // 5-6 workouts per week
  extreme: 1.9,         // Athlete / 2x daily
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * @param {number} bmr
 * @param {string} activityLevel - 'sedentary' | 'low' | 'moderate' | 'high' | 'extreme'
 * @returns {number} TDEE in kcal/day
 */
export function calculateTDEE(bmr, activityLevel = 'moderate') {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  return Math.round(bmr * multiplier);
}

/**
 * Goal-based calorie adjustments
 */
const GOAL_ADJUSTMENTS = {
  cut: -400,        // Caloric deficit for fat loss / toning
  maintain: 0,      // Maintenance
  bulk: 300,        // Caloric surplus for muscle gain
};

/**
 * Calculate daily calorie target based on goal
 * @param {number} tdee
 * @param {string} goal - 'cut' | 'maintain' | 'bulk'
 * @returns {number} Target calories per day
 */
export function calculateTargetCalories(tdee, goal = 'cut') {
  const adjustment = GOAL_ADJUSTMENTS[goal] || 0;
  return Math.round(tdee + adjustment);
}

/**
 * Macro distribution ratios by goal (protein/carbs/fat as percentage of total calories)
 */
const MACRO_RATIOS = {
  cut: { protein: 0.35, carbs: 0.35, fat: 0.30 },
  maintain: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  bulk: { protein: 0.30, carbs: 0.45, fat: 0.25 },
};

/**
 * Calculate macro distribution in grams
 * @param {number} targetCalories
 * @param {string} goal - 'cut' | 'maintain' | 'bulk'
 * @param {number} weightKg - Used for minimum protein calculation
 * @returns {object} { protein, carbs, fat } in grams
 */
export function calculateMacros(targetCalories, goal = 'cut', weightKg = 70) {
  const ratios = MACRO_RATIOS[goal] || MACRO_RATIOS.cut;

  // Protein: at least 1.8g per kg for cut, 1.6g for others
  const minProteinPerKg = goal === 'cut' ? 2.0 : 1.6;
  const minProtein = Math.round(weightKg * minProteinPerKg);

  // Calculate from ratios
  let protein = Math.round((targetCalories * ratios.protein) / 4); // 4 cal per gram
  let carbs = Math.round((targetCalories * ratios.carbs) / 4);     // 4 cal per gram
  let fat = Math.round((targetCalories * ratios.fat) / 9);         // 9 cal per gram

  // Ensure minimum protein
  if (protein < minProtein) {
    const extraProteinCals = (minProtein - protein) * 4;
    protein = minProtein;
    // Reduce carbs to compensate
    carbs = Math.round(carbs - extraProteinCals / 4);
    if (carbs < 50) carbs = 50; // Minimum carbs
  }

  return { protein, carbs, fat };
}

/**
 * Distribute daily calories across meals
 * @param {number} targetCalories
 * @param {object} macros - { protein, carbs, fat }
 * @returns {object} Meal distribution with calorie and macro targets per meal
 */
export function distributeMeals(targetCalories, macros) {
  return {
    breakfast: {
      id: 'breakfast',
      name: 'ארוחת בוקר',
      icon: 'wb-sunny',
      calories: Math.round(targetCalories * 0.20),
      protein: Math.round(macros.protein * 0.20),
      carbs: Math.round(macros.carbs * 0.10),
      fat: Math.round(macros.fat * 0.15),
    },
    lunch: {
      id: 'lunch',
      name: 'ארוחת צהריים',
      icon: 'restaurant',
      calories: Math.round(targetCalories * 0.35),
      protein: Math.round(macros.protein * 0.35),
      carbs: Math.round(macros.carbs * 0.40),
      fat: Math.round(macros.fat * 0.30),
    },
    pre_workout: {
      id: 'pre_workout',
      name: 'לפני אימון',
      icon: 'flash-on',
      calories: Math.round(targetCalories * 0.08),
      protein: Math.round(macros.protein * 0.05),
      carbs: Math.round(macros.carbs * 0.15),
      fat: Math.round(macros.fat * 0.05),
    },
    dinner: {
      id: 'dinner',
      name: 'ארוחת ערב',
      icon: 'nightlight-round',
      calories: Math.round(targetCalories * 0.32),
      protein: Math.round(macros.protein * 0.35),
      carbs: Math.round(macros.carbs * 0.30),
      fat: Math.round(macros.fat * 0.35),
    },
    free_calories: {
      id: 'free_calories',
      name: 'קלוריות חופשיות',
      icon: 'star',
      calories: Math.round(targetCalories * 0.05),
      protein: 0,
      carbs: Math.round(macros.carbs * 0.05),
      fat: Math.round(macros.fat * 0.15),
    },
  };
}

/**
 * Full nutrition profile calculation from user data
 * @param {object} userProfile - { weight, height, age, gender, goal, activityLevel }
 * @returns {object} Complete nutrition plan with BMI, TDEE, macros, and meal distribution
 */
export function calculateNutritionPlan(userProfile) {
  const {
    weight = 70,
    height = 175,
    age = 25,
    gender = 'male',
    goal = 'cut',
    activityLevel = 'moderate',
  } = userProfile || {};

  const weightNum = Number(weight) || 70;
  const heightNum = Number(height) || 175;
  const ageNum = Number(age) || 25;

  const bmi = calculateBMI(weightNum, heightNum);
  const bmr = calculateBMR(weightNum, heightNum, ageNum, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const targetCalories = calculateTargetCalories(tdee, goal);
  const macros = calculateMacros(targetCalories, goal, weightNum);
  const meals = distributeMeals(targetCalories, macros);

  return {
    bmi,
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    macros,
    meals,
    summary: {
      caloriesLabel: `${targetCalories} קלוריות ליום`,
      proteinLabel: `${macros.protein} גרם חלבון`,
      carbsLabel: `${macros.carbs} גרם פחמימות`,
      fatLabel: `${macros.fat} גרם שומן`,
    },
  };
}
