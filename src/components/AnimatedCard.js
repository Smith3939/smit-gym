import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, StyleSheet, View } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../config/theme';
import { USE_NATIVE_DRIVER } from '../utils/animation';

export function FadeInView({ children, delay = 0, duration = 400, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
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

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function AnimatedButton({ onPress, children, style, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: USE_NATIVE_DRIVER,
      friction: 7,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      friction: 7,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function AnimatedCard({ children, style, onPress, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: USE_NATIVE_DRIVER,
        friction: 7,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 0.96,
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

  const animatedStyle = {
    opacity,
    transform: [{ translateY }, { scale }],
  };

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.card, style]}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, styles.card, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
