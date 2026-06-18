import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { resetPassword } from '../services/authService';

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
      <View style={styles.container}>
        <View style={styles.successContent}>
          <MaterialIcons name="mark-email-read" size={80} color={COLORS.primary} />
          <Text style={styles.successTitle}>הקישור נשלח!</Text>
          <Text style={styles.successText}>
            שלחנו לך קישור לאיפוס סיסמה לכתובת {email}
          </Text>
          <Text style={styles.successSubtext}>
            בדוק את תיבת הדואר שלך (כולל ספאם)
          </Text>
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backToLoginText}>חזרה להתחברות</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-forward" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>איפוס סיסמה</Text>
        </View>

        <View style={styles.iconSection}>
          <MaterialIcons name="lock-reset" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.description}>
          הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
        </Text>

        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={22} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="אימייל"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
        </View>

        <TouchableOpacity
          style={[styles.resetButton, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.resetButtonText}>שלח קישור לאיפוס</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginLeft: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginLeft: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.regular,
    paddingVertical: SPACING.md,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successTitle: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    marginTop: SPACING.lg,
  },
  successText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 24,
  },
  successSubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  backToLoginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    marginTop: SPACING.xl,
  },
  backToLoginText: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
});
