/**
 * Dynamic Meal Plan Generator
 * Generates personalized meal plans from the food database based on
 * calorie/macro targets calculated by the nutrition engine.
 */

import { FOOD_CATEGORIES, CARB_ALTERNATIVES, PROTEIN_ALTERNATIVES } from '../data/nutrition';

/**
 * Get food item by ID from any category
 * @param {string} foodId
 * @returns {object|null} Food item with category info
 */
export function getFoodById(foodId) {
  for (const [categoryKey, category] of Object.entries(FOOD_CATEGORIES)) {
    const item = category.items.find((f) => f.id === foodId);
    if (item) {
      return { ...item, category: categoryKey };
    }
  }
  return null;
}

/**
 * Calculate grams needed to reach target calories for a food item
 * @param {object} food - Food item from database
 * @param {number} targetCalories - Target calories for this food
 * @returns {number} Grams needed
 */
export function calculateGrams(food, targetCalories) {
  if (!food || !food.calories || food.calories <= 0) return 0;
  if (food.per100g) {
    return Math.round((targetCalories / food.calories) * 100);
  }
  // For items not per 100g (single serving), return number of servings
  return Math.round(targetCalories / food.calories * 10) / 10;
}

/**
 * Calculate macros for a specific amount of food
 * @param {object} food - Food item
 * @param {number} grams - Amount in grams (or servings if not per100g)
 * @returns {object} { calories, protein, carbs, fat }
 */
export function calculateFoodMacros(food, grams) {
  if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const multiplier = food.per100g ? grams / 100 : grams;
  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
  };
}

/**
 * Default meal templates - defines which food categories go into each meal
 */
const MEAL_TEMPLATES = {
  breakfast: {
    slots: [
      { category: 'protein', calorieShare: 0.70, label: 'חלבון' },
      { category: 'vegetables', calorieShare: 0.10, label: 'ירקות', optional: true },
      { category: 'fat', calorieShare: 0.20, label: 'שומן', optional: true },
    ],
    defaultProteinOptions: ['cottage_3', 'yogurt_3', 'eggs', 'protein_bar', 'protein_shake'],
  },
  lunch: {
    slots: [
      { category: 'protein', calorieShare: 0.45, label: 'חלבון' },
      { category: 'carbs', calorieShare: 0.40, label: 'פחמימה' },
      { category: 'vegetables', calorieShare: 0.05, label: 'ירקות', optional: true },
      { category: 'fat', calorieShare: 0.10, label: 'שומן', optional: true },
    ],
    defaultProteinOptions: ['chicken_breast', 'beef_sirloin', 'chicken_thigh', 'tuna', 'steak'],
    defaultCarbOptions: ['rice', 'pasta', 'potato', 'sweet_potato', 'bulgur', 'quinoa'],
  },
  pre_workout: {
    slots: [
      { category: 'carbs', calorieShare: 1.0, label: 'פחמימה מהירה' },
    ],
    defaultCarbOptions: ['banana', 'apple', 'dates', 'bread_white'],
  },
  dinner: {
    slots: [
      { category: 'protein', calorieShare: 0.45, label: 'חלבון' },
      { category: 'carbs', calorieShare: 0.40, label: 'פחמימה' },
      { category: 'vegetables', calorieShare: 0.05, label: 'ירקות', optional: true },
      { category: 'fat', calorieShare: 0.10, label: 'שומן', optional: true },
    ],
    defaultProteinOptions: ['chicken_breast', 'beef_sirloin', 'chicken_thigh', 'tuna', 'steak'],
    defaultCarbOptions: ['rice', 'pasta', 'potato', 'sweet_potato', 'bulgur', 'quinoa'],
  },
  free_calories: {
    slots: [
      { category: 'any', calorieShare: 1.0, label: 'חופשי' },
    ],
  },
};

/**
 * Generate food options for a meal slot
 * @param {string} category - Food category key
 * @param {number} targetCalories - Target calories for this slot
 * @param {string[]} preferredIds - Preferred food IDs to prioritize
 * @returns {object[]} Array of food options with calculated amounts
 */
