import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS } from '../config/theme';
import { USE_NATIVE_DRIVER } from '../utils/animation';

const { width, height } = Dimensions.get('window');

/**
 * Animated aurora background with floating gradient blobs
 * Creates a modern, flowing aesthetic
 */
export default function AuroraBackground({ intensity = 0.5 }) {
  const blob1Move = useRef(new Animated.Value(0)).current;
  const blob2Move = useRef(new Animated.Value(0)).current;
  const blob3Move = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateBlob = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ])
      ).start();
    };

    animateBlob(blob1Move, 8000);
    animateBlob(blob2Move, 12000);
    animateBlob(blob3Move, 10000);
  }, []);

  const blob1X = blob1Move.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });
  const blob1Y = blob1Move.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  const blob2X = blob2Move.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });
  const blob2Y = blob2Move.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  const blob3X = blob3Move.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });
  const blob3Y = blob3Move.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={['#060912', '#0A0E1A', '#060912']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Pink blob - top right */}
      <Animated.View
        style={[
          styles.blob,
          {
            top: -100,
            right: -100,
            opacity: intensity,
            transform: [{ translateX: blob1X }, { translateY: blob1Y }],
          },
        ]}
      >
        <Svg width={400} height={400}>
          <Defs>
            <RadialGradient id="blob1Grad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.5" />
              <Stop offset="50%" stopColor={COLORS.primary} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="200" cy="200" r="200" fill="url(#blob1Grad)" />
        </Svg>
      </Animated.View>

      {/* Purple blob - bottom left */}
      <Animated.View
        style={[
          styles.blob,
          {
            bottom: -100,
            left: -100,
            opacity: intensity,
            transform: [{ translateX: blob2X }, { translateY: blob2Y }],
          },
        ]}
      >
        <Svg width={400} height={400}>
          <Defs>
            <RadialGradient id="blob2Grad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={COLORS.tertiary} stopOpacity="0.5" />
              <Stop offset="50%" stopColor={COLORS.tertiary} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={COLORS.tertiary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="200" cy="200" r="200" fill="url(#blob2Grad)" />
        </Svg>
      </Animated.View>

      {/* Cyan blob - middle */}
      <Animated.View
        style={[
          styles.blob,
          {
            top: height * 0.3,
            left: width * 0.4,
            opacity: intensity * 0.7,
            transform: [{ translateX: blob3X }, { translateY: blob3Y }],
          },
        ]}
      >
        <Svg width={300} height={300}>
          <Defs>
            <RadialGradient id="blob3Grad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={COLORS.secondary} stopOpacity="0.4" />
              <Stop offset="50%" stopColor={COLORS.secondary} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={COLORS.secondary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="150" cy="150" r="150" fill="url(#blob3Grad)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
  },
});
