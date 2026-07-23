# Smit Gym — אפיון מערכת מלא (System Specification)

> מסמך זה מתאר את כל מערכת "Smit Gym" מקצה לקצה. ניתן להעתיק אותו ככללותו לכלי AI (למשל ChatGPT) כדי שילמד את המערכת ויוכל לעזור בפיתוח ובהמשך הבנייה.
> עודכן לאחרונה: יולי 2026.

---

## 1. סקירה כללית (Overview)

**Smit Gym** היא אפליקציית כושר ותזונה בעברית (RTL), עם מאמן AI ורשת חברתית, למתאמנים עצמאיים.

- **קהל יעד:** מתאמנים עצמאיים (לא מאמנים). ניהול מאמנים אולי בעתיד.
- **מודל עסקי:** גרסה חינמית ראשונה, מנוי חודשי בהמשך.
- **שפה/עיצוב:** עברית RTL מלאה, מצב כהה (dark), ערכת צבעים "Aurora" (ורוד/סגול/תכלת).
- **פלטפורמות:** נבנה ב-React Native + Expo — רץ ב-Web (הפריסה החיה), ומוכן לבנייה כאפליקציית iOS/Android נייטיב דרך EAS. כרגע חי כ-Web App עטוף (PWA/TWA) בכתובת `https://smithgym.vercel.app`.

---

## 2. Tech Stack

| רכיב | טכנולוגיה |
|------|-----------|
| Framework | React Native `0.81.5` + Expo `~54` |
| ניווט | React Navigation 7 (Bottom Tabs + Stack) |
| Auth + Database | Firebase (Authentication + Cloud Firestore) — פרויקט `smith-gymai` |
| AI | Claude API (Anthropic) עם מנגנון fallback מקומי |
| גרפיקה | react-native-svg, expo-linear-gradient, Animated API |
| מדיה/מיקום | expo-image-picker, expo-image-manipulator, expo-location |
| State | React Context (`AuthContext`) |
| פריסה (Web) | Vercel (build: `expo export --platform web`) |

---

## 3. ארכיטקטורה כללית (Architecture)

**זרימה בסיסית:**
1. `index.js` → מפעיל RTL (`I18nManager.forceRTL`) לפני כל render → טוען `App.js`.
2. `App.js` → עוטף ב-`GestureHandlerRootView > SafeAreaProvider > AuthProvider > ToastProvider > NavigationContainer > AppNavigator`. מוסיף גם `UpdateChecker` (בדיקת גרסה) ו-`AndroidDownloadPrompt`.
3. `AuthContext` → מאזין ל-`onAuthStateChanged` של Firebase. אם מחובר — טוען את הפרופיל מ-Firestore (`users/{uid}`).
4. `AppNavigator` → אם מחובר מציג את הטאבים הראשיים + מסכי Stack; אם לא — מסכי התחברות/הרשמה.

**עקרון מרכזי:** כל הלוגיקה העסקית (חישוב קלוריות, יצירת תוכניות אימון, החלפות) נמצאת ב-`services/` כפונקציות טהורות. ה-AI הוא **שכבת שיפור** מעל הלוגיקה המקומית — אם ה-AI לא זמין, המערכת נופלת חזרה למאגר המקומי וממשיכה לעבוד.

---

## 4. מבנה הפרויקט (Project Structure)

```
smit-gym/
├── App.js                      # שורש: providers, navigation, RTL, PWA
├── index.js                    # entry point, מפעיל RTL
├── app.json                    # קונפיג Expo (שם, אייקונים, bundle id)
├── eas.json                    # קונפיג בנייה לנייטיב (EAS Build)
├── vercel.json                 # קונפיג פריסה + cache headers
├── firestore.rules             # כללי אבטחה ל-Firestore
├── firebase.json
├── scripts/write-version.mjs   # post-build: version.json + הזרקת PWA tags
├── public/                     # מועתק לשורש ה-web build (manifest, אייקונים)
└── src/
    ├── config/     theme.js, firebase.js, apiKeys.js (gitignored)
    ├── context/    AuthContext.js
    ├── data/       exercises.js, nutrition.js, recipes.js  (מאגרי נתונים)
    ├── services/   לוגיקה + Firebase + AI (ראה סעיף 6)
    ├── components/ רכיבי UI לשימוש חוזר (ראה סעיף 9)
    └── screens/    17 מסכים (ראה סעיף 5)
```

---

## 5. מסכים (Screens)

