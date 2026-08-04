import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  RefreshControl, Modal, Platform, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, DOMAIN, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AuroraBackground from '../components/AuroraBackground';
import Avatar from '../components/Avatar';
import { ScreenHeader } from '../components/StatTile';
import { getMyTrainees, createInviteCode } from '../services/coachService';
import { RTL_ICONS } from '../utils/rtl';

/** One trainee row. */
function TraineeCard({ data, onPress }) {
  const { profile, flags, workoutsThisWeek, currentWeight, weightDelta } = data;
  const name = profile?.name || 'מתאמן';
  const topFlag = flags.find((f) => f.level === 'alert') || flags[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardMain}>
        <Avatar photo={profile?.photo} size={48} borderColor={COLORS.border} />

        <View style={styles.cardText}>
          <Text style={styles.cardName}>{name}</Text>
          {topFlag ? (
            <View style={styles.flagRow}>
              <View style={[
                styles.flagDot,
                { backgroundColor: topFlag.level === 'alert' ? COLORS.error : COLORS.warningBright },
              ]} />
              <Text style={[
                styles.flagText,
                { color: topFlag.level === 'alert' ? COLORS.error : COLORS.warning },
              ]} numberOfLines={1}>
                {topFlag.text}
              </Text>
            </View>
          ) : (
            <Text style={styles.cardOk}>בכיוון טוב</Text>
          )}
        </View>

        <MaterialIcons name={RTL_ICONS.forward} size={22} color={COLORS.textMuted} />
      </View>

      <View style={styles.statRow}>
        <Stat label="אימונים השבוע" value={workoutsThisWeek} color={DOMAIN.workout.color} />
        <View style={styles.statDivider} />
        <Stat
          label="משקל"
          value={currentWeight ? `${currentWeight}` : '—'}
          suffix={currentWeight ? 'ק״ג' : ''}
          color={DOMAIN.community.color}
        />
        <View style={styles.statDivider} />
        <Stat
          label="שינוי"
          value={weightDelta === null || weightDelta === undefined
            ? '—'
            : `${weightDelta > 0 ? '+' : ''}${weightDelta}`}
          color={COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

function Stat({ label, value, suffix, color }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {!!suffix && <Text style={styles.statSuffix}>{suffix}</Text>}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function CoachDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useAuth();
  const toast = useToast();

  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invite, setInvite] = useState(null);
  const [creatingCode, setCreatingCode] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setTrainees(await getMyTrainees(user.uid));
    } catch (e) {
      console.log('Coach dashboard load failed:', e);
      toast.error('טעינת המתאמנים נכשלה');
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => navigation.addListener('focus', load), [navigation, load]);

  const handleCreateCode = async () => {
    setCreatingCode(true);
    try {
      const { code } = await createInviteCode(
        user.uid,
        userProfile?.name || user?.displayName || 'מאמן'
      );
      setInvite(code);
    } catch (e) {
      toast.error('יצירת הקוד נכשלה');
    }
    setCreatingCode(false);
  };

  const shareCode = async () => {
    const message =
      `היי! אני אאמן אותך ב-Smit Gym 💪\n\n` +
      `1. פתח: https://smit-gym.vercel.app\n` +
      `2. פרופיל ← "יש לי מאמן"\n` +
      `3. הקלד את הקוד: ${invite}\n\n` +
      `הקוד תקף 7 ימים.`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        if (navigator.share) await navigator.share({ text: message });
        else if (navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          toast.success('ההודעה הועתקה');
        }
        return;
      }
      await Share.share({ message });
    } catch { /* user cancelled */ }
  };

  const needAttention = trainees.filter((t) => t.needsAttention);
  const doingWell = trainees.filter((t) => !t.needsAttention);

  const openTrainee = (t) =>
    navigation.navigate('TraineeDetail', { traineeUid: t.uid, name: t.profile?.name });

  return (
    <View style={styles.root}>
      <AuroraBackground intensity={0.45} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.primary}
          />
        }
      >
        <ScreenHeader
          title="המתאמנים שלי"
          subtitle={
            loading
              ? 'טוען...'
              : `${trainees.length} מתאמנים · ${trainees.filter((t) => t.workoutsThisWeek > 0).length} התאמנו השבוע`
          }
          actionIcon="person-add"
          onAction={handleCreateCode}
        />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxl }} />
        ) : trainees.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="groups" size={52} color={COLORS.textDim} />
            <Text style={styles.emptyTitle}>עדיין אין לך מתאמנים</Text>
            <Text style={styles.emptyText}>
              צור קוד הזמנה ושלח אותו למתאמן — ברגע שהוא יאשר, הוא יופיע כאן
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleCreateCode}
              disabled={creatingCode}
            >
              {creatingCode ? (
                <ActivityIndicator color={COLORS.textOnColor} />
              ) : (
                <>
                  <MaterialIcons name="person-add" size={18} color={COLORS.textOnColor} />
                  <Text style={styles.primaryBtnText}>הוסף מתאמן</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {needAttention.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🔴 צריכים תשומת לב</Text>
                {needAttention.map((t) => (
                  <TraineeCard key={t.uid} data={t} onPress={() => openTrainee(t)} />
                ))}
              </>
            )}

            {doingWell.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>✅ בכיוון טוב</Text>
                {doingWell.map((t) => (
                  <TraineeCard key={t.uid} data={t} onPress={() => openTrainee(t)} />
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Invite code sheet */}
      <Modal visible={!!invite} transparent animationType="fade" onRequestClose={() => setInvite(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setInvite(null)}>
                <MaterialIcons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>קוד הזמנה למתאמן</Text>
              <View style={{ width: 22 }} />
            </View>

            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{invite}</Text>
            </View>
            <Text style={styles.codeHint}>
              הקוד תקף 7 ימים ולשימוש חד־פעמי. המתאמן יזין אותו בפרופיל ← "יש לי מאמן",
              ויאשר אילו הרשאות לתת לך.
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={shareCode}>
              <MaterialIcons name="share" size={18} color={COLORS.textOnColor} />
              <Text style={styles.primaryBtnText}>שלח למתאמן</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },

  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '800',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardMain: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardText: { flex: 1, alignItems: 'flex-end' },
  cardName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '800',
  },
  cardOk: {
    color: COLORS.success,
    fontSize: FONTS.tiny,
    fontWeight: '600',
    marginTop: 2,
  },
  flagRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  flagDot: { width: 7, height: 7, borderRadius: 4 },
  flagText: { fontSize: FONTS.tiny, fontWeight: '700' },

  statRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValueRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 3 },
  statValue: { fontSize: FONTS.medium, fontWeight: '900' },
  statSuffix: { color: COLORS.textMuted, fontSize: FONTS.micro, fontWeight: '700' },
  statLabel: { color: COLORS.textMuted, fontSize: FONTS.micro, marginTop: 1 },
  statDivider: { width: 1, height: 26, backgroundColor: COLORS.borderLight },

  empty: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
  },

  primaryBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  primaryBtnText: {
    color: COLORS.textOnColor,
    fontSize: FONTS.regular,
    fontWeight: '800',
  },

  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  sheetHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  sheetTitle: { color: COLORS.text, fontSize: FONTS.medium, fontWeight: '800' },
  codeBox: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderActive,
  },
  codeText: {
    color: COLORS.primary,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
  },
  codeHint: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: SPACING.md,
  },
});
