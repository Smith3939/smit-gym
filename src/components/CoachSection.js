import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import Avatar from './Avatar';
import {
  lookupInviteCode, acceptInvite, getMyCoach, endCoachLink,
  enableCoachMode, disableCoachMode,
  DEFAULT_PERMISSIONS, PERMISSION_LABELS,
} from '../services/coachService';

const LOOKUP_ERRORS = {
  EMPTY: 'יש להזין קוד',
  NOT_FOUND: 'קוד לא נמצא — בדוק שהוקלד נכון',
  ALREADY_USED: 'הקוד הזה כבר נוצל',
  EXPIRED: 'תוקף הקוד פג — בקש מהמאמן קוד חדש',
};

/**
 * The coach block inside the profile screen. Two independent things:
 *  - "יש לי מאמן"  — trainee redeems an invite code and consents
 *  - "מצב מאמן"    — user flags themself as a coach and gets the dashboard
 */
export default function CoachSection({ navigation, profile }) {
  const { user, userProfile, setUserProfile } = useAuth();
  const toast = useToast();

  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codeModal, setCodeModal] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [busy, setBusy] = useState(false);

  const isCoach = !!userProfile?.isCoach;

  const loadCoach = useCallback(async () => {
    if (!user) return;
    try {
      setCoach(await getMyCoach(user.uid));
    } catch (e) {
      console.log('Coach lookup failed:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadCoach(); }, [loadCoach]);

  /* ── Trainee: redeem a code ───────────────────────────────────────────── */

  const handleCheckCode = async () => {
    setChecking(true);
    const res = await lookupInviteCode(code).catch(() => ({ ok: false, reason: 'NOT_FOUND' }));
    setChecking(false);

    if (!res.ok) {
      toast.error(LOOKUP_ERRORS[res.reason] || 'הקוד לא תקין');
      return;
    }
    if (res.coachUid === user.uid) {
      toast.error('זה הקוד שלך — אי אפשר לאמן את עצמך');
      return;
    }
    setPendingInvite(res);
    setPermissions(DEFAULT_PERMISSIONS);
  };

  const handleAccept = async () => {
    setBusy(true);
    try {
      await acceptInvite({
        code: pendingInvite.code,
        coachUid: pendingInvite.coachUid,
        traineeUid: user.uid,
        traineeName: profile?.name || userProfile?.name || '',
        permissions,
      });
      setUserProfile((p) => ({ ...p, coachUid: pendingInvite.coachUid }));
      toast.success(`${pendingInvite.coachName || 'המאמן'} מחובר אליך עכשיו 💪`);
      setPendingInvite(null);
      setCodeModal(false);
      setCode('');
      loadCoach();
    } catch (e) {
      console.log('Accept invite failed:', e);
      toast.error('החיבור נכשל, נסה שוב');
    }
    setBusy(false);
  };

  const handleDisconnect = async () => {
    const ok = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.confirm('לנתק את המאמן? הוא לא יוכל יותר לראות או לערוך את התוכניות שלך.')
      : true;
    if (!ok) return;

    setBusy(true);
    try {
      await endCoachLink({ linkId: coach?.linkId, traineeUid: user.uid });
      setUserProfile((p) => ({ ...p, coachUid: null }));
      setCoach(null);
      toast.success('המאמן נותק');
    } catch (e) {
      toast.error('הניתוק נכשל');
    }
    setBusy(false);
  };

  /* ── Coach mode toggle ────────────────────────────────────────────────── */

  const toggleCoachMode = async () => {
    setBusy(true);
    try {
      if (isCoach) {
        await disableCoachMode(user.uid);
        setUserProfile((p) => ({ ...p, isCoach: false }));
      } else {
        await enableCoachMode(user.uid, {
          name: profile?.name || userProfile?.name,
          photo: profile?.photo || userProfile?.photo,
          gymName: profile?.gymName || userProfile?.gymName,
          bio: profile?.bio || userProfile?.bio,
        });
        setUserProfile((p) => ({ ...p, isCoach: true }));
        toast.success('מצב מאמן הופעל');
      }
    } catch (e) {
      toast.error('הפעולה נכשלה');
    }
    setBusy(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>מאמן אישי 🏋️</Text>

      {/* ── My coach ─────────────────────────────────────────────────── */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
      ) : coach ? (
        <View style={styles.card}>
          <View style={styles.coachRow}>
            <Avatar photo={coach.photo} size={46} borderColor={COLORS.border} />
            <View style={styles.coachText}>
              <Text style={styles.coachName}>{coach.name || 'המאמן שלי'}</Text>
              <Text style={styles.coachMeta}>
                {coach.gymName || 'רואה את ההתקדמות שלך ומעדכן תוכניות'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={handleDisconnect}
            disabled={busy}
          >
            <Text style={styles.dangerBtnText}>נתק מאמן</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.row}
          onPress={() => setCodeModal(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.rowIcon, { backgroundColor: COLORS.primarySoft }]}>
            <MaterialIcons name="how-to-reg" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>יש לי מאמן</Text>
            <Text style={styles.rowSub}>הזן קוד הזמנה שקיבלת</Text>
          </View>
          <MaterialIcons name="chevron-left" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}

      {/* ── Coach mode ───────────────────────────────────────────────── */}
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: COLORS.tertiarySoft }]}>
          <MaterialIcons name="groups" size={20} color={COLORS.tertiary} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>אני מאמן</Text>
          <Text style={styles.rowSub}>נהל מתאמנים, ערוך להם תוכניות</Text>
        </View>
        <TouchableOpacity
          style={[styles.switch, isCoach && styles.switchOn]}
          onPress={toggleCoachMode}
          disabled={busy}
        >
          <View style={[styles.knob, isCoach && styles.knobOn]} />
        </TouchableOpacity>
      </View>

      {isCoach && (
        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => navigation.navigate('CoachDashboard')}
        >
          <MaterialIcons name="dashboard" size={18} color={COLORS.textOnColor} />
          <Text style={styles.dashboardBtnText}>המתאמנים שלי</Text>
        </TouchableOpacity>
      )}

      {/* ── Code entry / consent ─────────────────────────────────────── */}
      <Modal
        visible={codeModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setCodeModal(false); setPendingInvite(null); }}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => { setCodeModal(false); setPendingInvite(null); }}>
                <MaterialIcons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>
                {pendingInvite ? 'אישור מאמן' : 'הזן קוד מאמן'}
              </Text>
              <View style={{ width: 22 }} />
            </View>

            {!pendingInvite ? (
              <>
                <TextInput
                  style={styles.codeInput}
                  value={code}
                  onChangeText={(t) => setCode(t.toUpperCase())}
                  placeholder="SMIT-XXXX"
                  placeholderTextColor={COLORS.textDim}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  textAlign="center"
                  returnKeyType="go"
                  onSubmitEditing={handleCheckCode}
                />
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleCheckCode}
                  disabled={checking || !code.trim()}
                >
                  {checking
                    ? <ActivityIndicator color={COLORS.textOnColor} />
                    : <Text style={styles.primaryBtnText}>בדוק קוד</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.consentTitle}>
                  {pendingInvite.coachName || 'מאמן'} מבקש לאמן אותך
                </Text>
                <Text style={styles.consentSub}>בחר מה מותר לו:</Text>

                {Object.keys(DEFAULT_PERMISSIONS).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.permRow}
                    onPress={() => setPermissions((p) => ({ ...p, [key]: !p[key] }))}
                  >
                    <MaterialIcons
                      name={permissions[key] ? 'check-box' : 'check-box-outline-blank'}
                      size={22}
                      color={permissions[key] ? COLORS.primary : COLORS.textDim}
                    />
                    <Text style={styles.permText}>{PERMISSION_LABELS[key]}</Text>
                  </TouchableOpacity>
                ))}

                <Text style={styles.consentNote}>
                  תוכל לנתק את המאמן בכל רגע מהפרופיל.
                </Text>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleAccept}
                  disabled={busy}
                >
                  {busy
                    ? <ActivityIndicator color={COLORS.textOnColor} />
                    : <Text style={styles.primaryBtnText}>אשר וחבר</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={() => setPendingInvite(null)}
                >
                  <Text style={styles.ghostBtnText}>ביטול</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACING.lg, gap: SPACING.sm },
  sectionTitle: {
    color: COLORS.text, fontSize: FONTS.medium, fontWeight: '800',
    textAlign: 'right', marginBottom: SPACING.xs,
  },

  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, alignItems: 'flex-end' },
  rowTitle: { color: COLORS.text, fontSize: FONTS.regular, fontWeight: '700' },
  rowSub: { color: COLORS.textMuted, fontSize: FONTS.tiny, marginTop: 2, textAlign: 'right' },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  coachRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.md },
  coachText: { flex: 1, alignItems: 'flex-end' },
  coachName: { color: COLORS.text, fontSize: FONTS.regular, fontWeight: '800' },
  coachMeta: { color: COLORS.textMuted, fontSize: FONTS.tiny, marginTop: 2, textAlign: 'right' },

  dangerBtn: {
    marginTop: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.error,
    alignItems: 'center',
  },
  dangerBtnText: { color: COLORS.error, fontSize: FONTS.small, fontWeight: '700' },

  switch: {
    width: 46, height: 27, borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', paddingHorizontal: 3,
  },
  switchOn: { backgroundColor: COLORS.tertiary, borderColor: COLORS.tertiary },
  knob: {
    width: 21, height: 21, borderRadius: 11,
    backgroundColor: COLORS.surface, alignSelf: 'flex-start',
    ...SHADOWS.small,
  },
  knobOn: { alignSelf: 'flex-end', backgroundColor: COLORS.textOnColor },

  dashboardBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.tertiary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  dashboardBtnText: { color: COLORS.textOnColor, fontSize: FONTS.regular, fontWeight: '800' },

  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg, paddingBottom: SPACING.xl,
  },
  sheetHeader: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.lg,
  },
  sheetTitle: { color: COLORS.text, fontSize: FONTS.medium, fontWeight: '800' },

  codeInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    fontSize: 26, fontWeight: '900', letterSpacing: 3,
    color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },

  consentTitle: {
    color: COLORS.text, fontSize: FONTS.medium, fontWeight: '800',
    textAlign: 'center',
  },
  consentSub: {
    color: COLORS.textMuted, fontSize: FONTS.small,
    textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING.md,
  },
  permRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  permText: { flex: 1, color: COLORS.text, fontSize: FONTS.small, textAlign: 'right' },
  consentNote: {
    color: COLORS.textMuted, fontSize: FONTS.tiny,
    textAlign: 'center', marginTop: SPACING.sm,
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center', marginTop: SPACING.md,
  },
  primaryBtnText: { color: COLORS.textOnColor, fontSize: FONTS.regular, fontWeight: '800' },
  ghostBtn: { paddingVertical: SPACING.md, alignItems: 'center' },
  ghostBtnText: { color: COLORS.textMuted, fontSize: FONTS.small, fontWeight: '600' },
});
