import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AuroraBackground from '../components/AuroraBackground';
import Avatar from '../components/Avatar';
import { calculateBMI, calculateBMR, calculateTDEE, calculateTargetCalories } from '../services/nutritionEngine';
import { createProfileShare, SHARE_PRESETS } from '../services/profileShareService';
import { upsertPublicProfile, pickAndCompressImage } from '../services/socialService';

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, updateProfile, logout } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    gender: 'male',
    goal: 'cut',
    activityLevel: 'moderate',
    trainingLevel: 'moderate',
    dailyActivityLevel: 'light',
    gymName: '',
    city: '',
    bio: '',
    photo: null,
  });
  const [shareRole, setShareRole] = useState('coach');
  const [sharePermissions, setSharePermissions] = useState(SHARE_PRESETS.coach.permissions);
  const [shareInfo, setShareInfo] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [shareExpanded, setShareExpanded] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || user?.displayName || '',
        age: userProfile.age || '',
        height: userProfile.height || '',
        weight: userProfile.weight || '',
        gender: userProfile.gender || 'male',
        goal: userProfile.goal || 'cut',
        activityLevel: userProfile.activityLevel || 'moderate',
        trainingLevel: userProfile.trainingLevel || userProfile.activityLevel || 'moderate',
        dailyActivityLevel: userProfile.dailyActivityLevel || 'light',
        gymName: userProfile.gymName || '',
        city: userProfile.city || '',
        bio: userProfile.bio || '',
        photo: userProfile.photo || null,
      });
    }
  }, [userProfile]);

  const handlePickPhoto = async () => {
    try {
      const img = await pickAndCompressImage({ maxWidth: 400, quality: 0.6 });
      if (img) {
        setProfile((prev) => ({ ...prev, photo: img }));
        toast.info('לחץ "שמור פרטים" כדי לשמור את התמונה');
      }
    } catch (e) {
      toast.error('בחירת התמונה נכשלה');
    }
  };

  // Calculate live stats
  const weightNum = Number(profile.weight) || 0;
  const heightNum = Number(profile.height) || 0;
  const ageNum = Number(profile.age) || 0;
  const bmi = calculateBMI(weightNum, heightNum);
  const bmr = calculateBMR(weightNum, heightNum, ageNum, profile.gender);
  const tdee = calculateTDEE(bmr, {
    dailyActivityLevel: profile.dailyActivityLevel,
    trainingLevel: profile.trainingLevel,
  });
  const targetCal = calculateTargetCalories(tdee, profile.goal);

  const genders = [
    { id: 'male', label: 'גבר' },
    { id: 'female', label: 'אישה' },
  ];

  const goals = [
    { id: 'cut', label: 'חיטוב', icon: 'trending-down' },
    { id: 'bulk', label: 'עלייה במסה', icon: 'trending-up' },
    { id: 'maintain', label: 'שמירה על משקל', icon: 'trending-flat' },
  ];

  const trainingLevels = [
    { id: 'none', label: 'ללא אימונים' },
    { id: 'low', label: 'נמוכה (1-2 אימונים בשבוע)' },
    { id: 'moderate', label: 'בינונית (3-4 אימונים בשבוע)' },
    { id: 'high', label: 'גבוהה (5-6 אימונים בשבוע)' },
    { id: 'extreme', label: 'גבוהה מאוד (כל יום)' },
  ];

  const dailyActivityLevels = [
    { id: 'sedentary', label: 'יושב רוב היום (עבודה משרדית)' },
    { id: 'light', label: 'קלילה (הליכה/עמידה חלק מהיום)' },
    { id: 'active', label: 'פעיל (הרבה הליכה וסידורים)' },
    { id: 'very_active', label: 'פעיל מאוד (עבודה פיזית)' },
  ];

  const shareRoles = [
    {
      id: 'coach',
      label: 'מאמן',
      icon: 'sports',
      helper: 'מדדים, אוכל ואימונים',
    },
    {
      id: 'friend',
      label: 'חבר',
      icon: 'groups',
      helper: 'אימונים להתקדמות יחד',
    },
  ];

  const permissionItems = [
    { id: 'workouts', label: 'אימונים וחזרות', icon: 'fitness-center' },
    { id: 'nutrition', label: 'תפריט ומקרו', icon: 'restaurant' },
    { id: 'bodyMetrics', label: 'משקל וגובה', icon: 'monitor-weight' },
  ];

  const saveProfile = async () => {
    try {
      await updateProfile(profile);
      // Sync the public part so the community can see it.
      // Non-fatal: if the community rules aren't deployed yet, the private
      // profile still saves.
      try {
        await upsertPublicProfile(user.uid, {
          name: profile.name,
          photo: profile.photo || null,
          bio: profile.bio || '',
          gymName: profile.gymName || '',
          city: profile.city || '',
          goal: profile.goal,
        });
      } catch (publicErr) {
        console.log('Public profile sync failed (rules not deployed?):', publicErr);
      }
      toast.success('הפרטים נשמרו בהצלחה! ✅');
    } catch (e) {
      console.log('Profile save failed:', e);
      const message = e.code === 'permission-denied'
        ? 'אין הרשאה לשמור את הפרופיל. צריך לעדכן את חוקי Firestore'
        : 'לא הצלחנו לשמור, נסה שוב';
      toast.error(message);
    }
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.confirm('בטוח שאתה רוצה להתנתק?');
    }

    return new Promise((resolve) => {
      Alert.alert('התנתקות', 'בטוח שאתה רוצה להתנתק?', [
        { text: 'ביטול', style: 'cancel', onPress: () => resolve(false) },
        { text: 'התנתק', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
  };

  const handleLogout = async () => {
    const shouldLogout = await confirmLogout();
    if (!shouldLogout) return;

    try {
      await logout();
    } catch (e) {
      console.log('Logout failed:', e);
      toast.error('לא הצלחנו להתנתק, נסה שוב');
    }
  };

  const selectShareRole = (role) => {
    setShareRole(role);
    setSharePermissions(SHARE_PRESETS[role].permissions);
    setShareInfo(null);
  };

  const toggleSharePermission = (permissionId) => {
    setSharePermissions((prev) => ({
      ...prev,
      [permissionId]: !prev[permissionId],
    }));
    setShareInfo(null);
  };

  const shareGeneratedLink = async (info) => {
    const message = `Smit Gym - ${profile.name || 'הפרופיל שלי'}\n${info.url}\nקוד שיתוף: ${info.shareId}`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      if (navigator.share) {
        await navigator.share({ title: 'Smit Gym', text: message, url: info.url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        toast.success('הקישור הועתק');
      }
      return;
    }

    await Share.share({ message, url: info.url, title: 'Smit Gym' });
  };

  const handleCreateShare = async () => {
    if (!user) {
      toast.error('צריך להתחבר כדי לשתף פרופיל');
      return;
    }

    setSharing(true);
    try {
      const info = await createProfileShare(user.uid, { ...userProfile, ...profile }, {
        role: shareRole,
        permissions: sharePermissions,
      });
      setShareInfo(info);
      try {
        await shareGeneratedLink(info);
      } catch (shareError) {
        console.log('Opening share sheet failed:', shareError);
        toast.success('הקישור נוצר. אפשר להעתיק את הקוד מהמסך');
      }
    } catch (e) {
      console.log('Profile share failed:', e);
      toast.error('לא הצלחנו ליצור שיתוף, נסה שוב');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AuroraBackground intensity={0.4} />
    <ScrollView
      style={styles.container}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
          <Avatar photo={profile.photo} size={96} />
          <View style={styles.cameraBadge}>
            <MaterialIcons name="photo-camera" size={16} color={COLORS.text} />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>הפרופיל שלי</Text>
        <Text style={styles.photoHint}>לחץ על התמונה כדי להחליף</Text>
      </View>

      {/* Live Stats Card */}
      {weightNum > 0 && heightNum > 0 && ageNum > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bmi.value}</Text>
            <Text style={styles.statLabel}>BMI</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tdee}</Text>
            <Text style={styles.statLabel}>TDEE</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{targetCal}</Text>
            <Text style={styles.statLabel}>יעד קלוריות</Text>
          </View>
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>שם מלא</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(text) => setProfile({ ...profile, name: text })}
            placeholder="הכנס שם"
            placeholderTextColor={COLORS.textMuted}
            textAlign="right"
          />
        </View>

        <Text style={styles.sectionTitle}>קהילה 👥</Text>
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>חדר כושר</Text>
            <TextInput
              style={styles.input}
              value={profile.gymName}
              onChangeText={(text) => setProfile({ ...profile, gymName: text })}
              placeholder="לדוגמא: הולמס פלייס רעננה"
              placeholderTextColor={COLORS.textMuted}
              textAlign="right"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>עיר</Text>
            <TextInput
              style={styles.input}
              value={profile.city}
              onChangeText={(text) => setProfile({ ...profile, city: text })}
              placeholder="לדוגמא: תל אביב"
              placeholderTextColor={COLORS.textMuted}
              textAlign="right"
            />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>קצת עליי (יוצג בפרופיל הציבורי)</Text>
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            value={profile.bio}
            onChangeText={(text) => setProfile({ ...profile, bio: text })}
            placeholder="מתאמן 4 שנים, אוהב רגליים כבדות 🦵"
            placeholderTextColor={COLORS.textMuted}
            textAlign="right"
            multiline
          />
        </View>

        <Text style={styles.sectionTitle}>נתונים אישיים</Text>
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>גיל</Text>
            <TextInput
              style={styles.input}
              value={profile.age}
              onChangeText={(text) => setProfile({ ...profile, age: text })}
              placeholder="25"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              textAlign="center"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>גובה (ס"מ)</Text>
            <TextInput
              style={styles.input}
              value={profile.height}
              onChangeText={(text) => setProfile({ ...profile, height: text })}
              placeholder="175"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              textAlign="center"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>משקל (ק"ג)</Text>
            <TextInput
              style={styles.input}
              value={profile.weight}
              onChangeText={(text) => setProfile({ ...profile, weight: text })}
              placeholder="70"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              textAlign="center"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>מין</Text>
        <View style={styles.goalRow}>
          {genders.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.goalButton, profile.gender === g.id && styles.goalButtonActive]}
              onPress={() => setProfile({ ...profile, gender: g.id })}
            >
              <MaterialIcons
                name={g.id === 'male' ? 'male' : 'female'}
                size={24}
                color={profile.gender === g.id ? COLORS.text : COLORS.textMuted}
              />
              <Text style={[styles.goalText, profile.gender === g.id && styles.goalTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>מטרה</Text>
        <View style={styles.goalRow}>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[styles.goalButton, profile.goal === goal.id && styles.goalButtonActive]}
              onPress={() => setProfile({ ...profile, goal: goal.id })}
            >
              <MaterialIcons
                name={goal.icon}
                size={24}
                color={profile.goal === goal.id ? COLORS.text : COLORS.textMuted}
              />
              <Text style={[styles.goalText, profile.goal === goal.id && styles.goalTextActive]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>תדירות אימונים</Text>
        {trainingLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[styles.activityButton, profile.trainingLevel === level.id && styles.activityButtonActive]}
            onPress={() => setProfile({
              ...profile,
              trainingLevel: level.id,
              activityLevel: level.id === 'none' ? 'sedentary' : level.id,
            })}
          >
            <MaterialIcons
              name={profile.trainingLevel === level.id ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={profile.trainingLevel === level.id ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={styles.activityText}>{level.label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>פעילות ביום יום / עבודה</Text>
        {dailyActivityLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[styles.activityButton, profile.dailyActivityLevel === level.id && styles.activityButtonActive]}
            onPress={() => setProfile({ ...profile, dailyActivityLevel: level.id })}
          >
            <MaterialIcons
              name={profile.dailyActivityLevel === level.id ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={profile.dailyActivityLevel === level.id ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={styles.activityText}>{level.label}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.shareCard}>
          <TouchableOpacity
            style={styles.shareHeader}
            onPress={() => setShareExpanded((current) => !current)}
            activeOpacity={0.75}
          >
            <MaterialIcons
              name={shareExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={22}
              color={COLORS.textMuted}
            />
            <View style={styles.shareTitleWrap}>
              <Text style={styles.shareTitle}>שיתוף פרופיל</Text>
              <Text style={styles.shareSubtitle}>מאמן או חבר יכולים לראות אימונים, חזרות ותזונה לפי מה שתבחר</Text>
            </View>
            <View style={styles.shareIcon}>
              <MaterialIcons name="ios-share" size={18} color={COLORS.secondary} />
            </View>
          </TouchableOpacity>

          {shareExpanded && (
            <>
              <View style={styles.shareRoleRow}>
                {shareRoles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[styles.shareRoleButton, shareRole === role.id && styles.shareRoleButtonActive]}
                    onPress={() => selectShareRole(role.id)}
                  >
                    <MaterialIcons
                      name={role.icon}
                      size={20}
                      color={shareRole === role.id ? COLORS.text : COLORS.textMuted}
                    />
                    <Text style={[styles.shareRoleText, shareRole === role.id && styles.shareRoleTextActive]}>
                      {role.label}
                    </Text>
                    <Text style={styles.shareRoleHelper}>{role.helper}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.permissionList}>
                {permissionItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.permissionPill, sharePermissions[item.id] && styles.permissionPillActive]}
                    onPress={() => toggleSharePermission(item.id)}
                  >
                    <MaterialIcons
                      name={sharePermissions[item.id] ? 'check-circle' : item.icon}
                      size={18}
                      color={sharePermissions[item.id] ? COLORS.success : COLORS.textMuted}
                    />
                    <Text style={styles.permissionText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {shareInfo && (
                <View style={styles.shareResult}>
                  <Text style={styles.shareCodeLabel}>קוד שיתוף</Text>
                  <Text style={styles.shareCode}>{shareInfo.shareId}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
                onPress={handleCreateShare}
                disabled={sharing}
              >
                <MaterialIcons name={sharing ? 'hourglass-empty' : 'send'} size={20} color={COLORS.background} />
                <Text style={styles.shareButtonText}>{sharing ? 'יוצר שיתוף...' : 'צור ושלח קישור'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.saveButtonText}>שמור פרטים</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>התנתקות</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  photoHint: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: SPACING.xs,
  },
  form: {
    padding: SPACING.lg,
  },
  field: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  goalRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  goalButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  goalButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDark + '30',
  },
  goalText: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    fontWeight: '600',
  },
  goalTextActive: {
    color: COLORS.text,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  activityButtonActive: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activityText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  logoutButtonText: {
    color: COLORS.error,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
  shareCard: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  shareHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    minHeight: 48,
    gap: SPACING.sm,
  },
  shareIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.secondary + '10',
    borderWidth: 1,
    borderColor: COLORS.secondary + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  shareTitle: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '800',
    textAlign: 'right',
  },
  shareSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.micro,
    textAlign: 'right',
    lineHeight: 14,
    marginTop: 2,
  },
  shareRoleRow: {
    flexDirection: 'row-reverse',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  shareRoleButton: {
    flex: 1,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  shareRoleButtonActive: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary + '12',
  },
  shareRoleText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    fontWeight: '800',
  },
  shareRoleTextActive: {
    color: COLORS.text,
  },
  shareRoleHelper: {
    color: COLORS.textMuted,
    fontSize: FONTS.micro,
    lineHeight: 14,
    textAlign: 'center',
  },
  permissionList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  permissionPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    minHeight: 40,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  permissionPillActive: {
    borderColor: COLORS.success + '70',
    backgroundColor: COLORS.success + '12',
  },
  permissionText: {
    color: COLORS.text,
    fontSize: FONTS.tiny,
    fontWeight: '700',
  },
  shareResult: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  shareCodeLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.micro,
  },
  shareCode: {
    color: COLORS.secondary,
    fontSize: FONTS.tiny,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  shareButton: {
    minHeight: 44,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  shareButtonDisabled: {
    opacity: 0.65,
  },
  shareButtonText: {
    color: COLORS.background,
    fontSize: FONTS.regular,
    fontWeight: '900',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.primary,
    fontSize: FONTS.large,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    marginTop: SPACING.xs,
  },
});
