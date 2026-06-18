import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS, SPACING, GRADIENTS, SHADOWS } from '../config/theme';
import AuroraBackground from '../components/AuroraBackground';
import { MaterialIcons } from '@expo/vector-icons';
import { USE_NATIVE_DRIVER } from '../utils/animation';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(titleTranslate, {
          toValue: 0,
          friction: 7,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterSpin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  return (
    <View style={styles.container}>
      <AuroraBackground intensity={0.8} />

      <View style={styles.center}>
        {/* Outer ring */}
        <Animated.View
          style={[
            styles.ringContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: ringScale }, { rotate: spin }],
            },
          ]}
        >
          <Svg width={240} height={240} viewBox="0 0 100 100">
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke={COLORS.primary}
              strokeWidth="0.8"
              strokeDasharray="8 4"
              fill="none"
              opacity="0.5"
            />
          </Svg>
        </Animated.View>

        {/* Inner counter-rotating ring */}
        <Animated.View
          style={[
            styles.ringContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: ringScale }, { rotate: counterSpin }],
            },
          ]}
        >
          <Svg width={200} height={200} viewBox="0 0 100 100">
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke={COLORS.tertiary}
              strokeWidth="0.5"
              strokeDasharray="4 6"
              fill="none"
              opacity="0.6"
            />
          </Svg>
        </Animated.View>

        {/* Main logo with gradient */}
        <Animated.View
          style={[
            styles.logoCircle,
            {
              transform: [{ scale: Animated.multiply(logoScale, pulse) }],
              opacity: logoOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={GRADIENTS.aurora}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <MaterialIcons name="fitness-center" size={56} color={COLORS.text} />
          </LinearGradient>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslate }],
          },
        ]}
      >
        <Text style={styles.title}>SMIT GYM</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.taglineContainer,
          { opacity: taglineOpacity },
        ]}
      >
        <Text style={styles.subtitle}>המאמן האישי שלך</Text>
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <View style={[styles.tagDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.tagText}>תזונה</Text>
          </View>
          <View style={styles.tag}>
            <View style={[styles.tagDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.tagText}>אימונים</Text>
          </View>
          <View style={styles.tag}>
            <View style={[styles.tagDot, { backgroundColor: COLORS.tertiary }]} />
            <Text style={styles.tagText}>AI</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  ringContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    ...SHADOWS.glow,
  },
  logoGradient: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 10,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    color: COLORS.text,
    fontSize: FONTS.tiny,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
