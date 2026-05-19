/**
 * AI Nutrition Service
 * Handles AI-powered food substitution and meal plan adjustments.
 * Returns structured JSON responses that can be directly applied to the meal plan.
 */

import { FOOD_CATEGORIES } from '../data/nutrition';
import { calculateGrams, calculateFoodMacros, getFoodById } from './mealPlanGenerator';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = 'YOUR_CLAUDE_API_KEY'; // TODO: Move to backend/env

/**
 * System prompt specifically for nutrition AI actions (structured output)
 */
const NUTRITION_SYSTEM_PROMPT = `אתה מאמן תזונה מקצועי בשם "מאמן Smit". 
אתה מחזיר תשובות בפורמט JSON בלבד.

כשמבקשים ממך להחליף מזון, אתה מחזיר JSON עם:
- alternatives: מערך של חלופות מזון
- reasoning: הסבר קצר בעברית למה ההחלפה מתאימה

כשמבקשים ממך לייעץ על תפריט, אתה מחזיר JSON עם:
- suggestion: ההצעה
- macros: ערכים תזונתיים
- reasoning: הסבר

חשוב: תמיד תתאים את ההמלצות למטרה של המתאמן (חיטוב/מסה/שמירה).
חשוב: תשמור על אותו סך קלוריות כשמחליפים מזון.`;

/**
 * Available foods formatted for AI context
 */
function getAvailableFoodsContext() {
  let context = 'מאגר מזונות זמין:\n';
  for (const [categoryKey, category] of Object.entries(FOOD_CATEGORIES)) {
    context += `\n${category.name}:\n`;
    category.items.forEach((item) => {
      context += `- ${item.id}: ${item.name} (${item.calories} קל${item.per100g ? '/100ג' : '/מנה'}, ח:${item.protein}ג, פ:${item.carbs}ג, ש:${item.fat}ג)\n`;
    });
  }
  return context;
}

/**
 * Request AI to suggest food alternatives
 * @param {object} currentFood - Current food item { id, name, category, amount }
 * @param {number} targetCalories - Calorie target to maintain
 * @param {object} userProfile - User profile for personalization
 * @param {string} userRequest - Optional specific request from user
 * @returns {object} { alternatives: [...], reasoning: string }
 */
export async function requestFoodSwap(currentFood, targetCalories, userProfile, userRequest = '') {
  const foodsContext = getAvailableFoodsContext();

  const prompt = `
${foodsContext}

המתאמן רוצה להחליף את: ${currentFood.name} (${currentFood.category})
כמות נוכחית: ${currentFood.amount} ${currentFood.per100g ? 'גרם' : 'יחידות'}
קלוריות נוכחיות: ${targetCalories} קלוריות

פרטי המתאמן:
- משקל: ${userProfile?.weight || 70} ק"ג
- מטרה: ${userProfile?.goal === 'cut' ? 'חיטוב' : userProfile?.goal === 'bulk' ? 'עלייה במסה' : 'שמירה'}

${userRequest ? `בקשה ספציפית: ${userRequest}` : ''}

החזר JSON בפורמט הבא בלבד (ללא markdown, ללא backticks):
{
  "alternatives": [
    {
      "foodId": "מזהה_מזון_מהמאגר",
      "name": "שם המזון",
      "amount": מספר_גרמים_או_יחידות,
      "unit": "גרם או יחידות",
      "calories": מספר_קלוריות,
      "protein": גרם_חלבון,
      "carbs": גרם_פחמימות,
      "fat": גרם_שומן,
      "reason": "סיבה קצרה להמלצה"
    }
  ],
  "reasoning": "הסבר כללי קצר בעברית"
}

הנחיות:
1. הצע 3-4 חלופות מאותה קטגוריה (${currentFood.category})
2. שמור על אותו סך קלוריות (${targetCalories} קל)
3. חשב כמות מדויקת בגרמים
4. התאם למטרת המתאמן`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: NUTRITION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    // Validate and enrich alternatives with data from our database
    if (result.alternatives) {
      result.alternatives = result.alternatives.map((alt) => {
        const dbFood = getFoodById(alt.foodId);
        if (dbFood) {
          // Recalculate with our database values for accuracy
          const grams = calculateGrams(dbFood, targetCalories);
          const macros = calculateFoodMacros(dbFood, grams);
          return {
            ...alt,
            foodId: dbFood.id,
            name: dbFood.name,
            amount: grams,
            unit: dbFood.per100g ? 'גרם' : 'יחידות',
            ...macros,
            reason: alt.reason || '',
          };
        }
        return alt;
      });
    }

    return result;
  } catch (error) {
    console.error('AI Nutrition Service Error:', error);
    // Fallback: generate alternatives from database without AI
    return generateFallbackAlternatives(currentFood, targetCalories);
  }
}

