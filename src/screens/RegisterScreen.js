import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { registerUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { RTL_ICONS } from '../utils/rtl';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRegisterErrorMessage(error) {
  if (error.code === 'auth/email-already-in-use') {
    return 'כבר קיים חשבון עם האימייל הזה. התחבר עם האימייל, ואם שכחת סיסמה אפס אותה.';
  }
  if (error.code === 'auth/invalid-email') return 'כתובת אימייל לא תקינה';
  if (error.code === 'auth/weak-password') return 'הסיסמה חלשה מדי';
  if (error.code === 'auth/operation-not-allowed') return 'יש להפעיל Email/Password ב-Firebase Authentication';
  if (error.code === 'auth/configuration-not-found') return 'הגדרות Firebase Authentication חסרות לפרויקט הזה';
  if (error.code === 'auth/too-many-requests') return 'יותר מדי ניסיונות, נסה שוב מאוחר יותר';
  if (error.code === 'auth/network-request-failed') return 'בעיית רשת, בדוק חיבור ונסה שוב';
  return 'שגיאה בהרשמה, נסה שוב';
}

export default function RegisterScreen({ navigation }) {
  const { setUserProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      toast.error('יש להזין שם');
      return;
    }
    if (!cleanEmail) {
      toast.error('יש להזין אימייל');
      return;
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      toast.error('כתובת אימייל לא תקינה');
      return;
    }
    if (password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('הסיסמאות לא תואמות');
      return;
    }

    setLoading(true);
    try {
      const { profile } = await registerUser(cleanEmail, password, cleanName);
      setUserProfile(profile);
      toast.success('החשבון נוצר בהצלחה!');
    } catch (error) {
      console.error('Registration failed:', error.code, error.message);
      toast.error(getRegisterErrorMessage(error), 5000);
      if (error.code === 'auth/email-already-in-use') {
        navigation.navigate('Login', { email: cleanEmail });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name={RTL_ICONS.back} size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>צור חשבון</Text>
        </View>

        <View style={styles.logoSection}>
          <MaterialIcons name="fitness-center" size={48} color={COLORS.primary} />
          <Text style={styles.logoText}>SMIT GYM</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={22} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="שם מלא"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoComplete="name"
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={22} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="אימייל"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={22}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="סיסמה (לפחות 6 תווים)"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
              textAlign="right"
            />
            <MaterialIcons name="lock" size={22} color={COLORS.textMuted} style={styles.inputIcon} />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={22} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="אימות סיסמה"
              placeholderTextColor={COLORS.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.registerButtonText}>הרשם</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginLinkText}>
              כבר יש לך חשבון? <Text style={styles.loginLinkHighlight}>התחבר</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    marginStart: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoText: {
    color: COLORS.primary,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginTop: SPACING.sm,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginStart: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.regular,
    paddingVertical: SPACING.md,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  loginLinkText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
  },
  loginLinkHighlight: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
