import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AuroraBackground from '../components/AuroraBackground';
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from '../config/theme';
import { loadSharedProfile } from '../services/profileShareService';
import { RTL_ICONS } from '../utils/rtl';

const GOAL_LABELS = {
  cut: 'חיטוב',
  bulk: 'עלייה במסה',
  maintain: 'שמירה על משקל',
};

const ACTIVITY_LABELS = {
  low: 'נמוכה',
  moderate: 'בינונית',
  high: 'גבוהה',
};

export default function SharedProfileScreen({ navigation, route }) {
  const shareId = route?.params?.shareId;
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function fetchShare() {
      try {
        const data = await loadSharedProfile(shareId);
        if (!mounted) return;

        if (!data || data.status !== 'active') {
          setError('הקישור לא נמצא או שאינו פעיל');
          return;
        }

        setShare(data);
      } catch (e) {
        if (mounted) setError('לא הצלחנו לפתוח את השיתוף');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchShare();

    return () => {
      mounted = false;
    };
  }, [shareId]);

  const snapshot = share?.snapshot || {};
  const profile = snapshot.profile || {};
  const recentSessions = snapshot.workouts?.recentSessions || [];
  const meals = snapshot.nutrition?.dailyMealPlan || {};
  const mealList = useMemo(() => Object.values(meals).filter(Boolean), [meals]);

  return (
    <View style={styles.root}>
      <AuroraBackground intensity={0.35} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <MaterialIcons name={RTL_ICONS.back} size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.topTitleWrap}>
            <Text style={styles.eyebrow}>{share?.roleLabel || 'שיתוף פרופיל'}</Text>
            <Text style={styles.title}>פרופיל משותף</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.stateText}>טוען נתונים...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <MaterialIcons name="link-off" size={42} color={COLORS.error} />
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.heroPanel}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={34} color={COLORS.primary} />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.meta}>
                  {GOAL_LABELS[profile.goal] || profile.goal} · {ACTIVITY_LABELS[profile.activityLevel] || profile.activityLevel}
                </Text>
              </View>
            </View>

            {share.permissions?.bodyMetrics && (
              <View style={styles.metricGrid}>
                <Metric label="גיל" value={profile.age || '-'} />
                <Metric label="גובה" value={profile.height ? `${profile.height} ס"מ` : '-'} />
                <Metric label="משקל" value={profile.weight ? `${profile.weight} ק"ג` : '-'} />
              </View>
            )}

            {snapshot.nutrition?.targets && (
              <Section title="תזונה" icon="restaurant">
                <View style={styles.nutritionSummary}>
                  <Text style={styles.calories}>{snapshot.nutrition.targets.targetCalories}</Text>
                  <Text style={styles.subtle}>קלוריות יעד ליום</Text>
                </View>
                <View style={styles.macroRow}>
                  <Metric label="חלבון" value={`${snapshot.nutrition.targets.macros.protein}ג`} />
                  <Metric label="פחמימות" value={`${snapshot.nutrition.targets.macros.carbs}ג`} />
                  <Metric label="שומן" value={`${snapshot.nutrition.targets.macros.fat}ג`} />
                </View>
                {mealList.slice(0, 5).map((meal) => (
                  <View key={meal.id} style={styles.mealRow}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealCalories}>{meal.targetCalories} קלוריות</Text>
                  </View>
                ))}
              </Section>
            )}

            <Section title="אימונים אחרונים" icon="fitness-center">
              {recentSessions.length === 0 ? (
                <Text style={styles.emptyText}>עדיין אין אימונים שמורים בשיתוף הזה</Text>
              ) : (
                recentSessions.map((session) => (
                  <WorkoutSession key={session.id} session={session} />
                ))
              )}
            </Section>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, icon, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <MaterialIcons name={icon} size={22} color={COLORS.primary} />
      </View>
      {children}
    </View>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function WorkoutSession({ session }) {
  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionName}>{session.sessionName || 'אימון'}</Text>
        <Text style={styles.sessionMeta}>{session.programName || session.programType || ''}</Text>
      </View>
      {(session.exercises || []).slice(0, 8).map((exercise, index) => (
        <View key={`${exercise.exerciseId || exercise.name}-${index}`} style={styles.exerciseLine}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseMeta}>{formatLoggedSets(exercise)}</Text>
        </View>
      ))}
    </View>
  );
}

function formatLoggedSets(exercise) {
  const logged = Object.values(exercise.logged || {});
  const filled = logged.filter((set) => set?.reps || set?.weight);

  if (filled.length === 0) {
    return `${exercise.sets || '-'} סטים · ${exercise.reps || '-'} חזרות`;
  }

  return filled
    .map((set, index) => {
      const weight = set.weight ? ` / ${set.weight} ק"ג` : '';
      return `${index + 1}: ${set.reps || '-'} חזרות${weight}`;
    })
    .join(' · ');
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  topTitleWrap: {
    alignItems: 'flex-end',
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: FONTS.tiny,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
  },
  stateBox: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  stateText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
    textAlign: 'center',
  },
  heroPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.primary + '18',
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  meta: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  macroRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  metric: {
    flex: 1,
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  nutritionSummary: {
    alignItems: 'flex-end',
    marginBottom: SPACING.sm,
  },
  calories: {
    color: COLORS.success,
    fontSize: FONTS.title,
    fontWeight: '900',
  },
  subtle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  mealName: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '700',
    textAlign: 'right',
  },
  mealCalories: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'right',
  },
  sessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sessionHeader: {
    alignItems: 'flex-end',
    marginBottom: SPACING.sm,
  },
  sessionName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  sessionMeta: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 2,
  },
  exerciseLine: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '700',
    textAlign: 'right',
  },
  exerciseMeta: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
});
