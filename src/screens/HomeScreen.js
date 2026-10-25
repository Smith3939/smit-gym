import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS, DOMAIN, FONTS, SPACING, BORDER_RADIUS,
} from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { isAIConnected, subscribeAiConnection } from '../services/aiService';
import AuroraBackground from '../components/AuroraBackground';
import ActivityRings, { RingLegend } from '../components/ActivityRings';
import StatTile, { SectionTitle } from '../components/StatTile';
import Avatar from '../components/Avatar';
import { RTL_ICONS } from '../utils/rtl';


const QUOTES = [
  'הצלחה היא סכום של מאמצים קטנים שחוזרים על עצמם',
  'המאמן הכי טוב שלך — זה אתה',
  'כל אימון הוא ניצחון',
  'התקדמות, לא שלמות',
];

/** Colour-coded quick-access tile (Nike-style grid). */
function QuickTile({ title, subtitle, icon, color, soft, onPress, width: w }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      activeOpacity={0.88}
      style={[styles.quickTile, { width: w }]}
    >
      <View style={[styles.quickIcon, { backgroundColor: soft }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle} numberOfLines={1}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 760);
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useAuth();

  const displayName = userProfile?.name || user?.displayName || 'מתאמן';
  const firstName = displayName.split(' ')[0];
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [aiLive, setAiLive] = useState(() => isAIConnected());

  useEffect(() => subscribeAiConnection(setAiLive), []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 18 ? 'צהריים טובים' : 'ערב טוב';

  // ── Metrics ───────────────────────────────────────────────────────────────
  const weight = parseFloat(userProfile?.weight) || 0;
  const targetCal = userProfile?.dailyCalories || 2000;
  const consumedCal = 0;
  const workoutsThisWeek = 3;
  const workoutGoal = 5;
  const stepsToday = 0;
  const stepGoal = userProfile?.stepGoal || 10000;
  const waterToday = 0;
  const waterGoal = (userProfile?.waterGoal || 3.5) * 1000;

  const rings = [
    {
      key: 'workout',
      progress: workoutsThisWeek / workoutGoal,
      colors: DOMAIN.workout.ring,
      label: 'אימונים השבוע',
      value: `${workoutsThisWeek} / ${workoutGoal}`,
    },
    {
      key: 'nutrition',
      progress: consumedCal / targetCal,
      colors: DOMAIN.nutrition.ring,
      label: 'קלוריות היום',
      value: `${consumedCal} / ${targetCal}`,
    },
    {
      key: 'water',
      progress: waterToday / waterGoal,
      colors: DOMAIN.water.ring,
      label: 'מים',
      value: `${(waterToday / 1000).toFixed(1)} / ${(waterGoal / 1000).toFixed(1)} ל׳`,
    },
  ];

  const quickColumns = contentWidth < 360 ? 2 : 3;
  const quickTileWidth = (contentWidth - SPACING.md * 2 - SPACING.sm * (quickColumns - 1)) / quickColumns;

  const quickActions = [
    {
      title: 'אימון',
      subtitle: 'התוכנית שלי',
      icon: 'fitness-center',
      screen: 'WorkoutTab',
      ...DOMAIN.workout,
    },
    {
      title: 'תזונה',
      subtitle: 'תפריט יומי',
      icon: 'restaurant',
      screen: 'NutritionTab',
      ...DOMAIN.nutrition,
    },
    {
      title: 'מים',
      subtitle: 'מעקב שתייה',
      icon: 'water-drop',
      screen: 'WaterTracking',
      ...DOMAIN.water,
    },
    {
      title: 'מתכונים',
      subtitle: 'לפי קלוריות',
      icon: 'menu-book',
      screen: 'RecipeGenerator',
      ...DOMAIN.energy,
    },
    {
      title: 'תרגילים',
      subtitle: 'ספרייה',
      icon: 'list-alt',
      screen: 'ExerciseLibrary',
      ...DOMAIN.workout,
    },
    {
      title: 'משקל',
      subtitle: 'מעקב',
      icon: 'monitor-weight',
      screen: 'WeightTracking',
      ...DOMAIN.community,
    },
  ];

  return (
    <View style={styles.root}>
      <AuroraBackground intensity={0.5} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header: greeting + avatar ─────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="הפרופיל שלי"
            activeOpacity={0.85}
          >
            <Avatar photo={userProfile?.photo} size={48} borderColor={COLORS.border} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.workoutAction}
          onPress={() => navigation.navigate('WorkoutTab')}
          accessibilityRole="button"
          accessibilityLabel="אימון, התוכנית שלי"
          activeOpacity={0.85}
        >
          <MaterialIcons name="fitness-center" size={24} color={COLORS.textOnColor} />
          <View style={styles.workoutActionText}>
            <Text style={styles.workoutActionTitle}>אימון</Text>
            <Text style={styles.workoutActionSubtitle}>התוכנית שלי</Text>
          </View>
          <MaterialIcons name={RTL_ICONS.forward} size={22} color={COLORS.textOnColor} />
        </TouchableOpacity>

        {/* ── Hero: activity rings ──────────────────────────────────────── */}
        <View>
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <ActivityRings rings={rings} size={contentWidth < 360 ? 124 : 148} strokeWidth={12} gap={5}>
                <Text style={styles.ringCenterValue}>
                  {Math.round((workoutsThisWeek / workoutGoal) * 100)}%
                </Text>
                <Text style={styles.ringCenterLabel}>מהיעד</Text>
              </ActivityRings>

              <View style={styles.heroLegend}>
                <Text style={styles.heroTitle}>הפעילות שלי</Text>
                <RingLegend rings={rings} />
              </View>
            </View>

            <Text style={styles.quote}>{quote}</Text>
          </View>
        </View>

        {/* ── Today's numbers ───────────────────────────────────────────── */}
        <SectionTitle>היום</SectionTitle>
        <View style={styles.tileRow}>
          <StatTile
            icon="local-fire-department"
            value={consumedCal}
            unit={`/ ${targetCal}`}
            label="קלוריות"
            color={DOMAIN.workout.color}
            soft={DOMAIN.workout.soft}
            progress={consumedCal / targetCal}
            onPress={() => navigation.navigate('NutritionTab')}
          />
          <StatTile
            icon="water-drop"
            value={(waterToday / 1000).toFixed(1)}
            unit="ל׳"
            label="מים"
            color={DOMAIN.water.color}
            soft={DOMAIN.water.soft}
            progress={waterToday / waterGoal}
            onPress={() => navigation.navigate('WaterTracking')}
          />
        </View>
        <View style={styles.tileRow}>
          <StatTile
            icon="directions-walk"
            value={stepsToday.toLocaleString()}
            unit="צעדים"
            label={`יעד ${stepGoal.toLocaleString()}`}
            color={DOMAIN.energy.color}
            soft={DOMAIN.energy.soft}
            progress={stepsToday / stepGoal}
          />
          <StatTile
            icon="monitor-weight"
            value={weight || '—'}
            unit={weight ? 'ק״ג' : ''}
            label="משקל נוכחי"
            color={DOMAIN.community.color}
            soft={DOMAIN.community.soft}
            onPress={() => navigation.navigate('WeightTracking')}
          />
        </View>

        {/* ── AI coach ──────────────────────────────────────────────────── */}
        <SectionTitle>המאמן שלך</SectionTitle>
        <TouchableOpacity
          onPress={() => navigation.navigate('AIChat')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.tertiaryDark, COLORS.tertiaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiCard}
          >
            <View style={styles.aiIcon}>
              <MaterialIcons name="auto-awesome" size={26} color={COLORS.textOnColor} />
            </View>
            <View style={styles.aiText}>
              <View style={styles.aiTitleRow}>
                <Text style={styles.aiTitle}>מאמן AI</Text>
                {aiLive && (
                  <View style={styles.liveDot}>
                    <Text style={styles.liveText}>חי</Text>
                  </View>
                )}
              </View>
              <Text style={styles.aiSubtitle}>
                שאל כל שאלה על אימונים, תזונה ומוטיבציה
              </Text>
            </View>
            <MaterialIcons name={RTL_ICONS.forward} size={24} color={COLORS.textOnColor} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Quick access grid ─────────────────────────────────────────── */}
        <SectionTitle>גישה מהירה</SectionTitle>
        <View style={styles.quickGrid}>
          {quickActions.map((a) => (
            <QuickTile
              key={a.screen + a.title}
              title={a.title}
              subtitle={a.subtitle}
              icon={a.icon}
              color={a.color}
              soft={a.soft}
              width={quickTileWidth}
              onPress={() => navigation.navigate(a.screen)}
            />
          ))}
        </View>

        {/* ── Community ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.communityCard}
          onPress={() => navigation.navigate('CommunityTab')}
          activeOpacity={0.9}
        >
          <View style={[styles.quickIcon, { backgroundColor: DOMAIN.community.soft }]}>
            <MaterialIcons name="groups" size={22} color={DOMAIN.community.color} />
          </View>
          <View style={styles.communityText}>
            <Text style={styles.communityTitle}>הקהילה</Text>
            <Text style={styles.communitySubtitle}>
              מי מתאמן לידך? שתף אימון ומצא שותפים
            </Text>
          </View>
          <MaterialIcons name={RTL_ICONS.forward} size={22} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  content: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },

  workoutAction: {
    flexDirection: 'row', direction: 'rtl', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.primaryDark, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, minHeight: 76, marginBottom: SPACING.md,
  },
  workoutActionText: { flex: 1 },
  workoutActionTitle: { color: COLORS.textOnColor, fontSize: FONTS.medium, fontWeight: '700', textAlign: 'right' },
  workoutActionSubtitle: { color: COLORS.textOnColor, fontSize: FONTS.small, marginTop: SPACING.xs, textAlign: 'right' },
  // Header
  header: {
    flexDirection: 'row-reverse',
    direction: 'ltr',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerText: { alignItems: 'flex-end', direction: 'rtl' },
  greeting: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    fontWeight: '600',
  },
  name: {
    color: COLORS.text,
    fontSize: FONTS.title,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: -2,
  },

  // Hero rings card
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroLegend: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
  heroTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  ringCenterValue: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: '900',
  },
  ringCenterLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.micro,
    fontWeight: '600',
  },
  quote: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    fontStyle: 'italic',
  },

  // Stat tiles
  tileRow: {
    flexDirection: 'row-reverse',
    direction: 'ltr',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  // AI card
  aiCard: {
    flexDirection: 'row-reverse',
    direction: 'ltr',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: { flex: 1, alignItems: 'flex-end' },
  aiTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiTitle: {
    color: COLORS.textOnColor,
    fontSize: FONTS.medium,
    fontWeight: '800',
  },
  liveDot: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  liveText: {
    color: COLORS.textOnColor,
    fontSize: FONTS.micro,
    fontWeight: '800',
  },
  aiSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: FONTS.tiny,
    marginTop: 2,
    textAlign: 'right',
  },

  // Quick grid
  quickGrid: {
    flexDirection: 'row-reverse',
    direction: 'ltr',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickTile: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickTitle: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '800',
  },
  quickSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: SPACING.xs,
  },

  // Community
  communityCard: {
    flexDirection: 'row-reverse',
    direction: 'ltr',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  communityText: { flex: 1, alignItems: 'flex-end' },
  communityTitle: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '800',
  },
  communitySubtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 2,
    textAlign: 'right',
  },
});