export function generateSlotOptions(category, targetCalories, preferredIds = []) {
  const categoryData = FOOD_CATEGORIES[category];
  if (!categoryData) return [];

  let items = categoryData.items;

  // If preferred IDs provided, filter to those
  if (preferredIds.length > 0) {
    items = items.filter((item) => preferredIds.includes(item.id));
    // If none match, fall back to all items
    if (items.length === 0) items = categoryData.items;
  }

  return items.map((food) => {
    const grams = calculateGrams(food, targetCalories);
    const macros = calculateFoodMacros(food, grams);
    return {
      foodId: food.id,
      name: food.name,
      amount: grams,
      unit: food.per100g ? 'גרם' : 'יחידות',
      per100g: food.per100g,
      ...macros,
    };
  }).filter((opt) => opt.amount > 0);
}

/**
 * Generate a complete meal plan for a single meal
 * @param {string} mealId - Meal identifier (breakfast, lunch, etc.)
 * @param {object} mealTargets - { calories, protein, carbs, fat } targets
 * @returns {object} Generated meal with food options per slot
 */
export function generateMeal(mealId, mealTargets) {
  const template = MEAL_TEMPLATES[mealId];
  if (!template) {
    return {
      id: mealId,
      slots: [],
      totalCalories: mealTargets.calories,
    };
  }

  const slots = template.slots.map((slot) => {
    const slotCalories = Math.round(mealTargets.calories * slot.calorieShare);

    let preferredIds = [];
    if (slot.category === 'protein' && template.defaultProteinOptions) {
      preferredIds = template.defaultProteinOptions;
    } else if (slot.category === 'carbs' && template.defaultCarbOptions) {
      preferredIds = template.defaultCarbOptions;
    }

    const options = generateSlotOptions(slot.category, slotCalories, preferredIds);

    return {
      label: slot.label,
      category: slot.category,
      targetCalories: slotCalories,
      optional: slot.optional || false,
      options,
      // Default selection: first option
      selectedIndex: 0,
    };
  });

  return {
    id: mealId,
    name: mealTargets.name || mealId,
    icon: mealTargets.icon || 'restaurant',
    targetCalories: mealTargets.calories,
    targetProtein: mealTargets.protein,
    targetCarbs: mealTargets.carbs,
    targetFat: mealTargets.fat,
    slots,
  };
}

/**
 * Generate a full daily meal plan
 * @param {object} mealsDistribution - Output from nutritionEngine.distributeMeals()
 * @returns {object} Complete daily meal plan with all meals and options
 */
export function generateDailyPlan(mealsDistribution) {
  const plan = {};

  for (const [mealId, mealTargets] of Object.entries(mealsDistribution)) {
    plan[mealId] = generateMeal(mealId, mealTargets);
  }

  return plan;
}

/**
 * Get alternatives for a specific food item
 * @param {string} foodId - Current food ID
 * @param {string} category - Food category
 * @param {number} targetCalories - Calorie target to maintain
 * @returns {object[]} Alternative food options with calculated amounts
 */
export function getAlternatives(foodId, category, targetCalories) {
  // Check predefined alternatives first
  let alternativeIds = [];

  if (category === 'carbs' && CARB_ALTERNATIVES[foodId]) {
    alternativeIds = CARB_ALTERNATIVES[foodId];
  } else if (category === 'protein' && PROTEIN_ALTERNATIVES[foodId]) {
    alternativeIds = PROTEIN_ALTERNATIVES[foodId];
  }

  // If no predefined alternatives, use all items from same category except current
  if (alternativeIds.length === 0) {
    const categoryData = FOOD_CATEGORIES[category];
    if (categoryData) {
      alternativeIds = categoryData.items
        .filter((item) => item.id !== foodId)
        .map((item) => item.id);
    }
  }

  return generateSlotOptions(category, targetCalories, alternativeIds);
}

/**
 * Swap a food item in the meal plan and recalculate amounts
 * @param {object} currentMealPlan - Current daily plan
 * @param {string} mealId - Which meal to modify
 * @param {number} slotIndex - Which slot in the meal
 * @param {number} newOptionIndex - Index of the new option to select
 * @returns {object} Updated meal plan
 */
export function swapFood(currentMealPlan, mealId, slotIndex, newOptionIndex) {
  const updatedPlan = { ...currentMealPlan };
  const meal = { ...updatedPlan[mealId] };
  const slots = [...meal.slots];
  const slot = { ...slots[slotIndex] };

  slot.selectedIndex = newOptionIndex;
  slots[slotIndex] = slot;
  meal.slots = slots;
  updatedPlan[mealId] = meal;

  return updatedPlan;
}
