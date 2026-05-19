/**
 * Recipe database - Israeli & Mediterranean dishes
 * Each recipe includes: ingredients per serving, prep instructions, calories per serving, macros
 */

export const RECIPE_CATEGORIES = [
  { id: 'protein', name: 'בשרים ועוף', icon: 'restaurant', color: '#FF6B35' },
  { id: 'fish', name: 'דגים', icon: 'set-meal', color: '#5BC0EB' },
  { id: 'vegan', name: 'צמחוני/טבעוני', icon: 'eco', color: '#4CD964' },
  { id: 'salads', name: 'סלטים', icon: 'local-florist', color: '#A06CD5' },
  { id: 'breakfast', name: 'ארוחות בוקר', icon: 'free-breakfast', color: '#FFB627' },
  { id: 'snacks', name: 'נשנושים', icon: 'cookie', color: '#FF6B35' },
];

export const RECIPES = [
  // ─── בשרים ועוף ───
  {
    id: 'meatballs',
    name: 'קציצות בקר ברוטב עגבניות',
    nameEn: 'Meatballs',
    category: 'protein',
    keywords: ['קציצות', 'בקר', 'בשר', 'meatballs'],
    portion: 'קציצה (50 גרם)',
    caloriesPerPortion: 95,
    proteinPerPortion: 11,
    carbsPerPortion: 3,
    fatPerPortion: 4,
    prepTime: 30,
    cookTime: 25,
    difficulty: 'קל',
    ingredients: [
      { name: 'בשר בקר טחון 5%', amount: '500', unit: 'גרם', cal: 750 },
      { name: 'בצל קצוץ', amount: '1', unit: 'יחידה', cal: 40 },
      { name: 'שום כתוש', amount: '3', unit: 'שיני', cal: 15 },
      { name: 'ביצה', amount: '1', unit: 'יחידה', cal: 75 },
      { name: 'פירורי לחם', amount: '3', unit: 'כפות', cal: 80 },
      { name: 'פטרוזיליה קצוצה', amount: '2', unit: 'כפות', cal: 5 },
      { name: 'רסק עגבניות', amount: '500', unit: 'גרם', cal: 100 },
      { name: 'שמן זית', amount: '2', unit: 'כפות', cal: 180 },
      { name: 'מלח, פלפל, כמון', amount: 'לפי הטעם', unit: '', cal: 0 },
    ],
    instructions: [
      'לערבב בקערה את הבשר הטחון, בצל קצוץ, שום, ביצה, פירורי לחם ופטרוזיליה',
      'להוסיף תבלינים ולערבב היטב',
      'ליצור קציצות בגודל אחיד (כ-50 גרם כל אחת) - יצאו בערך 20 קציצות',
      'לחמם שמן בסיר ולטגן את הקציצות עד להזהבה (3-4 דקות מכל צד)',
      'להוסיף רסק עגבניות + מעט מים ולבשל על אש נמוכה 20 דקות',
      'להגיש עם אורז או פירה',
    ],
    tips: [
      'אפשר לאפות בתנור 200 מעלות 25 דקות במקום לטגן (חוסך 100 קל)',
      'בשר 5% במקום 15% - חוסך 200 קל למנה',
    ],
    totalServings: 20,
  },
  {
    id: 'jerusalem_mixed',
    name: 'מעורב ירושלמי',
    nameEn: 'Jerusalem Mixed Grill',
    category: 'protein',
    keywords: ['מעורב', 'ירושלמי', 'mixed grill'],
    portion: 'מנה (200 גרם)',
    caloriesPerPortion: 420,
    proteinPerPortion: 38,
    carbsPerPortion: 8,
    fatPerPortion: 26,
    prepTime: 15,
    cookTime: 25,
    difficulty: 'קל',
    ingredients: [
      { name: 'חזה עוף', amount: '150', unit: 'גרם', cal: 250 },
      { name: 'לבבות עוף', amount: '100', unit: 'גרם', cal: 150 },
      { name: 'כבד עוף', amount: '100', unit: 'גרם', cal: 120 },
      { name: 'בצל', amount: '1', unit: 'גדול', cal: 40 },
      { name: 'שמן זית', amount: '1', unit: 'כף', cal: 90 },
      { name: 'תבלינים: כמון, פפריקה, הל, כורכום', amount: 'לפי הטעם', unit: '', cal: 0 },
      { name: 'מלח ופלפל', amount: 'לפי הטעם', unit: '', cal: 0 },
    ],
    instructions: [
      'לחתוך את החזה, לבבות והכבד לחתיכות קטנות',
      'לחתוך את הבצל לפרוסות דקות',
      'לחמם שמן במחבת ולטגן את הבצל עד להזהבה',
      'להוסיף את הבשרים בסדר: חזה → לבבות → כבד',
      'לטגן 8-10 דקות תוך ערבוב',
      'להוסיף תבלינים ולערבב',
      'להגיש בפיתה עם חומוס וטחינה',
    ],
    tips: [
      'הכבד מתבשל מהר - להוסיף אחרון',
      'במקום פיתה - פיתה כוסמין חוסך 100 קל',
    ],
    totalServings: 2,
  },
  {
    id: 'shawarma',
    name: 'שווארמה ביתית בתנור',
    nameEn: 'Homemade Shawarma',
    category: 'protein',
    keywords: ['שווארמה', 'שוארמה', 'shawarma'],
    portion: 'מנה (200 גרם)',
    caloriesPerPortion: 380,
    proteinPerPortion: 42,
    carbsPerPortion: 5,
    fatPerPortion: 20,
    prepTime: 20,
    cookTime: 30,
    difficulty: 'בינוני',
    ingredients: [
      { name: 'חזה עוף', amount: '800', unit: 'גרם', cal: 1320 },
      { name: 'שמן זית', amount: '3', unit: 'כפות', cal: 270 },
      { name: 'לימון סחוט', amount: '1/4', unit: 'כוס', cal: 10 },
      { name: 'שום כתוש', amount: '4', unit: 'שיני', cal: 20 },
      { name: 'פפריקה מתוקה', amount: '1', unit: 'כף', cal: 6 },
      { name: 'כמון', amount: '1', unit: 'כפית', cal: 8 },
      { name: 'כורכום', amount: '1/2', unit: 'כפית', cal: 4 },
      { name: 'הל טחון', amount: '1/4', unit: 'כפית', cal: 2 },
      { name: 'מלח, פלפל', amount: 'לפי הטעם', unit: '', cal: 0 },
    ],
    instructions: [
      'לחתוך את החזה לפסים דקים (חצי ס"מ)',
      'לערבב בקערה: שמן, לימון, שום, תבלינים ומלח',
      'להשרות את הבשר בתערובת 30 דקות לפחות (אפשר לילה)',
      'לסדר על תבנית עם נייר אפייה',
      'לאפות בתנור 200 מעלות 20-25 דקות',
      'להפוך באמצע ולהמשיך עד להזהבה',
      'להגיש בפיתה / סלט / טורטיה עם טחינה וירקות',
    ],
    tips: [
      'הסוד הוא במרינדה ארוכה - יותר טעים יותר זמן',
      'אפשר להחליף ל-200 גרם פרגית - יותר עסיסי',
    ],
    totalServings: 4,
  },
  {
    id: 'chicken_breast_grilled',
    name: 'חזה עוף בגריל',
    nameEn: 'Grilled Chicken Breast',
    category: 'protein',
    keywords: ['חזה עוף', 'גריל', 'עוף'],
    portion: 'מנה (150 גרם)',
    caloriesPerPortion: 248,
    proteinPerPortion: 47,
    carbsPerPortion: 0,
    fatPerPortion: 5,
    prepTime: 10,
    cookTime: 15,
    difficulty: 'קל',
    ingredients: [
      { name: 'חזה עוף', amount: '600', unit: 'גרם', cal: 990 },
      { name: 'שמן זית', amount: '1', unit: 'כף', cal: 90 },
      { name: 'לימון סחוט', amount: '2', unit: 'כפות', cal: 4 },
      { name: 'שום כתוש', amount: '2', unit: 'שיני', cal: 10 },
      { name: 'מלח, פלפל, פפריקה', amount: 'לפי הטעם', unit: '', cal: 0 },
    ],
    instructions: [
      'לחתוך את החזה לפילטים בעובי 1.5 ס"מ',
      'לערבב שמן + לימון + שום + תבלינים',
      'להשרות את החזה 15 דקות',
      'לחמם מחבת/גריל היטב',
      'לצלות 5-6 דקות מכל צד',
      'לתת לבשר לנוח 5 דקות לפני חיתוך',
    ],
    tips: [
      'בשר רך יותר עם שיטת marinade בליל סוף-שבוע',
      'ספריי שמן במקום שמן - חוסך 80 קל למנה',
    ],
    totalServings: 4,
  },
  {
    id: 'schnitzel_baked',
    name: 'שניצל עוף בתנור',
    nameEn: 'Baked Chicken Schnitzel',
    category: 'protein',
    keywords: ['שניצל', 'schnitzel'],
    portion: 'שניצל (120 גרם)',
    caloriesPerPortion: 245,
    proteinPerPortion: 32,
    carbsPerPortion: 18,
    fatPerPortion: 5,
    prepTime: 15,
    cookTime: 20,
    difficulty: 'קל',
    ingredients: [
      { name: 'חזה עוף בפרוסות', amount: '500', unit: 'גרם', cal: 825 },
      { name: 'ביצה', amount: '2', unit: 'יחידות', cal: 150 },
      { name: 'פירורי לחם', amount: '1', unit: 'כוס', cal: 220 },
      { name: 'קמח מלא', amount: '1/2', unit: 'כוס', cal: 200 },
      { name: 'מלח, פלפל, פפריקה, שום', amount: 'לפי הטעם', unit: '', cal: 0 },
    ],
    instructions: [
      'לרדד את פרוסות החזה לעובי 1 ס"מ',
      'להכין 3 צלחות: קמח | ביצה טרופה | פירורי לחם + תבלינים',
      'לטבול כל פרוסה: קמח → ביצה → פירורים (לחיצה טובה)',
      'לסדר על תבנית עם נייר אפייה',
      'לרסס מעט שמן זית מעל',
      'לאפות 200 מעלות 20 דקות (להפוך באמצע)',
    ],
    tips: [
      'אפייה במקום טיגון - חוסך 200 קל למנה',
      'פירורי קוואקר במקום פירורי לחם - יותר חלבון',
    ],
    totalServings: 4,
  },

  // ─── דגים ───
  {
    id: 'salmon_baked',
    name: 'סלמון אפוי עם ירקות',
    nameEn: 'Baked Salmon',
    category: 'fish',
    keywords: ['סלמון', 'דג', 'salmon'],
    portion: 'מנה (150 גרם)',
    caloriesPerPortion: 280,
    proteinPerPortion: 31,
    carbsPerPortion: 4,
    fatPerPortion: 16,
    prepTime: 10,
    cookTime: 20,
    difficulty: 'קל',
    ingredients: [
      { name: 'פילה סלמון', amount: '600', unit: 'גרם', cal: 1080 },
      { name: 'לימון', amount: '1', unit: 'יחידה', cal: 20 },
      { name: 'שמן זית', amount: '2', unit: 'כפות', cal: 180 },
      { name: 'שום', amount: '3', unit: 'שיני', cal: 15 },
      { name: 'שמיר טרי', amount: '1', unit: 'חופן', cal: 5 },
      { name: 'ירקות שורש (גזר, בטטה)', amount: '500', unit: 'גרם', cal: 250 },
    ],
    instructions: [
      'לחתוך את ירקות השורש לקוביות',
      'לסדר על תבנית עם שמן זית, מלח ופלפל',
      'לאפות 200 מעלות 15 דקות',
      'להוסיף את הסלמון, לתבל ולכסות בפרוסות לימון ושום',
      'להמשיך לאפות 12-15 דקות נוספות',
      'לקשט בשמיר טרי',
    ],
    tips: [
      'אומגה 3 מצוין לבריאות',
      'אפשר להחליף לאמנון - חוסך 130 קל למנה',
    ],
    totalServings: 4,
  },
  {
    id: 'tuna_salad',
    name: 'סלט טונה חלבוני',
    nameEn: 'Tuna Salad',
    category: 'fish',
    keywords: ['טונה', 'סלט', 'tuna'],
    portion: 'מנה (250 גרם)',
    caloriesPerPortion: 320,
    proteinPerPortion: 32,
    carbsPerPortion: 12,
    fatPerPortion: 18,
    prepTime: 10,
    cookTime: 0,
    difficulty: 'קל',
    ingredients: [
      { name: 'טונה במים', amount: '160', unit: 'גרם (קופסה)', cal: 200 },
      { name: 'ביצה קשה', amount: '1', unit: 'יחידה', cal: 75 },
      { name: 'אבוקדו', amount: '1/4', unit: 'יחידה', cal: 80 },
      { name: 'עגבניות שרי', amount: '5', unit: 'יחידות', cal: 25 },
      { name: 'מלפפון', amount: '1/2', unit: 'יחידה', cal: 8 },
      { name: 'בצל סגול', amount: '1/4', unit: 'יחידה', cal: 10 },
      { name: 'חסה', amount: '2', unit: 'חופנים', cal: 10 },
      { name: 'שמן זית + לימון', amount: '1', unit: 'כף', cal: 90 },
    ],
    instructions: [
      'לסחוט את הטונה היטב מהמים',
      'לקצוץ את החסה, בצל ומלפפון',
      'לחתוך את הביצה והאבוקדו לפרוסות',
      'לסדר בקערה: חסה → ירקות → טונה → ביצה ואבוקדו',
      'לתבל בשמן זית, לימון, מלח ופלפל',
    ],
    tips: [
      'ארוחה מושלמת אחרי אימון - מהיר וחלבון גבוה',
      'אפשר להוסיף 50 גרם גבינה צהובה 9% (+115 קל)',
    ],
    totalServings: 1,
  },

  // ─── צמחוני ───
  {
    id: 'hummus_homemade',
    name: 'חומוס ביתי',
    nameEn: 'Homemade Hummus',
    category: 'vegan',
    keywords: ['חומוס', 'hummus'],
    portion: 'מנה (100 גרם)',
    caloriesPerPortion: 180,
    proteinPerPortion: 8,
    carbsPerPortion: 18,
    fatPerPortion: 9,
    prepTime: 15,
    cookTime: 0,
    difficulty: 'קל',
    ingredients: [
      { name: 'גרגירי חומוס מבושלים', amount: '400', unit: 'גרם', cal: 600 },
      { name: 'טחינה גולמית', amount: '4', unit: 'כפות', cal: 360 },
      { name: 'לימון סחוט', amount: '3', unit: 'כפות', cal: 6 },
      { name: 'שום', amount: '2', unit: 'שיני', cal: 10 },
      { name: 'מים קרים', amount: '1/4', unit: 'כוס', cal: 0 },
      { name: 'שמן זית לקישוט', amount: '1', unit: 'כף', cal: 90 },
      { name: 'כמון', amount: '1/2', unit: 'כפית', cal: 4 },
      { name: 'מלח', amount: 'לפי הטעם', unit: '', cal: 0 },
    ],
    instructions: [
      'לטחון במעבד מזון את החומוס, טחינה, לימון ושום',
      'להוסיף מים קרים בהדרגה תוך טחינה לקבלת מרקם חלק',
      'לתבל בכמון, מלח ופלפל',
      'להעביר לצלחת ולקשט בשמן זית, פפריקה ופטרוזיליה',
      'להגיש עם פיתה / ירקות חתוכים',
    ],
    tips: [
      'מקור חלבון צמחי מצוין',
      'אפשר להחליף את הטחינה ב-2 כפות לחיסכון של 90 קל',
    ],
    totalServings: 5,
  },
  {
    id: 'shakshuka',
    name: 'שקשוקה',
    nameEn: 'Shakshuka',
    category: 'vegan',
    keywords: ['שקשוקה', 'shakshuka'],
    portion: 'מנה (1 ביצה + רוטב)',
    caloriesPerPortion: 220,
    proteinPerPortion: 10,
    carbsPerPortion: 14,
    fatPerPortion: 14,
    prepTime: 10,
    cookTime: 20,
    difficulty: 'קל',
    ingredients: [
      { name: 'עגבניות מרוסקות', amount: '500', unit: 'גרם', cal: 100 },
      { name: 'בצל', amount: '1', unit: 'בינוני', cal: 40 },
      { name: 'פלפל אדום', amount: '1', unit: 'יחידה', cal: 30 },
      { name: 'שום', amount: '3', unit: 'שיני', cal: 15 },
      { name: 'ביצים', amount: '4', unit: 'יחידות', cal: 300 },
      { name: 'שמן זית', amount: '2', unit: 'כפות', cal: 180 },
      { name: 'פפריקה, כמון, מלח', amount: 'לפי הטעם', unit: '', cal: 0 },
    ],
    instructions: [
      'לקצוץ בצל ושום, לחתוך פלפל לקוביות',
      'לחמם שמן במחבת ולטגן את הבצל עד להזהבה',
      'להוסיף שום ופלפל ולטגן 3 דקות',
      'להוסיף את העגבניות המרוסקות והתבלינים',
      'לבשל 10 דקות עד שהרוטב מתעבה',
      'לפצח את הביצים בתוך הרוטב, לכסות ולבשל 5-7 דקות',
      'להגיש עם פיתה / לחם מלא',
    ],
    tips: [
      'אפשר להוסיף גבינה בולגרית 5% לעוד טעם וחלבון',
      'ארוחת בוקר חלבונית מצוינת',
    ],
    totalServings: 4,
  },

  // ─── סלטים ───
  {
    id: 'mediterranean_salad',
    name: 'סלט ים תיכוני',
    nameEn: 'Mediterranean Salad',
    category: 'salads',
    keywords: ['סלט', 'ים תיכוני', 'salad'],
    portion: 'מנה (300 גרם)',
    caloriesPerPortion: 180,
    proteinPerPortion: 6,
    carbsPerPortion: 14,
    fatPerPortion: 12,
    prepTime: 10,
    cookTime: 0,
    difficulty: 'קל',
    ingredients: [
      { name: 'עגבניות', amount: '2', unit: 'יחידות', cal: 40 },
      { name: 'מלפפונים', amount: '2', unit: 'יחידות', cal: 30 },
      { name: 'פלפל', amount: '1', unit: 'יחידה', cal: 30 },
      { name: 'בצל סגול', amount: '1/2', unit: 'יחידה', cal: 20 },
      { name: 'גבינה בולגרית 5%', amount: '50', unit: 'גרם', cal: 75 },
      { name: 'זיתי קלמטה', amount: '8', unit: 'יחידות', cal: 50 },
      { name: 'פטרוזיליה', amount: '1/2', unit: 'חופן', cal: 5 },
      { name: 'שמן זית + לימון', amount: '1', unit: 'כף', cal: 90 },
    ],
    instructions: [
      'לחתוך את כל הירקות לקוביות קטנות',
      'לערבב בקערה גדולה',
      'להוסיף גבינה ופירות זיתים',
      'לתבל בשמן זית, לימון, מלח ופלפל',
      'לערבב היטב ולהגיש',
    ],
    tips: [
      'מצוין כתוספת לכל ארוחה',
      'בלי הגבינה - 105 קל',
    ],
    totalServings: 2,
  },

  // ─── ארוחות בוקר ───
  {
    id: 'oatmeal_protein',
    name: 'דייסת קוואקר חלבונית',
    nameEn: 'Protein Oatmeal',
    category: 'breakfast',
    keywords: ['קוואקר', 'דייסה', 'oatmeal'],
    portion: 'קערה (300 גרם)',
    caloriesPerPortion: 380,
    proteinPerPortion: 28,
    carbsPerPortion: 48,
    fatPerPortion: 8,
    prepTime: 5,
    cookTime: 5,
    difficulty: 'קל',
    ingredients: [
      { name: 'קוואקר', amount: '50', unit: 'גרם', cal: 175 },
      { name: 'חלב 1% / משקה שיבולת שועל', amount: '250', unit: 'מ"ל', cal: 100 },
      { name: 'אבקת חלבון (וניל)', amount: '1', unit: 'מנה (30ג)', cal: 120 },
      { name: 'בננה', amount: '1/2', unit: 'יחידה', cal: 45 },
      { name: 'אגוזים מעורבים', amount: '10', unit: 'גרם', cal: 60 },
      { name: 'דבש / סירופ מייפל', amount: '1', unit: 'כפית', cal: 20 },
      { name: 'קינמון', amount: '1/2', unit: 'כפית', cal: 3 },
    ],
    instructions: [
      'לבשל קוואקר עם חלב על אש בינונית 4-5 דקות',
      'להוריד מהאש ולהוסיף אבקת חלבון תוך ערבוב',
      'להעביר לקערה',
      'לקשט בבננה פרוסה, אגוזים, דבש וקינמון',
    ],
    tips: [
      'אבקת חלבון הופכת לארוחת בוקר חלבונית מצוינת',
      'אפשר להחליף בננה בפירות יער (-15 קל)',
    ],
    totalServings: 1,
  },
  {
    id: 'egg_white_omelette',
    name: 'חביתת חלבונים עם ירקות',
    nameEn: 'Egg White Omelette',
    category: 'breakfast',
    keywords: ['חביתה', 'חלבונים', 'omelette'],
    portion: 'חביתה',
    caloriesPerPortion: 180,
    proteinPerPortion: 22,
    carbsPerPortion: 6,
    fatPerPortion: 8,
    prepTime: 5,
    cookTime: 8,
    difficulty: 'קל',
    ingredients: [
      { name: 'חלבוני ביצים', amount: '4', unit: 'יחידות', cal: 70 },
      { name: 'ביצה שלמה', amount: '1', unit: 'יחידה', cal: 75 },
      { name: 'פטריות', amount: '50', unit: 'גרם', cal: 12 },
      { name: 'תרד', amount: '30', unit: 'גרם', cal: 10 },
      { name: 'גבינה צהובה 9%', amount: '15', unit: 'גרם', cal: 35 },
      { name: 'ספריי שמן', amount: '', unit: '', cal: 5 },
      { name: 'מלח, פלפל', amount: 'לפי הטעם', unit: '', cal: 0 },
    ],
    instructions: [
      'לחמם מחבת עם ספריי שמן',
      'לטגן את הפטריות והתרד 3-4 דקות',
      'לטרוף את הביצים ולהוסיף למחבת',
      'לפזר גבינה מעל החלק האחד',
      'לכופל את החביתה ולהמשיך לטגן עד שהיא מבושלת',
    ],
    tips: [
      'ארוחת בוקר חלבונית עם פחות מ-200 קלוריות',
      'אפשר להוסיף עגבניות שרי לטעם',
    ],
    totalServings: 1,
  },
];

