import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import { COLORS } from '../config/theme';

export default function AnimatedAthlete({ size = 200 }) {
  const bounce = useRef(new Animated.Value(0)).current;
  const armRotation = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Bouncing motion
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Arm lifting motion (curling weights)
    Animated.loop(
      Animated.sequence([
        Animated.timing(armRotation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(armRotation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const armRotate = armRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.glow, { opacity: glow }]}>
        <Svg width={size * 1.2} height={size * 1.2} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.5" />
              <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="50" r="45" fill="url(#glowGradient)" />
        </Svg>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateY }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 120">
          <Defs>
            <LinearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={COLORS.primaryDark} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFD4B8" stopOpacity="1" />
              <Stop offset="100%" stopColor="#E8B79A" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Shadow ellipse */}
          <Ellipse cx="50" cy="115" rx="20" ry="3" fill="rgba(0,0,0,0.3)" />

          {/* Legs */}
          <Path
            d="M 42 85 L 40 110 L 46 110 L 48 85 Z"
            fill={COLORS.surfaceLight}
          />
          <Path
            d="M 52 85 L 54 110 L 60 110 L 58 85 Z"
            fill={COLORS.surfaceLight}
          />

          {/* Body/torso */}
          <Path
            d="M 38 50 Q 35 75 42 88 L 58 88 Q 65 75 62 50 Q 60 45 50 45 Q 40 45 38 50 Z"
            fill="url(#bodyGrad)"
          />

          {/* Muscles highlight */}
          <Path
            d="M 44 55 Q 43 65 45 75 Q 47 73 47 65 Q 47 58 44 55 Z"
            fill="rgba(255,255,255,0.15)"
          />
          <Path
            d="M 56 55 Q 57 65 55 75 Q 53 73 53 65 Q 53 58 56 55 Z"
            fill="rgba(255,255,255,0.15)"
          />

          {/* Head */}
          <Circle cx="50" cy="32" r="12" fill="url(#skinGrad)" />

          {/* Hair */}
          <Path
            d="M 40 28 Q 38 22 45 20 Q 50 18 55 20 Q 62 22 60 28 Q 58 24 50 24 Q 42 24 40 28 Z"
            fill="#3D2817"
          />

          {/* Eyes */}
          <Circle cx="46" cy="32" r="1" fill="#1A1A1A" />
          <Circle cx="54" cy="32" r="1" fill="#1A1A1A" />

          {/* Smile */}
          <Path
            d="M 46 37 Q 50 39 54 37"
            stroke="#1A1A1A"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Left arm static (holding weight) */}
          <Path
            d="M 38 55 L 30 70 L 28 72"
            stroke="url(#skinGrad)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          {/* Left dumbbell */}
          <Path
            d="M 22 70 L 22 76 M 26 68 L 26 78 M 30 70 L 30 76"
            stroke={COLORS.text}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Right arm animated (curling) */}
        </Svg>

        <Animated.View
          style={[
            styles.armContainer,
            {
              transform: [
                { translateX: size * 0.6 },
                { translateY: size * 0.45 },
                { rotate: armRotate },
              ],
            },
          ]}
        >
          <Svg width={size * 0.3} height={size * 0.4} viewBox="0 0 30 50">
            {/* Right arm */}
            <Path
              d="M 5 5 L 15 25 L 18 30"
              stroke="url(#skinGrad2)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <Defs>
              <LinearGradient id="skinGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFD4B8" stopOpacity="1" />
                <Stop offset="100%" stopColor="#E8B79A" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            {/* Right dumbbell */}
            <Path
              d="M 12 28 L 12 34 M 16 26 L 16 36 M 20 28 L 20 34"
              stroke={COLORS.text}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
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
    top: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  armContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
