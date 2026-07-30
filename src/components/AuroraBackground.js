import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../config/theme';

/**
 * Screen backdrop.
 *
 * In the light "sport" theme the background is deliberately QUIET — the data
 * (rings, numbers, category colour) carries the visual weight, not the canvas.
 * This renders the neutral page colour with an almost imperceptible warm wash
 * at the top so large screens don't feel flat.
 *
 * Kept under the original name/props so every screen that already imports it
 * keeps working.
 *
 * @param {number} intensity 0..1 — how visible the top wash is (default subtle)
 */
export default function AuroraBackground({ intensity = 0.5 }) {
  const wash = Math.max(0, Math.min(1, intensity)) * 0.05;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.base} />
      <LinearGradient
        colors={[
          `rgba(255,55,95,${wash})`,
          `rgba(191,90,242,${wash * 0.5})`,
          'rgba(255,255,255,0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={styles.wash}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
});
