import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    goal: 'cut',
    activityLevel: 'moderate',
  });

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

  const saveProfile = () => {
    Alert.alert('נשמר!', 'הפרטים שלך עודכנו בהצלחה');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={60} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>הפרופיל שלי</Text>
      </View>

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
});
