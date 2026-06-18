import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { REMINDER_TYPES } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const [reminders, setReminders] = useState(
    REMINDER_TYPES.reduce((acc, r) => ({ ...acc, [r.id]: r.defaultEnabled }), {})
  );

  const toggleReminder = (id) => {
    setReminders((prev) => ({ ...prev, [id]: !prev[id] }));
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
      Alert.alert('שגיאה', 'לא הצלחנו להתנתק, נסה שוב');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MaterialIcons name="settings" size={24} color={COLORS.primary} />
          <Text style={styles.title}>הגדרות</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.headerBtn}>
          <MaterialIcons name="home" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>התראות</Text>
      {REMINDER_TYPES.map((reminder) => (
        <View key={reminder.id} style={styles.settingRow}>
          <Switch
            value={reminders[reminder.id]}
            onValueChange={() => toggleReminder(reminder.id)}
            trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '80' }}
            thumbColor={reminders[reminder.id] ? COLORS.primary : COLORS.textMuted}
          />
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{reminder.title}</Text>
            <Text style={styles.settingDesc}>{reminder.description}</Text>
          </View>
          <MaterialIcons name={reminder.icon} size={24} color={COLORS.primary} />
        </View>
      ))}

      <Text style={styles.sectionTitle}>כללי</Text>

      <TouchableOpacity style={styles.settingRow}>
        <MaterialIcons name="chevron-left" size={24} color={COLORS.textMuted} />
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>שפה</Text>
          <Text style={styles.settingDesc}>עברית</Text>
        </View>
        <MaterialIcons name="language" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingRow}>
        <MaterialIcons name="chevron-left" size={24} color={COLORS.textMuted} />
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>גודל גופן</Text>
          <Text style={styles.settingDesc}>רגיל</Text>
        </View>
        <MaterialIcons name="format-size" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingRow}>
        <MaterialIcons name="chevron-left" size={24} color={COLORS.textMuted} />
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>נושא</Text>
          <Text style={styles.settingDesc}>כהה</Text>
        </View>
        <MaterialIcons name="dark-mode" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>תמיכה</Text>

      <TouchableOpacity style={styles.settingRow}>
        <MaterialIcons name="chevron-left" size={24} color={COLORS.textMuted} />
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>דיווח בעיה</Text>
        </View>
        <MaterialIcons name="bug-report" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingRow}>
        <MaterialIcons name="chevron-left" size={24} color={COLORS.textMuted} />
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>עזרה</Text>
        </View>
        <MaterialIcons name="help" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>התנתקות</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Smit Gym v1.0.0</Text>
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  settingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
    textAlign: 'right',
  },
  settingDesc: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
  version: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
});
