import { callClaude } from './claudeClient';

const SYSTEM_PROMPT = `אתה מאמן כושר ותזונה מקצועי בשם "מאמן Smit". אתה מדבר בעברית.

הנחיות:
- תמיד ענה בעברית
- תן תשובות מקצועיות אבל ידידותיות
- השתמש באימוג'ים כדי להפוך את התשובות לקריאות
- כשמציע חלופות מזון, תן ערכים תזונתיים (קלוריות, חלבון, פחמימה, שומן) ל-100 גרם
- כשמציע תרגילים חלופיים, הסבר את היתרונות של כל אחד
- התאם המלצות לפי פרטי המשתמש (משקל, גובה, מטרה) כשהם זמינים
- אל תיתן ייעוץ רפואי, הפנה לרופא כשצריך

מומחיויות:
- תוכניות אימון (חיטוב, עלייה במסה שריר, חיזוק)
- תזונת ספורט (חלבון, פחמימות, שומנים, תזמון ארוחות)
- חלופות מזון (החלפת פחמימות, חלבונים, ירקות)
- טכניקת תרגילים
- שיקום פציעות בסיסי
- מוטיבציה ודריכה נפשית

מאגר פחמימות חלופיות:
- אורז (130 קל), פסטה (131 קל), תפוח אדמה (77 קל), בטטה (86 קל), בורגול (83 קל), קוסקוס (112 קל), קינואה (120 קל)

מאגר חלבונים:
- חזה עוף (165 קל), בשר שייטל (200 קל), פרגית (177 קל), טונה (130 קל), ביצים (155 קל), קוטג' 3% (85 קל)`;

export async function sendMessageToAI(messages, userProfile = null) {
  let systemPrompt = SYSTEM_PROMPT;

  if (userProfile) {
    systemPrompt += `\n\nפרטי המתאמן:`;
    if (userProfile.name) systemPrompt += `\n- שם: ${userProfile.name}`;
    if (userProfile.weight) systemPrompt += `\n- משקל: ${userProfile.weight} ק"ג`;
    if (userProfile.height) systemPrompt += `\n- גובה: ${userProfile.height} ס"מ`;
    if (userProfile.age) systemPrompt += `\n- גיל: ${userProfile.age}`;
    if (userProfile.goal) {
      const goals = { cut: 'חיטוב', bulk: 'עלייה במסה', maintain: 'שמירה על משקל' };
      systemPrompt += `\n- מטרה: ${goals[userProfile.goal] || userProfile.goal}`;
    }
    if (userProfile.trainingLevel || userProfile.activityLevel) {
      const levels = {
        none: 'ללא אימונים',
        low: 'נמוכה (1-2 אימונים)',
        moderate: 'בינונית (3-4 אימונים)',
        high: 'גבוהה (5-6 אימונים)',
        extreme: 'גבוהה מאוד (כל יום)',
      };
      const trainingLevel = userProfile.trainingLevel || userProfile.activityLevel;
      systemPrompt += `\n- תדירות אימונים: ${levels[trainingLevel] || trainingLevel}`;
    }
    if (userProfile.dailyActivityLevel) {
      const dailyLevels = {
        sedentary: 'יושב רוב היום',
        light: 'פעילות יומית קלה',
        active: 'פעיל ביום יום',
        very_active: 'פעיל מאוד / עבודה פיזית',
      };
      systemPrompt += `\n- פעילות ביום יום: ${dailyLevels[userProfile.dailyActivityLevel] || userProfile.dailyActivityLevel}`;
    }
  }

  const apiMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

  try {
    return await callClaude({ system: systemPrompt, messages: apiMessages, maxTokens: 1024 });
  } catch (error) {
    if (error.code !== 'NO_API_KEY') {
      console.error('AI Service Error:', error);
    }
    return generateFallbackResponse(messages[messages.length - 1]?.content || '');
  }
}

/**
 * Is the real AI connected? Used by the UI to show/hide the "live" badge
 * so we never misrepresent the fallback as live AI.
 */
export { hasValidClaudeKey as isAIConnected } from './claudeClient';

function generateFallbackResponse(question) {
  const q = question.toLowerCase();

  if (q.includes('אורז') || q.includes('פחמימ') || q.includes('החלפ')) {
    return 'הנה אלטרנטיבות לפחמימה:\n\n🍚 במקום אורז אפשר:\n• בורגול - 83 קלוריות ל-100 גרם\n• קוסקוס - 112 קלוריות ל-100 גרם\n• קינואה - 120 קלוריות ל-100 גרם\n• בטטה - 86 קלוריות ל-100 גרם\n• תפוח אדמה - 77 קלוריות ל-100 גרם\n\nכל אלה מקורות פחמימה מצוינים!';
  }

  if (q.includes('חלבון') || q.includes('כמה')) {
    return 'המלצה כללית:\n\n💪 לבניית שריר: 1.6-2.2 גרם לכל ק"ג משקל גוף\n🏃 לחיטוב: 2.0-2.4 גרם לכל ק"ג\n\nחשוב לחלק את החלבון לאורך כל הארוחות!';
  }

  if (q.includes('תרגיל') || q.includes('חלופי') || q.includes('באנצ')) {
    return 'תרגילים חלופיים לבאנצ פרס:\n\n🔄 אפשרויות:\n• לחיצת חזה במכונה\n• שכיבות סמיכה עם משקולות\n• לחיצת חזה עליון בסמית\n• פרפר בכבלים\n\nלכל אחד יתרונות שונים!';
  }

  return 'שאלה מעולה! 🤔 אני כאן כדי לעזור. תוכל לשאול על תזונה, תרגילים, תוכניות אימון, או כל שאלה אחרת על כושר!';
}
