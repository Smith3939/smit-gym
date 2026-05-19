import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/theme';

export function LoadingSpinner({ size = 48, text }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
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
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <MaterialIcons name="fitness-center" size={size} color={COLORS.primary} />
      </Animated.View>
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

export function FullScreenLoader({ text = 'טוען...' }) {
  return (
    <View style={styles.fullScreen}>
      <LoadingSpinner size={64} text={text} />
    </View>
  );
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8 }) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: COLORS.surfaceLight,
        opacity: pulse,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
    marginTop: SPACING.md,
  },
});
