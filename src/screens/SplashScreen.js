import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/theme';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.gradient} />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <View style={styles.iconRing} />
          </Animated.View>
          <View style={styles.iconCenter}>
            <MaterialIcons name="fitness-center" size={64} color={COLORS.primary} />
          </View>
        </View>

        <Text style={styles.title}>SMIT GYM</Text>
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity }}>
        <Text style={styles.subtitle}>המאמן האישי שלך</Text>
        <Text style={styles.tagline}>תזונה · אימונים · AI</Text>
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
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  iconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  iconCenter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
  },
  title: {
    color: COLORS.primary,
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  subtitle: {
    color: COLORS.text,
    fontSize: FONTS.large,
    textAlign: 'center',
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.sm,
    letterSpacing: 2,
  },
});