/**
 * Find recipes by keyword (search)
 */
export function searchRecipes(query) {
  if (!query) return RECIPES;
  const q = query.toLowerCase().trim();
  return RECIPES.filter((r) =>
    r.name.toLowerCase().includes(q) ||
    r.nameEn.toLowerCase().includes(q) ||
    r.keywords.some((k) => k.toLowerCase().includes(q))
  );
}

/**
 * Get recipes by category
 */
export function getRecipesByCategory(categoryId) {
  return RECIPES.filter((r) => r.category === categoryId);
}

/**
 * Calculate how many portions fit the user's calorie budget
 */
export function calculatePortions(recipe, calorieBudget) {
  if (!recipe || !calorieBudget) return { portions: 0, calories: 0, fitsWithinBudget: false };

  const exactPortions = calorieBudget / recipe.caloriesPerPortion;
  const roundedPortions = Math.floor(exactPortions);
  const actualCalories = roundedPortions * recipe.caloriesPerPortion;
  const remainingBudget = calorieBudget - actualCalories;

  return {
    portions: roundedPortions,
    exactPortions: exactPortions.toFixed(1),
    calories: actualCalories,
    remainingBudget,
    fitsWithinBudget: roundedPortions > 0,
    totalProtein: roundedPortions * recipe.proteinPerPortion,
    totalCarbs: roundedPortions * recipe.carbsPerPortion,
    totalFat: roundedPortions * recipe.fatPerPortion,
  };
}
