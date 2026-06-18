import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Circle, Path, Defs, LinearGradient, Stop, Ellipse, Rect, G,
} from 'react-native-svg';
import { COLORS } from '../config/theme';
import { USE_NATIVE_DRIVER } from '../utils/animation';

/**
 * Animated athlete doing squats with a barbell
 * Body stays connected - no detached limbs
 * Whole body bobs up/down to simulate squat motion
 */
export default function AnimatedAthlete({ size = 200 }) {
  const squat = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Squat down/up animation
    Animated.loop(
      Animated.sequence([
        // Going down (slower, controlled)
        Animated.timing(squat, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        // Hold at bottom briefly
        Animated.delay(150),
        // Going up (slightly faster, explosive)
        Animated.timing(squat, {
          toValue: 0,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        // Hold at top briefly
        Animated.delay(300),
      ])
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(glow, {
          toValue: 0.6,
          duration: 1800,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();
  }, []);

  // Body bobs down during squat
  const bodyTranslateY = squat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 14],
  });

  // Whole body scales slightly when going down (compression)
  const bodyScaleY = squat.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Inner dark mint glow */}
      <Animated.View style={[styles.glow, { opacity: glow }]}>
        <Svg width={size * 1.1} height={size * 1.1} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#0F3D2E" stopOpacity="0.95" />
              <Stop offset="60%" stopColor="#0A2E22" stopOpacity="0.85" />
              <Stop offset="100%" stopColor="#062018" stopOpacity="0.5" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="50" r="45" fill="url(#glowGradient)" />
        </Svg>
      </Animated.View>

      {/* Subtle highlight ring on top of glow */}
      <View style={styles.glowRing}>
        <Svg width={size * 1.1} height={size * 1.1} viewBox="0 0 100 100">
          <Circle
            cx="50"
            cy="50"
            r="45"
            stroke="#1A5942"
            strokeWidth="0.5"
            fill="none"
            opacity="0.6"
          />
        </Svg>
      </View>

      {/* Athlete figure */}
      <Animated.View
        style={{
          transform: [
            { translateY: bodyTranslateY },
            { scaleY: bodyScaleY },
          ],
        }}
      >
        <Svg width={size * 0.75} height={size * 0.85} viewBox="0 0 100 120">
          <Defs>
            <LinearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={COLORS.primaryDark} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#F5C9A8" stopOpacity="1" />
              <Stop offset="100%" stopColor="#E0AB85" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="pantsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#2A2A38" stopOpacity="1" />
              <Stop offset="100%" stopColor="#1A1A24" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Floor shadow */}
          <Ellipse cx="50" cy="115" rx="22" ry="2.5" fill="rgba(0,0,0,0.35)" />

          {/* === Legs (will appear bent during squat) === */}
          {/* Left leg */}
          <Path
            d="M 41 78 L 39 110 L 47 110 L 48 78 Z"
            fill="url(#pantsGrad)"
          />
          {/* Right leg */}
          <Path
            d="M 52 78 L 53 110 L 61 110 L 59 78 Z"
            fill="url(#pantsGrad)"
          />

          {/* Shoe accents */}
          <Rect x="38" y="108" width="10" height="3" rx="1.5" fill={COLORS.primary} />
          <Rect x="52" y="108" width="10" height="3" rx="1.5" fill={COLORS.primary} />

          {/* === Body/torso === */}
          <Path
            d="M 36 48 Q 33 65 38 80 L 62 80 Q 67 65 64 48 Q 60 43 50 43 Q 40 43 36 48 Z"
            fill="url(#shirtGrad)"
          />

          {/* Muscle definition - chest */}
          <Path
            d="M 42 52 Q 41 60 44 68 Q 47 67 47 60 Q 47 54 42 52 Z"
            fill="rgba(255,255,255,0.12)"
          />
          <Path
            d="M 58 52 Q 59 60 56 68 Q 53 67 53 60 Q 53 54 58 52 Z"
            fill="rgba(255,255,255,0.12)"
          />

          {/* Shirt collar */}
          <Path
            d="M 44 44 Q 50 47 56 44 L 56 48 Q 50 50 44 48 Z"
            fill="rgba(0,0,0,0.2)"
          />

          {/* === Arms holding barbell (symmetric, connected to body) === */}
          {/* Left arm */}
          <Path
            d="M 36 50 Q 28 55 24 62 L 22 64 Q 26 70 30 64 Q 33 58 38 54 Z"
            fill="url(#skinGrad)"
          />
          {/* Left hand */}
          <Circle cx="22" cy="63" r="3.5" fill="url(#skinGrad)" />

          {/* Right arm */}
          <Path
            d="M 64 50 Q 72 55 76 62 L 78 64 Q 74 70 70 64 Q 67 58 62 54 Z"
            fill="url(#skinGrad)"
          />
          {/* Right hand */}
          <Circle cx="78" cy="63" r="3.5" fill="url(#skinGrad)" />

          {/* === BARBELL - held horizontally in front === */}
          {/* Bar */}
          <Rect x="18" y="62" width="64" height="2.5" rx="1.25" fill="#3A3A48" />
          <Rect x="18" y="61.5" width="64" height="1" fill="#6A6A78" />

          {/* Left weights */}
          <Rect x="10" y="57" width="3" height="13" rx="0.5" fill="#1A1A24" />
          <Rect x="13" y="55" width="4" height="17" rx="0.5" fill="#2A2A38" />

          {/* Right weights */}
          <Rect x="83" y="57" width="3" height="13" rx="0.5" fill="#1A1A24" />
          <Rect x="87" y="55" width="4" height="17" rx="0.5" fill="#2A2A38" />

          {/* === Head === */}
          {/* Hair (back layer) */}
          <Path
            d="M 38 28 Q 38 18 50 16 Q 62 18 62 28 Q 62 32 60 33 Q 58 28 50 28 Q 42 28 40 33 Q 38 32 38 28 Z"
            fill="#3D2817"
          />

          {/* Face */}
          <Circle cx="50" cy="32" r="11" fill="url(#skinGrad)" />

          {/* Hair (front layer) - covers top of face slightly */}
          <Path
            d="M 39 27 Q 42 24 46 24 Q 50 22 54 24 Q 58 24 61 27 Q 60 30 56 29 Q 53 27 50 27 Q 47 27 44 29 Q 40 30 39 27 Z"
            fill="#3D2817"
          />

          {/* Eyes (focused, determined) */}
          <Ellipse cx="46" cy="32" rx="0.9" ry="1.2" fill="#1A1A1A" />
          <Ellipse cx="54" cy="32" rx="0.9" ry="1.2" fill="#1A1A1A" />

          {/* Eyebrows - determined look */}
          <Path
            d="M 44 30 L 48 29.5"
            stroke="#3D2817"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <Path
            d="M 52 29.5 L 56 30"
            stroke="#3D2817"
            strokeWidth="0.8"
            strokeLinecap="round"
          />

          {/* Mouth - slight smile of effort */}
          <Path
            d="M 47 37 Q 50 38 53 37"
            stroke="#1A1A1A"
            strokeWidth="0.7"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
