import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { loginUser } from '../services/authService';
import { useToast } from '../components/Toast';
import AuthShell, { authStyles } from '../components/AuthShell';
import { RTL_ICONS } from '../utils/rtl';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const passwordRef = useRef(null);
  const toast = useToast();
  const initialEmail = route?.params?.email;

  useEffect(() => { if (initialEmail) setEmail(initialEmail); }, [initialEmail]);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password.trim()) {
      toast.error('יש למלא אימייל וסיסמה');
      return;
    }
    setLoading(true);
    try {
      await loginUser(cleanEmail, password);
      toast.success('התחברת בהצלחה!');
    } catch (error) {
      let msg = 'שגיאה בהתחברות, נסה שוב';
      if (error.code === 'auth/user-not-found') msg = 'משתמש לא נמצא';
      else if (error.code === 'auth/wrong-password') msg = 'סיסמה שגויה';
      else if (error.code === 'auth/invalid-email') msg = 'כתובת אימייל לא תקינה';
      else if (error.code === 'auth/too-many-requests') msg = 'יותר מדי ניסיונות, נסה מאוחר יותר';
      else if (error.code === 'auth/invalid-credential') msg = 'אימייל או סיסמה שגויים';
      else if (error.code === 'auth/operation-not-allowed') msg = 'יש להפעיל Email/Password ב-Firebase Authentication';
      else if (error.code === 'auth/configuration-not-found') msg = 'הגדרות Firebase Authentication חסרות לפרויקט הזה';
      console.error('Login failed:', error.code, error.message);

      // No such account (Firebase returns invalid-credential for an unknown
      // email too) — send them to registration with the email carried over
      // instead of leaving them stuck on a failing login form.
      const looksUnregistered =
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential';

      if (looksUnregistered) {
        toast.info('לא מצאנו חשבון כזה — בוא ניצור לך אחד', 4000);
        navigation.navigate('Register', { email: cleanEmail });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="התחברות">
      <Text nativeID="login-email-label" style={authStyles.label}>אימייל</Text>
      <View style={[authStyles.field, focused === 'email' && authStyles.fieldFocused]}>
        <MaterialIcons name="mail-outline" size={21} color={COLORS.textMuted} accessible={false} />
        <TextInput
          style={[authStyles.input, authStyles.ltrInput]}
          accessibilityLabel="אימייל"
          accessibilityLabelledBy="login-email-label"
          placeholder="name@example.com"
          placeholderTextColor={COLORS.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          textAlign="left"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused(null)}
        />
      </View>

      <Text nativeID="login-password-label" style={authStyles.label}>סיסמה</Text>
      <View style={[authStyles.field, focused === 'password' && authStyles.fieldFocused]}>
        <MaterialIcons name="lock-outline" size={21} color={COLORS.textMuted} accessible={false} />
        <TextInput
          ref={passwordRef}
          style={authStyles.input}
          accessibilityLabel="סיסמה"
          accessibilityLabelledBy="login-password-label"
          placeholder="הסיסמה שלך"
          placeholderTextColor={COLORS.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect={false}
          textAlign="right"
          returnKeyType="go"
          onSubmitEditing={() => { if (!loading) handleLogin(); }}
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
        />
        <TouchableOpacity
          style={authStyles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
          onPress={() => setShowPassword(!showPassword)}
        >
          <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={21} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.forgotButton}
        accessibilityRole="button"
        onPress={() => navigation.navigate('ForgotPassword', { email: email.trim().toLowerCase() })}
      >
        <Text style={styles.forgotText}>שכחת סיסמה?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[authStyles.primaryButton, loading && authStyles.disabled]}
        onPress={handleLogin}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading, busy: loading }}
        accessibilityLabel={loading ? 'מתחבר' : 'התחבר'}
        activeOpacity={0.85}
      >
        {loading ? <ActivityIndicator color={COLORS.textOnColor} /> : <>
          <Text style={authStyles.primaryButtonText}>התחבר</Text>
          <MaterialIcons name={RTL_ICONS.forward} size={20} color={COLORS.textOnColor} />
        </>}
      </TouchableOpacity>

      <View style={styles.registerSection}>
        <TouchableOpacity
          style={authStyles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
          accessibilityRole="button"
          activeOpacity={0.85}
        >
          <Text style={authStyles.secondaryButtonText}>צור חשבון חדש</Text>
          <MaterialIcons name="person-add-alt" size={20} color={COLORS.primaryDark} />
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgotButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: -SPACING.sm, marginBottom: SPACING.sm },
  forgotText: { color: COLORS.primaryDark, fontSize: FONTS.small, fontWeight: '600' },
  registerSection: { marginTop: SPACING.lg, paddingTop: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
});
