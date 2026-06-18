import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, GRADIENTS, SHADOWS } from '../config/theme';
import { USE_NATIVE_DRIVER } from '../utils/animation';
import { RTL_ROW_CENTER } from '../utils/rtl';

/**
 * Modern button with gradient, glow, and press animation
 * Supports primary/secondary/ghost variants
 */
export default function ModernButton({
  onPress,
  title,
  icon,
  iconRight,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  gradient,
  glow = false,
  style,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: USE_NATIVE_DRIVER,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: USE_NATIVE_DRIVER,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  const sizeStyle = {
    sm: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
    md: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
    lg: { paddingVertical: SPACING.md + 2, paddingHorizontal: SPACING.xl },
  }[size];

  const textSize = {
    sm: FONTS.small,
    md: FONTS.regular,
    lg: FONTS.medium,
  }[size];

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];

  if (variant === 'primary') {
    return (
      <Animated.View
        style={[
          { transform: [{ scale }], opacity },
          fullWidth && { width: '100%' },
          glow && SHADOWS.glow,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={gradient || GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.buttonBase,
              sizeStyle,
              disabled && styles.disabled,
              style,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <>
                {icon && !iconRight && (
                  <MaterialIcons name={icon} size={iconSize} color={COLORS.text} />
                )}
                <Text style={[styles.buttonText, { fontSize: textSize }]}>{title}</Text>
                {iconRight && (
                  <MaterialIcons name={iconRight} size={iconSize} color={COLORS.text} />
                )}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View style={[{ transform: [{ scale }], opacity }, fullWidth && { width: '100%' }]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.95}
          style={[
            styles.buttonBase,
            styles.secondary,
            sizeStyle,
            disabled && styles.disabled,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              {icon && !iconRight && (
                <MaterialIcons name={icon} size={iconSize} color={COLORS.primary} />
              )}
              <Text style={[styles.buttonText, styles.secondaryText, { fontSize: textSize }]}>
                {title}
              </Text>
              {iconRight && (
                <MaterialIcons name={iconRight} size={iconSize} color={COLORS.primary} />
              )}
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Ghost variant
  return (
    <Animated.View style={[{ transform: [{ scale }], opacity }, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.95}
        style={[
          styles.buttonBase,
          styles.ghost,
          sizeStyle,
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon && !iconRight && (
          <MaterialIcons name={icon} size={iconSize} color={COLORS.textSecondary} />
        )}
        <Text style={[styles.buttonText, styles.ghostText, { fontSize: textSize }]}>
          {title}
        </Text>
        {iconRight && (
          <MaterialIcons name={iconRight} size={iconSize} color={COLORS.textSecondary} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    ...RTL_ROW_CENTER,
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryText: {
    color: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: COLORS.textSecondary,
  },
  disabled: {
    opacity: 0.5,
  },
});
