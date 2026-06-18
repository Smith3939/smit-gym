import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Animated, Dimensions, useWindowDimensions,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COLORS, FONTS, SPACING, BORDER_RADIUS, GRADIENTS, SHADOWS,
} from '../config/theme';
import { loginUser } from '../services/authService';
import { signInWithGoogleWeb } from '../services/googleAuthService';
import { useToast } from '../components/Toast';
import { FadeInView } from '../components/AnimatedCard';
import GlassCard from '../components/GlassCard';
import AuroraBackground from '../components/AuroraBackground';
import { USE_NATIVE_DRIVER } from '../utils/animation';
import { RTL_ICONS } from '../utils/rtl';

const { width } = Dimensions.get('window');
const SHOW_GOOGLE_LOGIN = false;

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const initialEmail = route?.params?.email;

  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    Animated.loop(
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: USE_NATIVE_DRIVER,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

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
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await signInWithGoogleWeb();
      } else {
        toast.info('התחברות Google זמינה כרגע רק בדפדפן');
      }
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        const msg = error.code === 'auth/unauthorized-domain'
          ? 'יש להוסיף את כתובת האתר לרשימת הדומיינים המורשים ב-Firebase'
          : 'לא הצלחנו להתחבר עם Google';
        toast.error(msg);
      }
    }
    setLoading(false);
  };

  const spin = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.backgroundStage,
          StyleSheet.absoluteFillObject,
        ]}
      >
        <AuroraBackground intensity={0.7} />
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              minHeight: height,
              paddingTop: Math.max(insets.top + SPACING.md, SPACING.xl),
              paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Animated.View style={[styles.ringOuter, { transform: [{ rotate: spin }] }]}>
              <Svg width={160} height={160} viewBox="0 0 100 100">
                <Circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={COLORS.primary}
                  strokeWidth="1.5"
                  strokeDasharray="8 4"
                  fill="none"
                  opacity="0.5"
                />
              </Svg>
            </Animated.View>

            <Animated.View
              style={[
                styles.glowCircle,
                { opacity: glowPulse, transform: [{ scale: glowPulse }] },
              ]}
            />

            <Animated.View
              style={[
                styles.logoCircle,
                { transform: [{ scale: logoScale }] },
              ]}
            >
              <LinearGradient
                colors={GRADIENTS.primaryHero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <MaterialIcons name="fitness-center" size={52} color={COLORS.text} />
              </LinearGradient>
            </Animated.View>
          </View>

          <FadeInView delay={300}>
            <Text style={styles.appName}>SMIT GYM</Text>
            <Text style={styles.tagline}>המאמן האישי שלך</Text>
          </FadeInView>

          <GlassCard
            delay={500}
            style={styles.form}
            gradientColors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
          >
            <Text style={styles.formTitle}>התחברות</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={22} color={COLORS.primary} />
                <TextInput
                  style={styles.input}
                  placeholder="אימייל"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="right"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={22}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="סיסמה"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="right"
                />
                <MaterialIcons name="lock" size={22} color={COLORS.primary} />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword', { email: email.trim().toLowerCase() })}
            >
              <Text style={styles.forgotText}>שכחת סיסמה?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.loginButton, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.text} />
                ) : (
                  <>
                    <MaterialIcons name={RTL_ICONS.forward} size={20} color={COLORS.text} />
                    <Text style={styles.loginButtonText}>התחבר</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {SHOW_GOOGLE_LOGIN && Platform.OS === 'web' && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>או</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <FontAwesome name="google" size={20} color="#DB4437" />
                  <Text style={styles.googleButtonText}>התחבר עם Google</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: SPACING.md }} />

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={styles.registerButtonText}>צור חשבון חדש</Text>
              <MaterialIcons name="person-add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDeep,
  },
  backgroundStage: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  glowBg: {
    position: 'absolute',
    top: -width * 0.3,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    marginBottom: SPACING.md,
  },
  ringOuter: {
    position: 'absolute',
  },
  glowCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    ...SHADOWS.glow,
  },
  logoGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: COLORS.text,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  form: {
    padding: SPACING.lg,
  },
  formTitle: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.regular,
    paddingVertical: SPACING.md,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginBottom: SPACING.lg,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.glow,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
    fontSize: FONTS.small,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  googleButtonText: {
    color: '#333',
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  registerButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.medium,
    fontWeight: '600',
  },
});
