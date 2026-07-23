# הפעלת Smit Gym ב-Vercel

Firebase נשאר אחראי על התחברות המשתמשים ועל מסד הנתונים. Vercel מגיש את האתר ומריץ את נתיב ה-AI המאובטח. לכן אין צורך ב-Firebase Blaze או בכרטיס אשראי עבור Firebase כדי להפעיל את ה-AI.

## משתני הסביבה ב-Vercel

בפרויקט Vercel, היכנס ל-**Settings → Environment Variables** והוסף את המשתנים הבאים גם ל-Production וגם ל-Preview:

| שם | ערך |
| --- | --- |
| `ANTHROPIC_API_KEY` | מפתח Anthropic שלך. יש להדביק אותו רק כאן, ולא בקוד או בצ'אט. |
| `AI_ALLOWED_EMAILS` | כתובות האימייל שמורשות להשתמש ב-AI, מופרדות בפסיק. לדוגמה: `you@example.com,spouse@example.com` |
| `EXPO_PUBLIC_AI_BACKEND_ENABLED` | `true` |
| `AI_REQUESTS_PER_HOUR` | `20` (אפשר לשנות לפי הצורך) |
| `ANTHROPIC_MODEL` | אופציונלי. ברירת המחדל היא `claude-sonnet-4-6`. |

לאפליקציית Web אין צורך להגדיר כתובת API: היא משתמשת אוטומטית ב-`/api/claude`. עבור אפליקציית Android/iOS בעתיד, יש להוסיף גם:

```text
EXPO_PUBLIC_AI_API_URL=https://YOUR-VERCEL-DOMAIN/api/claude
```

## מה מאובטח כאן

- המפתח של Anthropic נמצא רק ב-Vercel, ואינו נשלח לדפדפן או ל-GitHub.
- כל בקשת AI חייבת להגיע ממשתמש מחובר ב-Firebase.
- השרת מאמת את Firebase ID token ומאפשר AI רק לכתובות שב-`AI_ALLOWED_EMAILS`.
- קיימת מגבלת בקשות בסיסית לכל כתובת אימייל כדי לצמצם שימוש לא צפוי.

## פריסה

אחרי שמגדירים את המשתנים, פריסה חדשה ב-Vercel מפעילה את ה-AI. אפשר לחבר את מאגר GitHub כדי שכל דחיפה ל-`master` תיפרס אוטומטית.

הדומיין הישן `smithgym.vercel.app` אינו נמצא בחשבון Vercel המחובר כרגע. יש לחבר את הפרויקט הנכון או להעביר את הדומיין אליו לפני שמחליפים את האתר החי.