/**
 * Request AI to generate a custom meal suggestion
 * @param {string} mealType - breakfast/lunch/dinner/pre_workout
 * @param {object} targets - { calories, protein, carbs, fat }
 * @param {object} userProfile
 * @param {string} preferences - User preferences or restrictions
 * @returns {object} Meal suggestion
 */
export async function requestMealSuggestion(mealType, targets, userProfile, preferences = '') {
  const foodsContext = getAvailableFoodsContext();
  const mealNames = {
    breakfast: 'ארוחת בוקר',
    lunch: 'ארוחת צהריים',
    dinner: 'ארוחת ערב',
    pre_workout: 'לפני אימון',
  };

  const prompt = `
${foodsContext}

בנה ${mealNames[mealType] || 'ארוחה'} עבור המתאמן:
- יעד קלוריות: ${targets.calories}
- יעד חלבון: ${targets.protein} גרם
- יעד פחמימות: ${targets.carbs} גרם
- יעד שומן: ${targets.fat} גרם

פרטי המתאמן:
- משקל: ${userProfile?.weight || 70} ק"ג
- מטרה: ${userProfile?.goal === 'cut' ? 'חיטוב' : userProfile?.goal === 'bulk' ? 'עלייה במסה' : 'שמירה'}

${preferences ? `העדפות: ${preferences}` : ''}

החזר JSON בפורמט הבא בלבד (ללא markdown):
{
  "foods": [
    {
      "foodId": "מזהה_מזון",
      "name": "שם",
      "amount": מספר,
      "unit": "גרם/יחידות",
      "calories": מספר,
      "protein": מספר,
      "carbs": מספר,
      "fat": מספר
    }
  ],
  "totalCalories": מספר,
  "totalProtein": מספר,
  "totalCarbs": מספר,
  "totalFat": מספר,
  "tip": "טיפ קצר בעברית"
}

השתמש רק במזונות מהמאגר. חשב כמויות מדויקות.`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: NUTRITION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text;
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('AI Meal Suggestion Error:', error);
    return null;
  }
}

/**
 * Fallback alternative generation when AI is unavailable
 * Uses the local database and predefined alternatives
 */
function generateFallbackAlternatives(currentFood, targetCalories) {
  const category = currentFood.category;
  const categoryData = FOOD_CATEGORIES[category];

  if (!categoryData) {
    return {
      alternatives: [],
      reasoning: 'לא נמצאו חלופות מתאימות',
    };
  }

  const alternatives = categoryData.items
    .filter((item) => item.id !== currentFood.id)
    .slice(0, 4)
    .map((food) => {
      const grams = calculateGrams(food, targetCalories);
      const macros = calculateFoodMacros(food, grams);
      return {
        foodId: food.id,
        name: food.name,
        amount: grams,
        unit: food.per100g ? 'גרם' : 'יחידות',
        ...macros,
        reason: `חלופה מקטגוריית ${categoryData.name}`,
      };
    });

  return {
    alternatives,
    reasoning: `הנה חלופות מקטגוריית ${categoryData.name} עם אותו סך קלוריות (${targetCalories} קל)`,
  };
}