**טאבים ראשיים (Bottom Tabs):**
- `HomeScreen` — דשבורד: ברכה, כרטיס hero עם דמות מתאמן מונפשת (סקוואט), סטטיסטיקות (קלוריות/מים/צעדים/משקל), כרטיסי גישה מהירה, כרטיס AI.
- `WorkoutScreen` — תוכנית אימונים (A/B/PPL/Full Body/Daily), כרטיסי תרגילים עם רישום סטים (חזרות+משקל), החלפת תרגיל, כפתורי "סיים ושמור" ו-"שתף לקהילה".
- `NutritionScreen` — תפריט יומי מחושב, ארוחות מתקפלות, החלפת מזון (swap), שיתוף תפריט לקהילה.
- `CommunityScreen` — רשת חברתית: פיד (פוסטים + לייקים) + לשונית "אנשים" (גילוי מתאמנים לפי חדר/עיר/מיקום, בקשות אימון משותף).
- `AIChatScreen` — צ'אט עם מאמן AI (תווית "חי"/"בסיסי" לפי חיבור המפתח).
- `ProfileScreen` — פרופיל: תמונה, שם, חדר כושר, עיר, ביו, גיל/גובה/משקל, מטרה, רמות פעילות. חישוב BMI/BMR/TDEE חי.

**מסכי Stack נוספים:**
- `PublicProfileScreen` — פרופיל ציבורי של מתאמן אחר (תמונות, פוסטים, כפתור בקשת אימון).
- `RecipeGeneratorScreen` — מחולל מתכונים: הזנת תקציב קלוריות → חישוב מנות + מרכיבים + אופן הכנה.
- `ExerciseLibraryScreen` — ספריית תרגילים לפי קבוצת שריר + חיפוש + מועדפים.
- `WaterTrackingScreen` / `WeightTrackingScreen` — מעקב מים ומשקל עם גרפים.
- `SettingsScreen`, `SharedProfileScreen` (צפייה בפרופיל משותף דרך קישור), `SplashScreen`.
- `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen`.

---

## 6. שירותים ולוגיקה (Services)

| קובץ | תפקיד |
|------|-------|
| `authService.js` | הרשמה/כניסה/יציאה, שמירת פרופיל, לוגים (אימון/משקל/מים) ב-Firestore |
| `googleAuthService.js` | התחברות Google (Web) |
| `nutritionEngine.js` | חישוב BMI/BMR/TDEE + יעד קלוריות + חלוקת מאקרו |
| `mealPlanGenerator.js` | יצירת תפריט יומי מהמאגר + חישוב גרמים לפי קלוריות |
| `mealPlanStorage.js` | שמירה/טעינה של תפריט |
| `workoutEngine.js` | יצירת תוכנית אימון לפי פרופיל + חלופות תרגילים |
| `workoutStorage.js` | שמירה/טעינה של תוכניות |
| `aiService.js` | צ'אט AI (system prompt עברי) |
| `aiNutritionService.js` | החלפת מזון חכמה (AI) |
| `aiWorkoutService.js` | החלפת/גיוון תרגילים (AI) |
| `claudeClient.js` | נקודת קריאה מרכזית ל-Claude: אימות מפתח, timeout, fallback |
| `socialService.js` | רשת חברתית: פרופילים ציבוריים, פוסטים, לייקים, בקשות אימון, תמונות (base64), מיקום |
| `profileShareService.js` | יצירת קישור שיתוף פרופיל למאמן/חבר |
| `notificationService.js` | תזכורות (שקילה/מים/אימון/ארוחות) |

---

## 7. מודל הנתונים (Firestore Data Model)

```
users/{uid}                     # פרטי משתמש פרטיים (שם, גיל, משקל, מטרה, יעדים...)
  └── (subcollections)          # workoutLogs, weightHistory, waterLog וכו'
publicProfiles/{uid}            # החלק הציבורי לקהילה (שם, תמונה, ביו, חדר, עיר, מיקום)
posts/{postId}                  # פוסטים בפיד (text/workout/meal, תמונה, payload)
  └── likes/{uid}               # דוק אחד לכל לייק
buddyRequests/{id}              # בקשות אימון משותף (fromUid, toUid, status, pairKey)
sharedProfiles/{shareId}        # snapshot פרופיל לשיתוף דרך קישור
```

**אבטחה (`firestore.rules`):** משתמש ניגש רק ל-`users/{uid}` שלו; `publicProfiles`/`posts` קריאים לכל מחובר וניתנים לכתיבה רק לבעלים; לייקים per-user; בקשות אימון גלויות רק לשני הצדדים.

**הערה חשובה:** תמונות נשמרות כ-base64 דחוס (<700KB) בתוך מסמכי Firestore — אין שימוש ב-Firebase Storage (לפשטות ל-beta).

---

## 8. מערכת ה-AI

