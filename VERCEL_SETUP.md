# הפעלת Smit Gym ב-Vercel

Firebase נשאר אחראי על התחברות המשתמשים ועל מסד הנתונים. Vercel מגיש את האתר ומריץ את נתיב ה-AI המאובטח. לכן אין צורך ב-Firebase Blaze או בכרטיס אשראי עבור Firebase כדי להפעיל את ה-AI.

המאמן החכם (צ'אט, החלפת מזון, החלפת תרגיל) פונה ל-OpenAI. כתובת השרת נשארת `/api/claude`, כדי שהאפליקציה שכבר מותקנת תמשיך לעבוד בלי עדכון.

## משתני הסביבה ב-Vercel

בפרויקט Vercel: **Settings → Environment Variables**. לכל משתנה סמן את **Production**. אם בודקים גם כתובת Preview, סמן גם Preview.

| שם | חובה? | פורמט |
| --- | --- | --- |
| `OPENAI_API_KEY` | כן | מפתח OpenAI אחד, בדרך כלל מתחיל ב-`sk-`. להדביק רק כאן, לא בקוד ולא בצ'אט. |
| `OPENAI_MODEL` | לא | מזהה מודל, למשל `gpt-5-mini`. אם השדה ריק, השרת משתמש ב-`gpt-5-mini`. |
| `AI_ALLOWED_EMAILS` | כן | כתובות אימייל מופרדות בפסיק, בלי רווחים מיותרים. לדוגמה: `you@example.com,spouse@example.com` |
| `EXPO_PUBLIC_AI_BACKEND_ENABLED` | כן | בדיוק `true` |
| `AI_REQUESTS_PER_HOUR` | לא | מספר שלם, למשל `20` |

אחרי השמירה חובה **לפרוס מחדש** (Redeploy). בלי פריסה חדשה האתר נשאר עם ההגדרות הקודמות: המפתח החדש לא נכנס לתוקף, ותווית "חי" לא תופיע.

`ANTHROPIC_API_KEY` ו-`ANTHROPIC_MODEL` כבר לא נקראים. אפשר למחוק אותם אחרי שהפריסה החדשה עובדת.

### מודל ברירת המחדל

`gpt-5-mini` הוא מודל נוכחי וזול של OpenAI: בערך $0.25 למיליון טוקנים נכנסים ו-$2 למיליון טוקנים יוצאים. הוא מתאים לצ'אט קצר בעברית ולתשובות JSON של החלפות מזון ותרגילים. השרת מבקש ממנו חשיבה מינימלית (`reasoning_effort=minimal`), כדי שהתשובה הגלויה תיכנס במגבלת האורך שכבר קיימת באפליקציה.

כדי להחליף מודל בלי לגעת בקוד: להגדיר `OPENAI_MODEL` (למשל `gpt-4.1-mini`) ולפרוס מחדש.

לאפליקציית Web אין צורך להגדיר כתובת API: היא משתמשת אוטומטית ב-`/api/claude`. עבור אפליקציית Android/iOS בעתיד, יש להוסיף גם:

```text
EXPO_PUBLIC_AI_API_URL=https://YOUR-VERCEL-DOMAIN/api/claude
```

## מה מאובטח כאן

- המפתח של OpenAI נמצא רק ב-Vercel, ואינו נשלח לדפדפן או ל-GitHub.
- כל בקשת AI חייבת להגיע ממשתמש מחובר ב-Firebase.
- השרת מאמת את Firebase ID token ומאפשר AI רק לכתובות שב-`AI_ALLOWED_EMAILS`.
- קיימת מגבלת בקשות בסיסית לכל כתובת אימייל כדי לצמצם שימוש לא צפוי.
- אם `OPENAI_API_KEY` חסר, השרת עונה 503 והאפליקציה יורדת לתשובות המקומיות.

## פריסה

אחרי שמגדירים את המשתנים, פריסה חדשה ב-Vercel מפעילה את ה-AI. אפשר לחבר את מאגר GitHub כדי שכל דחיפה ל-`master` תיפרס אוטומטית.

הדומיין הישן `smithgym.vercel.app` אינו נמצא בחשבון Vercel המחובר כרגע. יש לחבר את הפרויקט הנכון או להעביר את הדומיין אליו לפני שמחליפים את האתר החי.

## Phone verification and contact discovery

The community's People tab includes phone verification and an opt-in discovery switch. Phone verification links the phone provider to the signed-in account. Users must sign back in if Firebase requires recent authentication. Web contact selection uses the browser Contact Picker where available, with manual number entry elsewhere. Native builds use Expo Contacts after permission, and open the website to verify the phone on the same account.

Before enabling this feature:

1. Enable Phone in Firebase Authentication for `smith-gymai`, add the production domain to authorized domains, and configure the permitted SMS regions and billing as required by Firebase. Use Firebase fictional test numbers for initial validation.
2. Configure `FIREBASE_SERVICE_ACCOUNT_JSON` as a sensitive server-only Vercel environment variable. Use a dedicated service account for this project with Firebase Authentication read access and Cloud Datastore User access. Keep the JSON out of client variables, source files, and chat.
3. Configure `CONTACT_DISCOVERY_SECRET` as a random secret of at least 32 characters in the same server environments. This keys the HMAC phone directory. Keep it stable. Rotating it requires rebuilding the directory from renewed user consent.
4. Publish `firestore.rules` and `storage.rules`, then deploy the API and client together. The three `phoneDiscovery*` collections are server-only. Contact request bodies must remain excluded from application logging and telemetry.
5. With two disposable test accounts, verify that the account UID and existing data survive SMS linking. Check opt-in, opt-out, matching, number changes, blocked users, a denied contact permission, an unsupported browser, and SMS failures. Upload, edit, share, and delete a short video before releasing the accompanying social changes.

The server stores keyed phone identifiers and consent per user. It does not store the submitted contact list. It checks current Firebase phone ownership and blocks, caps each match request at 250 input numbers, and uses an atomic per-user quota of 1,000 normalized numbers per UTC day. The API returns 503 until its server configuration exists. Discovery defaults to disabled and can be revoked without a linked phone.
