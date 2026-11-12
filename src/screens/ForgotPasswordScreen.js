import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { resetPassword } from '../services/authService';
import AuthShell, { authStyles } from '../components/AuthShell';

export default function ForgotPasswordScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const initialEmail = route?.params?.email;

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleReset = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert('שגיאה', 'יש להזין כתובת אימייל');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(cleanEmail);
      setEmail(cleanEmail);
      setSent(true);
    } catch (error) {
      let msg = 'שגיאה בשליחת האימייל';
      if (error.code === 'auth/user-not-found') msg = 'משתמש לא נמצא עם אימייל זה';
      else if (error.code === 'auth/invalid-email') msg = 'כתובת אימייל לא תקינה';
      Alert.alert('שגיאה', msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title="הקישור נשלח!">
        <View style={styles.successContent}>
          <MaterialIcons name="mark-email-read" size={80} color={COLORS.primary} />
          <Text style={styles.successText}>
            שלחנו לך קישור לאיפוס סיסמה לכתובת {email}
          </Text>
          <Text style={styles.successSubtext}>
            בדוק את תיבת הדואר שלך (כולל ספאם)
          </Text>
          <TouchableOpacity
            style={[authStyles.primaryButton, { marginTop: SPACING.lg }]}
            accessibilityRole="button"
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={authStyles.primaryButtonText}>חזרה להתחברות</Text>
          </TouchableOpacity>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="איפוס סיסמה" onBack={() => navigation.goBack()}>
      <View>
        <View style={styles.iconSection}>
          <MaterialIcons name="lock-reset" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.description}>
          הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
        </Text>

        <Text style={authStyles.label}>אימייל</Text>
        <View style={authStyles.field}>
          <MaterialIcons name="email" size={22} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[authStyles.input, authStyles.ltrInput]}
            accessibilityLabel="אימייל"
            autoComplete="email"
            placeholder="אימייל"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="left"
          />
        </View>

        <TouchableOpacity
          style={[authStyles.primaryButton, loading && authStyles.disabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: loading, busy: loading }}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textOnColor} />
          ) : (
            <Text style={authStyles.primaryButtonText}>שלח קישור לאיפוס</Text>
          )}
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  iconSection: { alignItems: 'center', marginBottom: SPACING.lg },
  description: { color: COLORS.textSecondary, fontSize: FONTS.regular, textAlign: 'right', marginBottom: SPACING.lg, lineHeight: 26 },
  inputIcon: { marginStart: SPACING.sm },
  successContent: { alignItems: 'center', gap: SPACING.sm },
  successText: { color: COLORS.textSecondary, fontSize: FONTS.regular, textAlign: 'center', lineHeight: 26, marginTop: SPACING.md },
  successSubtext: { color: COLORS.textMuted, fontSize: FONTS.small, textAlign: 'center', lineHeight: 22 },
});