- **מפתח:** נשמר כ-Firebase Secret בשם `ANTHROPIC_API_KEY` ונגיש רק לפונקציית Cloud Function המאומתת (`functions/index.js`). הוא לעולם לא נכנס ל-GitHub או ל-Web bundle.
- **מודל:** `claude-sonnet-4-20250514`, timeout 20 שניות.
- **3 שימושים:** צ'אט (`aiService`), החלפת מזון (`aiNutritionService`), החלפת/גיוון תרגילים (`aiWorkoutService`) — כולם עוברים דרך `claudeClient.js`.
- **Fallback:** אם אין מפתח תקין (`sk-ant-...`) או שהקריאה נכשלת — המערכת נופלת אוטומטית למאגר המקומי. הצ'אט מציג תווית **"בסיסי"** במקום **"חי"** כדי לא להטעות.
- **אבטחה:** הלקוח קורא ל-Firebase Callable Function בשם `claude`. Firebase מאמת אוטומטית את המשתמש לפני הקריאה; ה-Cloud Function פונה ל-Claude עם המפתח הסודי.

---

## 9. מערכת עיצוב (Design System)

**צבעים (`theme.js`, ערכת "Aurora"):**
- רקע: `#0A0E1A` (כחול-שחור עמוק)
- Primary ורוד: `#FF4D8F` · Secondary תכלת: `#22D3EE` · Tertiary סגול: `#A78BFA`
- Success מינט: `#34D399` · Accent ליים: `#A3E635` · Warning ענבר: `#FBBF24`

**רכיבים לשימוש חוזר (`components/`):**
`AuroraBackground` (blobs זורמים), `GlassCard` (glassmorphism), `ProgressRing` (טבעת SVG), `AnimatedAthlete` (דמות מתאמן שעושה סקוואט), `Avatar`, `ModernButton`, `Toast`, `LoadingSpinner`, `SimpleChart`, `FadeInView`/`AnimatedCard`, `UpdateChecker`, `AndroidDownloadPrompt`, `ParticleBackground`, `GeometricPattern`.

**אייקון:** ריבוע בגרדיאנט Aurora עם משקולת לבנה. מקורות ב-`assets/` (icon/adaptive/splash/favicon) ו-`public/` (icon-192/512, apple-touch, manifest).

---

## 10. פריסה ומנגנון עדכונים (Deployment & Updates)

- **פריסת Web:** Vercel בונה עם `npm run build` (= `expo export --platform web` + `scripts/write-version.mjs`) ומגיש את `dist/`. כתובת חיה: `https://smithgym.vercel.app`.
- **מנגנון עדכון אוטומטי:** כל בנייה כותבת `dist/version.json` (עם `builtAt`). הרכיב `UpdateChecker` בודק את הקובץ כל 4 דקות ובכל חזרה לאפליקציה; אם יצאה גרסה חדשה — מציג באנר **"גרסה חדשה זמינה - לחץ לעדכון"** שמרענן.
- **Cache headers (`vercel.json`):** ה-HTML ו-`version.json` תמיד no-store; קבצי `_expo/static` (עם hash בשם) נשמרים במטמון לשנה.
- **חשוב:** אפליקציה שהותקנה כ-TWA מ-Google Play שומרת את האייקון הישן עד לבניית APK חדש; התקנות PWA ("הוסף למסך הבית") מקבלות את האייקון החדש בטעינה הבאה.

---

## 11. סטטוס נוכחי ומה שנשאר (Status & TODO)

**עובד:** הרשמה/כניסה, פרופיל + חישובי TDEE, תפריט + החלפת מזון, תוכנית אימונים + החלפת תרגיל, מחולל מתכונים, מעקב מים/משקל, UI של הקהילה, אייקון ממותג, מנגנון עדכון.

**חוסמים / דרוש פעולת בעלים:**
1. **לפרוס `firestore.rules`** ב-Firebase Console (Firestore → Rules → Publish) — אחרת הקהילה והפרופיל הציבורי חסומים.
2. **לחבר Vercel ל-GitHub** (repo `Smith3939/smit-gym`, branch `master`) לפריסה אוטומטית — כרגע האתר לא מתעדכן אוטומטית.
3. **פריסת AI מאובטחת** — לפרוס את Cloud Function, להגדיר `ANTHROPIC_API_KEY` כ-Firebase Secret, ואז להגדיר ב-Vercel את `EXPO_PUBLIC_AI_BACKEND_ENABLED=true` כדי להפעיל את תגית ה-AI החי.
4. **לאפ סטור:** `eas build` + חשבון Apple Developer + Google Play + מדיניות פרטיות + הצהרת בריאות.

---

## 12. הרצה מקומית (Local Dev)

```bash
npm install
npm run web        # רץ ב-http://localhost:8081
npm run build      # בונה גרסת web ל-dist/
```

- Repo: `https://github.com/Smith3939/smit-gym`
- הגדרת AI: לאחר התחברות ל-Firebase CLI, להריץ `firebase functions:secrets:set ANTHROPIC_API_KEY`, ואז `firebase deploy --only functions`. אין להגדיר מפתח Claude בלקוח או ב-Vercel.
