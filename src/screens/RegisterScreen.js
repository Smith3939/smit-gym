import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { registerUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AuthShell, { authStyles } from '../components/AuthShell';

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

export default function RegisterScreen({ navigation, route }) {
  const { setUserProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  // Carried over when Login sends an unrecognised email here.
  const [email, setEmail] = useState(route?.params?.email || '');
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
    <AuthShell title="צור חשבון" onBack={() => navigation.goBack()}>
        <View>
          <Text style={authStyles.label}>שם מלא</Text>
          <View style={authStyles.field}>
            <MaterialIcons name="person" size={22} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={authStyles.input}
              accessibilityLabel="שם מלא"
              placeholder="שם מלא"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoComplete="name"
              textAlign="right"
            />
          </View>

          <Text style={authStyles.label}>אימייל</Text>
          <View style={authStyles.field}>
            <MaterialIcons name="email" size={22} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[authStyles.input, authStyles.ltrInput]}
              accessibilityLabel="אימייל"
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

          <Text style={authStyles.label}>סיסמה</Text>
          <View style={authStyles.field}>
            <TouchableOpacity style={authStyles.iconButton} accessibilityRole="button" accessibilityLabel={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'} onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={22}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
            <TextInput
              style={authStyles.input}
              accessibilityLabel="סיסמה"
              placeholder="לפחות 6 תווים"
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

          <Text style={authStyles.label}>אימות סיסמה</Text>
          <View style={authStyles.field}>
            <MaterialIcons name="lock" size={22} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={authStyles.input}
              accessibilityLabel="אימות סיסמה"
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
            style={[authStyles.primaryButton, loading && authStyles.disabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading, busy: loading }}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textOnColor} />
            ) : (
              <Text style={authStyles.primaryButtonText}>הרשם</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginLinkText}>
              כבר יש לך חשבון? <Text style={styles.loginLinkHighlight}>התחבר</Text>
            </Text>
          </TouchableOpacity>
        </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  loginLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md },
  loginLinkText: { color: COLORS.textSecondary, fontSize: FONTS.small },
  loginLinkHighlight: { color: COLORS.primaryDark, fontWeight: '700' },
});
