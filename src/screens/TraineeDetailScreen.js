import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, DOMAIN, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import AuroraBackground from '../components/AuroraBackground';
import Avatar from '../components/Avatar';
import SimpleChart from '../components/SimpleChart';
import StatTile, { SectionTitle } from '../components/StatTile';
import { getTraineeSummary } from '../services/coachService';
import { RTL_ICONS } from '../utils/rtl';

const GOAL_LABELS = { cut: 'חיטוב', bulk: 'עלייה במסה', maintain: 'שמירה' };

export default function TraineeDetailScreen({ navigation, route }) {
  const { traineeUid } = route.params;
  const insets = useSafeAreaInsets();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setData(await getTraineeSummary(traineeUid));
      } catch (e) {
        console.log('Trainee load failed:', e);
      }
      setLoading(false);
    })();
  }, [traineeUid]);

  const profile = data?.profile || {};
  const name = profile.name || route.params?.name || 'מתאמן';

  const weightSeries = (data?.weights || [])
    .slice()
    .reverse()
    .map((w) => ({
      value: Number(w.weight),
      label: w.date ? String(w.date).slice(5, 10) : '',
    }))
    .filter((p) => Number.isFinite(p.value));

  return (
    <View style={styles.root}>
      <AuroraBackground intensity={0.45} />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name={RTL_ICONS.back} size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxl }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Identity */}
          <View style={styles.hero}>
            <Avatar photo={profile.photo} size={78} borderColor={COLORS.border} />
            <Text style={styles.name}>{name}</Text>
            <View style={styles.chipRow}>
              {!!profile.goal && (
                <View style={styles.chip}>
                  <MaterialIcons name="flag" size={13} color={COLORS.primary} />
                  <Text style={styles.chipText}>{GOAL_LABELS[profile.goal] || profile.goal}</Text>
                </View>
              )}
              {!!profile.gymName && (
                <View style={styles.chip}>
                  <MaterialIcons name="fitness-center" size={13} color={COLORS.secondary} />
                  <Text style={styles.chipText}>{profile.gymName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Flags */}
          {data?.flags?.length > 0 && (
            <View style={styles.flagsCard}>
              {data.flags.map((f, i) => (
                <View key={i} style={styles.flagRow}>
                  <MaterialIcons
                    name={f.level === 'alert' ? 'error-outline' : 'info-outline'}
                    size={17}
                    color={f.level === 'alert' ? COLORS.error : COLORS.warning}
                  />
                  <Text style={styles.flagText}>{f.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Numbers */}
          <SectionTitle>מבט מהיר</SectionTitle>
          <View style={styles.tileRow}>
            <StatTile
              icon="fitness-center"
              value={data?.workoutsThisWeek ?? 0}
              label="אימונים השבוע"
              color={DOMAIN.workout.color}
              soft={DOMAIN.workout.soft}
            />
            <StatTile
              icon="monitor-weight"
              value={data?.currentWeight ?? '—'}
              unit={data?.currentWeight ? 'ק״ג' : ''}
              label="משקל נוכחי"
              color={DOMAIN.community.color}
              soft={DOMAIN.community.soft}
            />
          </View>
          <View style={styles.tileRow}>
            <StatTile
              icon="event-available"
              value={data?.daysSinceWorkout === null || data?.daysSinceWorkout === undefined
                ? '—'
                : data.daysSinceWorkout}
              unit={data?.daysSinceWorkout ? 'ימים' : ''}
              label="מאז האימון האחרון"
              color={DOMAIN.energy.color}
              soft={DOMAIN.energy.soft}
            />
            <StatTile
              icon="local-fire-department"
              value={profile.dailyCalories || '—'}
              unit="קל׳"
              label="יעד קלורי"
              color={DOMAIN.nutrition.color}
              soft={DOMAIN.nutrition.soft}
            />
          </View>

          {/* Weight trend */}
          {weightSeries.length >= 2 && (
            <>
              <SectionTitle>מגמת משקל</SectionTitle>
              <SimpleChart data={weightSeries} label="" height={150} />
            </>
          )}

          {/* Workout history */}
          <SectionTitle>אימונים אחרונים</SectionTitle>
          {(data?.workouts || []).length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>עוד לא נרשמו אימונים</Text>
            </View>
          ) : (
            data.workouts.slice(0, 8).map((w) => (
              <View key={w.id} style={styles.logCard}>
                <View style={styles.logMain}>
                  <Text style={styles.logName}>{w.sessionName || w.programName || 'אימון'}</Text>
                  <Text style={styles.logMeta}>
                    {(w.exercises || []).length} תרגילים
                    {w.createdAt?.seconds
                      ? ` · ${new Date(w.createdAt.seconds * 1000).toLocaleDateString('he-IL')}`
                      : ''}
                  </Text>
                </View>
                <MaterialIcons name="check-circle" size={20} color={COLORS.successBright} />
              </View>
            ))
          )}

          {/* Phase-2 placeholder — editing lands here */}
          <View style={styles.soonCard}>
            <MaterialIcons name="edit-note" size={20} color={COLORS.textMuted} />
            <Text style={styles.soonText}>
              עריכת תוכנית ותפריט עבור המתאמן — בשלב הבא
            </Text>
          </View>

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    color: COLORS.text, fontSize: FONTS.large, fontWeight: '900',
  },
  content: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },

  hero: { alignItems: 'center', paddingVertical: SPACING.md },
  name: {
    color: COLORS.text, fontSize: FONTS.xlarge, fontWeight: '900',
    marginTop: SPACING.sm,
  },
  chipRow: {
    flexDirection: 'row-reverse', gap: SPACING.sm,
    marginTop: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipText: { color: COLORS.textSecondary, fontSize: FONTS.tiny, fontWeight: '600' },

  flagsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  flagRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.sm },
  flagText: { flex: 1, color: COLORS.text, fontSize: FONTS.small, textAlign: 'right' },

  tileRow: { flexDirection: 'row-reverse', gap: SPACING.md, marginBottom: SPACING.md },

  logCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  logMain: { flex: 1, alignItems: 'flex-end' },
  logName: { color: COLORS.text, fontSize: FONTS.regular, fontWeight: '700' },
  logMeta: { color: COLORS.textMuted, fontSize: FONTS.tiny, marginTop: 2 },

  emptyBox: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.small },

  soonCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginTop: SPACING.lg,
  },
  soonText: { flex: 1, color: COLORS.textMuted, fontSize: FONTS.tiny, textAlign: 'right' },
});
