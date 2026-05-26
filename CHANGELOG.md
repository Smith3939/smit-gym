# 📝 Smit Gym - Changelog

כל השינויים החשובים בפרויקט מפורטים כאן.

## [1.4.0] - Modern Aurora Theme + Recipe Generator
**תאריך:** 2026-05-26

### 🎨 עיצוב חדש - Aurora Theme
ערכת צבעים מודרנית 2025 בהשראת Linear, Vercel, Framer.

**פלטה חדשה:**
- `Primary` ורוד אלקטרי `#FF4D8F` (במקום כתום)
- `Secondary` תכלת מינט `#22D3EE`
- `Tertiary` לבנדר `#A78BFA`
- `Accent` ליים `#A3E635`
- `Warning` ענבר `#FBBF24`
- `Success` מינט `#34D399`
- `Background` כחול-שחור `#0A0E1A`

**רכיבים חדשים:**
- `AuroraBackground` - 3 גרדיאנט blobs זורמים ברקע (ורוד/סגול/תכלת)
- `ModernButton` - כפתורים מודרניים עם 3 וריאנטים (primary/secondary/ghost)
- `GlassCard` - כרטיסים עם glassmorphism
- `ProgressRing` - טבעות התקדמות SVG עם גרדיאנט
- `AnimatedAthlete` - דמות מתאמן SVG אנימטיבית
- `ParticleBackground` - חלקיקים זוהרים מרחפים
- `SimpleChart` - גרפים בסיסיים
- `Toast` - הודעות בסגנון מודרני
- `LoadingSpinner` - אינדיקטור טעינה
- `FadeInView` - אנימציית כניסה רכה

### 🍽️ פיצ'ר חדש - מתכונים חכמים (Recipe Generator)
מסך חדש לחישוב מנות לפי תקציב קלוריות.

- 12 מתכונים ישראליים מובנים: קציצות, מעורב ירושלמי, שווארמה, שניצל, סלמון, סלט טונה, חומוס, שקשוקה, סלט ים תיכוני, קוואקר חלבונית, חביתת חלבונים, חזה עוף בגריל
- 6 קטגוריות: בשרים ועוף, דגים, צמחוני, סלטים, ארוחות בוקר, נשנושים
- חיפוש לפי מילת מפתח
- חישוב מדויק של מספר מנות לפי קלוריות
- פירוט מלא: מרכיבים, אופן הכנה, טיפים, מאקרו

### 🧭 ניווט מתוקן
- כפתורי **חזור** + **הבית** בכל המסכים הפנימיים
- WeightTracking שהיה תקוע - כעת ניתן ליציאה
- כל מסך מנווט גם ל-Main וגם goBack

---

## [1.3.0] - Bento Grid + Geometric Patterns
**תאריך:** 2026-05-26

- Bento grid layout במסכים פנימיים
- דפוסים גיאומטריים ברקע (Geometric Patterns)
- שיפור Workout Screen + Nutrition Screen

---

## [1.2.0] - Premium UI Redesign
**תאריך:** 2026-05-26

- גרדיאנטים פרימיום (orange→purple, cool, hero)
- אנימציות כניסה לכל המסכים
- מסך פתיחה (Splash Screen) עם 2 טבעות סובבות
- אנימציות לחיצה לכפתורים (scale + opacity)
- צללי זוהר (glow shadows)

---

## [1.1.0] - Dynamic Engines
**תאריך:** 2026-05-26

- **Nutrition Engine** - מחולל תפריט אוטומטי לפי פרטי משתמש
- **Workout Engine** - מחולל תוכנית אימונים A/B/Full Body
- **AI Workout Service** - החלפת תרגילים אינטליגנטית
- **AI Nutrition Service** - החלפת מזון אינטליגנטית
- **חישובי BMI/BMR/TDEE** בפרופיל

---

## [1.0.0] - Complete Feature Set
**תאריך:** 2026-05-26

### פיצ'רים שנוספו:

**🔐 Firebase Authentication:**
- מסך התחברות עם Email/Password
- מסך הרשמה
- שכחת סיסמה
- התחברות עם Google (Web)
- AuthContext לניהול משתמש
- שמירת משתמשים ב-Firestore

**🤖 AI Coach:**
- שירות aiService.js עם system prompt עברי
- Fallback responses (5 תשובות מוכנות לפי מילת מפתח)
- מוכן ל-Claude API (חסר מפתח בלבד)
- הקשר משתמש (פרופיל, משקל, מטרה)

**🏋️ Exercise Library:**
- ספריית תרגילים מלאה לפי קבוצת שריר
- חיפוש תרגיל
- מועדפים (כוכבית)
- 80+ תרגילים בעברית

**💧 Water Tracking:**
- מסך מעקב שתייה
- עיגול התקדמות עם מילוי
- כפתורי הוספה מהירים (כוס, בקבוק, בקבוק גדול)
- יומן שתייה עם שעות

**📊 Charts:**
- גרף משקל עם היסטוריה
- גרף צעדים
- SimpleChart component עם גרדיאנטים

**🔔 Notifications:**
- תזכורת שקילה יומית
- תזכורת שתייה
- תזכורת אימון
- מסך הגדרות עם toggles

**⚙️ Settings & Profile:**
- שמירת פרטים אישיים
- בחירת מטרה (חיטוב/עלייה/שמירה)
- רמת פעילות
- שפה, גופן, נושא
- התנתקות
- 6 מסכים פנימיים מלאים

---

## [0.1.0] - Initial Setup
**תאריך:** 2026-05-26

הקמת הפרויקט הראשונית:
- React Native + Expo
- 5 מסכים ראשיים (Home, Workout, Nutrition, AI Chat, Profile)
- Bottom Tab Navigator + Stack Navigator
- מאגר תרגילים (chest, back, shoulders, legs, arms, abs, cardio)
- מאגר תזונה עם ערכים תזונתיים + חלופות
- צ'אט AI מקומי
- עיצוב כהה עם RTL עברית
- Firebase config + Firestore + Auth ready

---

## 🔮 בקרוב:
- 🔵 חיבור Claude API אמיתי (מחכה למפתח)
- 🟢 Google Sign-In Web Client ID
- 📱 בנייה כאפליקציית מובייל (Expo Build)
- 🌟 התראות Push אמיתיות
- 📈 גרפים מתקדמים (Victory Native)
- 🎯 יעדים שבועיים אוטומטיים
- 👥 שיתוף עם חברים
- 🏆 הישגים (achievements)

---

## 🛠️ Tech Stack

- **Framework:** React Native + Expo SDK 54
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **Auth & DB:** Firebase (Auth + Firestore)
- **AI:** Claude API (ready, awaiting key)
- **UI:** Custom components + expo-linear-gradient + react-native-svg
- **Animations:** Animated API (React Native)
- **State:** React Context (AuthContext)
- **Language:** עברית RTL מלא

---

**Repo:** https://github.com/Smith3939/smit-gym
**Last updated:** 2026-05-26
