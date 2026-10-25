import React, { useRef } from 'react';
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
  containerStyle,
  onPress,
  gradientColors,
  borderColor,
  tint,
  glow,
  flat,
}) {
  const scale = useRef(new Animated.Value(1)).current;

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

  const animStyle = { transform: [{ scale }] };

  const cardStyle = [
    styles.card,
    !flat && SHADOWS.medium,
    glow && SHADOWS.glow,
    (flat || borderColor) && { borderColor: borderColor || COLORS.border, borderWidth: 1 },
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
      <Animated.View style={[animStyle, containerStyle]}>
        <TouchableOpacity
          accessibilityRole="button"
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

  return <Animated.View style={[animStyle, containerStyle]}>{content}</Animated.View>;
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
});
