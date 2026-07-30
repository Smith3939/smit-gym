import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { USE_NATIVE_DRIVER } from '../utils/animation';

/**
 * Card surface for the light theme.
 *
 * Default = clean white card with a soft shadow. Pass `gradientColors` for a
 * tinted card (use the very soft GRADIENTS.card* washes), or `tint` for a
 * flat soft domain colour.
 *
 * Name/props kept stable so existing screens keep working.
 */
export default function GlassCard({
  children,
  style,
  onPress,
  gradientColors,
  borderColor,
  tint,
  delay = 0,
  noAnimation,
  glow,
  flat,
}) {
  const opacity = useRef(new Animated.Value(noAnimation ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(noAnimation ? 0 : 14)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (noAnimation) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        friction: 9,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 0.975,
      useNativeDriver: USE_NATIVE_DRIVER,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      friction: 8,
    }).start();
  };

  const animStyle = { opacity, transform: [{ translateY }, { scale }] };

  const cardStyle = [
    styles.card,
    !flat && SHADOWS.medium,
    glow && SHADOWS.glow,
    borderColor ? { borderColor, borderWidth: 1 } : styles.hairline,
    style,
  ];

  const content = gradientColors ? (
    // backgroundColor sits *behind* the (semi-transparent) gradient so tinted
    // cards read as a soft wash over white rather than over the page grey.
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[cardStyle, styles.solid]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[cardStyle, tint ? { backgroundColor: tint } : styles.solid]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={animStyle}>
        <TouchableOpacity
          activeOpacity={0.92}
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
    padding: SPACING.lg,
    overflow: 'hidden',
  },
  solid: {
    backgroundColor: COLORS.surface,
  },
  hairline: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
