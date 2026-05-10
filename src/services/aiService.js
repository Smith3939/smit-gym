const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = 'YOUR_CLAUDE_API_KEY'; // TODO: Move to env/backend

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
    if (userProfile.activityLevel) {
      const levels = { low: 'נמוכה (1-2 אימונים)', moderate: 'בינונית (3-4 אימונים)', high: 'גבוהה (5-6 אימונים)' };
      systemPrompt += `\n- רמת פעילות: ${levels[userProfile.activityLevel] || userProfile.activityLevel}`;
    }
  }

  const apiMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

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
        system: systemPrompt,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('AI Service Error:', error);
    return generateFallbackResponse(messages[messages.length - 1]?.content || '');
  }
}

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
