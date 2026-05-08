export const MEAL_TYPES = [
  { id: 'breakfast', name: 'ארוחת בוקר', icon: 'wb-sunny', defaultCalories: 300 },
  { id: 'lunch', name: 'ארוחת צהריים', icon: 'restaurant', defaultCalories: 750 },
  { id: 'pre_workout', name: 'לפני אימון', icon: 'flash-on', defaultCalories: 50 },
  { id: 'dinner', name: 'ארוחת ערב', icon: 'nightlight-round', defaultCalories: 750 },
  { id: 'free_calories', name: 'קלוריות חופשיות', icon: 'star', defaultCalories: 100 },
];

export const FOOD_CATEGORIES = {
  protein: {
    name: 'חלבון',
    items: [
      { id: 'chicken_breast', name: 'חזה עוף בספריי שמן', calories: 165, protein: 31, carbs: 0, fat: 3.6, per100g: true },
      { id: 'beef_sirloin', name: 'בשר שייטל', calories: 200, protein: 26, carbs: 0, fat: 10, per100g: true },
      { id: 'chicken_thigh', name: 'פרגית בספריי שמן', calories: 177, protein: 24, carbs: 0, fat: 8, per100g: true },
      { id: 'tuna', name: 'דג מסוג טונה / אמנון', calories: 130, protein: 28, carbs: 0, fat: 1, per100g: true },
      { id: 'eggs', name: 'ביצים', calories: 155, protein: 13, carbs: 1.1, fat: 11, per100g: true },
      { id: 'cottage_3', name: 'גביע קוטג׳ 3%', calories: 85, protein: 12, carbs: 3, fat: 3, per100g: true },
      { id: 'yogurt_3', name: 'גביע גבינה 3%', calories: 60, protein: 10, carbs: 4, fat: 0.5, per100g: true },
      { id: 'protein_bar', name: 'מעדן חלבון פרו', calories: 140, protein: 20, carbs: 10, fat: 3, per100g: false },
      { id: 'protein_shake', name: 'משקה חלבון פרו', calories: 140, protein: 25, carbs: 5, fat: 2, per100g: false },
      { id: 'tuna_pressed', name: 'טונה בשמן סחוטה', calories: 116, protein: 25, carbs: 0, fat: 1, per100g: true },
      { id: 'steak', name: 'סטייק אנטריקוט', calories: 271, protein: 26, carbs: 0, fat: 18, per100g: true },
    ],
  },
  carbs: {
    name: 'פחמימה',
    items: [
      { id: 'pasta', name: 'פסטה', calories: 131, protein: 5, carbs: 25, fat: 1.1, per100g: true },
      { id: 'rice', name: 'אורז', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, per100g: true },
      { id: 'potato', name: 'תפוח אדמה', calories: 77, protein: 2, carbs: 17, fat: 0.1, per100g: true },
      { id: 'sweet_potato', name: 'בטטה', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, per100g: true },
      { id: 'bulgur', name: 'בורגול', calories: 83, protein: 3, carbs: 18, fat: 0.2, per100g: true },
      { id: 'couscous', name: 'קוסקוס', calories: 112, protein: 3.8, carbs: 23, fat: 0.2, per100g: true },
      { id: 'quinoa', name: 'קינואה', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, per100g: true },
      { id: 'oats', name: 'שיבולת שועל', calories: 71, protein: 2.5, carbs: 12, fat: 1.5, per100g: true },
      { id: 'bread_white', name: 'פרוסת לחם לבן', calories: 79, protein: 3, carbs: 15, fat: 1, per100g: false },
      { id: 'bread_whole', name: 'לחם כוסמין', calories: 69, protein: 3, carbs: 12, fat: 1, per100g: false },
      { id: 'pita', name: 'פיתה / פרוסות כוסמין', calories: 80, protein: 3, carbs: 16, fat: 0.5, per100g: false },
      { id: 'banana', name: 'בננה', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, per100g: true },
      { id: 'apple', name: 'תפוח גדול', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, per100g: true },
      { id: 'dates', name: 'תמרים', calories: 282, protein: 2.5, carbs: 75, fat: 0.4, per100g: true },
    ],
  },
  fat: {
    name: 'שומן',
    items: [
      { id: 'olive_oil', name: 'שמן זית', calories: 884, protein: 0, carbs: 0, fat: 100, per100g: true },
      { id: 'avocado', name: 'אבוקדו', calories: 160, protein: 2, carbs: 9, fat: 15, per100g: true },
      { id: 'almonds', name: 'שקדים', calories: 576, protein: 21, carbs: 22, fat: 49, per100g: true },
      { id: 'peanut_butter', name: 'חמאת בוטנים', calories: 588, protein: 25, carbs: 20, fat: 50, per100g: true },
      { id: 'cheese_9', name: 'גבינה צהובה 9%', calories: 230, protein: 25, carbs: 1, fat: 14, per100g: true },
      { id: 'cheese_5', name: 'גבינה 5%', calories: 100, protein: 17, carbs: 4, fat: 2.5, per100g: true },
    ],
  },
  vegetables: {
    name: 'ירקות',
    items: [
      { id: 'cucumber', name: 'מלפפון', calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, per100g: true },
      { id: 'tomato', name: 'עגבניה', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, per100g: true },
      { id: 'lettuce', name: 'חסה', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, per100g: true },
      { id: 'pepper', name: 'פלפל', calories: 31, protein: 1, carbs: 6, fat: 0.3, per100g: true },
      { id: 'broccoli', name: 'ברוקולי', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, per100g: true },
    ],
  },
  treats: {
    name: 'חריגות',
    items: [
      { id: 'pizza', name: 'פיצה (4 משולשים בינוניים / 3 רגילים)', calories: 900, protein: 36, carbs: 100, fat: 36, per100g: false },
      { id: 'hamburger', name: 'המבורגר 220 ג', calories: 550, protein: 30, carbs: 40, fat: 28, per100g: false },
      { id: 'schnitzel', name: 'שניצל', calories: 300, protein: 20, carbs: 15, fat: 18, per100g: true },
      { id: 'shawarma', name: 'שוארמה', calories: 500, protein: 25, carbs: 40, fat: 28, per100g: false },
      { id: 'beer', name: 'בירה (בקבוק)', calories: 150, protein: 1.6, carbs: 13, fat: 0, per100g: false },
    ],
  },
};

