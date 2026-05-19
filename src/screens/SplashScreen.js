import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop, Path } from 'react-native-svg';
import { COLORS, FONTS, SPACING, GRADIENTS } from '../config/theme';
import ParticleBackground from '../components/ParticleBackground';

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
      // 1. Ring expands
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // 2. Logo zooms in
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      // 3. Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslate, {
          toValue: 0,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // 4. Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
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
      <LinearGradient
        colors={['#0F0F14', '#1A1A23', '#0F0F14']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Background glow */}
      <View style={styles.glowContainer}>
        <Svg width={width * 0.9} height={width * 0.9}>
          <Defs>
            <RadialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.3" />
              <Stop offset="50%" stopColor={COLORS.tertiary} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="50%" fill="url(#bgGlow)" />
        </Svg>
      </View>

      <ParticleBackground count={20} color={COLORS.primary} />

      <View style={styles.center}>
        {/* Animated rings */}
        <Animated.View
          style={[
            styles.ringContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: ringScale }, { rotate: spin }],
            },
          ]}
        >
          <Svg width={220} height={220} viewBox="0 0 100 100">
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke={COLORS.primary}
              strokeWidth="2"
              strokeDasharray="10 5"
              fill="none"
              opacity="0.6"
            />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[
            styles.ringContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: ringScale }, { rotate: counterSpin }],
            },
          ]}
        >
          <Svg width={180} height={180} viewBox="0 0 100 100">
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke={COLORS.tertiary}
              strokeWidth="1.5"
              strokeDasharray="5 8"
              fill="none"
              opacity="0.5"
            />
          </Svg>
        </Animated.View>

        {/* Main logo */}
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
            colors={GRADIENTS.primaryHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Svg width={70} height={70} viewBox="0 0 24 24">
              {/* Dumbbell icon */}
              <Path
                d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14 4.14 5.57 2 7.71 3.43 9.14 2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22 14.86 20.57 16.29 22 18.43 19.86 19.86 21.29 21.29 19.86 19.86 18.43 22 16.29 20.57 14.86Z"
                fill="white"
              />
            </Svg>
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
            <Text style={styles.tagText}>תזונה</Text>
          </View>
          <View style={styles.tagDot} />
          <View style={styles.tag}>
            <Text style={styles.tagText}>אימונים</Text>
          </View>
          <View style={styles.tagDot} />
          <View style={styles.tag}>
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
  glowContainer: {
    position: 'absolute',
    top: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    width: 220,
    height: 220,
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
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 8,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
    marginBottom: SPACING.md,
  },
  tagsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: FONTS.tiny,
    fontWeight: '700',
    letterSpacing: 2,
  },
  tagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
