import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { USE_NATIVE_DRIVER } from '../utils/animation';

export default function GlassCard({
  children,
  style,
  onPress,
  gradientColors = ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'],
  borderColor = 'rgba(255,255,255,0.1)',
  delay = 0,
  noAnimation,
  glow,
}) {
  const opacity = useRef(new Animated.Value(noAnimation ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(noAnimation ? 0 : 20)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (noAnimation) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: USE_NATIVE_DRIVER,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: USE_NATIVE_DRIVER,
      friction: 7,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      friction: 7,
    }).start();
  };

  const animStyle = {
    opacity,
    transform: [{ translateY }, { scale }],
  };

  const content = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        { borderColor },
        glow && SHADOWS.glow,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Animated.View style={animStyle}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <Animated.View style={animStyle}>{content}</Animated.View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
});