export const CARB_ALTERNATIVES = {
  pasta: ['rice', 'potato', 'sweet_potato', 'bulgur', 'couscous', 'quinoa'],
  rice: ['pasta', 'potato', 'sweet_potato', 'bulgur', 'couscous', 'quinoa'],
  potato: ['rice', 'pasta', 'sweet_potato', 'bulgur', 'couscous', 'quinoa'],
  sweet_potato: ['rice', 'pasta', 'potato', 'bulgur', 'couscous', 'quinoa'],
  bulgur: ['rice', 'pasta', 'potato', 'sweet_potato', 'couscous', 'quinoa'],
  couscous: ['rice', 'pasta', 'potato', 'sweet_potato', 'bulgur', 'quinoa'],
  quinoa: ['rice', 'pasta', 'potato', 'sweet_potato', 'bulgur', 'couscous'],
};

export const PROTEIN_ALTERNATIVES = {
  chicken_breast: ['beef_sirloin', 'chicken_thigh', 'tuna', 'steak'],
  beef_sirloin: ['chicken_breast', 'chicken_thigh', 'tuna', 'steak'],
  chicken_thigh: ['chicken_breast', 'beef_sirloin', 'tuna', 'steak'],
  tuna: ['chicken_breast', 'beef_sirloin', 'chicken_thigh', 'steak'],
  steak: ['chicken_breast', 'beef_sirloin', 'chicken_thigh', 'tuna'],
};
