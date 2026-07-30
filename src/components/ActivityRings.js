import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { USE_NATIVE_DRIVER } from '../utils/animation';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Concentric activity rings — the signature data visual of the app.
 *
 * @param {Array} rings  [{ key, progress 0..1, colors:[from,to], label, value }]
 *                       Outer ring first.
 * @param {number} size  overall diameter
 */
export default function ActivityRings({
  rings = [],
  size = 180,
  strokeWidth = 14,
  gap = 6,
  children,
}) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          {rings.map((r, i) => (
            <LinearGradient key={`g${i}`} id={`ring-${r.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={r.colors[0]} />
              <Stop offset="100%" stopColor={r.colors[1] || r.colors[0]} />
            </LinearGradient>
          ))}
        </Defs>
        {rings.map((r, i) => (
          <Ring
            key={r.key}
            index={i}
            size={size}
            strokeWidth={strokeWidth}
            gap={gap}
            progress={r.progress}
            gradientId={`ring-${r.key}`}
          />
        ))}
      </Svg>

      {!!children && <View style={styles.center}>{children}</View>}
    </View>
  );
}

function Ring({ index, size, strokeWidth, gap, progress, gradientId }) {
  const radius = size / 2 - strokeWidth / 2 - index * (strokeWidth + gap);
  const circumference = radius * 2 * Math.PI;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(progress || 0, 1)),
      duration: 1100,
      delay: index * 120,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  if (radius <= 0) return null;

  return (
    <>
      {/* track */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={COLORS.surfaceLight}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* progress */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </>
  );
}

/** Legend rows that pair with the rings (dot + label + value). */
export function RingLegend({ rings }) {
  return (
    <View style={styles.legend}>
      {rings.map((r) => (
        <View key={r.key} style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: r.colors[0] }]} />
          <View style={styles.legendText}>
            <Text style={styles.legendValue} numberOfLines={1}>{r.value}</Text>
            <Text style={styles.legendLabel} numberOfLines={1}>{r.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    gap: SPACING.md,
  },
  legendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    alignItems: 'flex-end',
  },
  legendValue: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '800',
  },
  legendLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    fontWeight: '600',
  },
});
