import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { FadeInView } from '../components/AnimatedCard';
import AuroraBackground from '../components/AuroraBackground';
import { calculateBMI, calculateBMR, calculateTDEE, calculateTargetCalories } from '../services/nutritionEngine';

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
  });

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
      });
    }
  }, [userProfile]);

  // Calculate live stats
  const weightNum = Number(profile.weight) || 0;
  const heightNum = Number(profile.height) || 0;
  const ageNum = Number(profile.age) || 0;
  const bmi = calculateBMI(weightNum, heightNum);
  const bmr = calculateBMR(weightNum, heightNum, ageNum, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
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

  const activityLevels = [
    { id: 'low', label: 'נמוכה (1-2 אימונים)' },
    { id: 'moderate', label: 'בינונית (3-4 אימונים)' },
    { id: 'high', label: 'גבוהה (5-6 אימונים)' },
  ];

  const saveProfile = async () => {
    try {
      await updateProfile(profile);
      toast.success('הפרטים נשמרו בהצלחה! ✅');
    } catch (e) {
      console.log('Profile save failed:', e);
      const message = e.code === 'permission-denied'
        ? 'אין הרשאה לשמור את הפרופיל. צריך לעדכן את חוקי Firestore'
        : 'לא הצלחנו לשמור, נסה שוב';
      toast.error(message);
    }
  };

  const handleLogout = () => {
    Alert.alert('התנתקות', 'בטוח שאתה רוצה להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התנתק', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground intensity={0.4} />
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={60} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>הפרופיל שלי</Text>
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

        <Text style={styles.sectionTitle}>רמת פעילות</Text>
        {activityLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[styles.activityButton, profile.activityLevel === level.id && styles.activityButtonActive]}
            onPress={() => setProfile({ ...profile, activityLevel: level.id })}
          >
            <MaterialIcons
              name={profile.activityLevel === level.id ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={profile.activityLevel === level.id ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={styles.activityText}>{level.label}</Text>
          </TouchableOpacity>
        ))}

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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
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
  statsCard: {
    flexDirection: 'row-reverse',
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
