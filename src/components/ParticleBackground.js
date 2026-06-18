import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../config/theme';
import { USE_NATIVE_DRIVER } from '../utils/animation';

const { width, height } = Dimensions.get('window');

function Particle({ delay = 0, size = 4, color = COLORS.primary, opacity = 0.3 }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const startX = Math.random() * width;
  const startY = Math.random() * height;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(0);
      translateX.setValue(0);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: opacity,
            duration: 1000,
            useNativeDriver: USE_NATIVE_DRIVER,
            delay,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.timing(translateY, {
          toValue: -150 - Math.random() * 100,
          duration: 4000,
          useNativeDriver: USE_NATIVE_DRIVER,
          delay,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 80,
          duration: 4000,
          useNativeDriver: USE_NATIVE_DRIVER,
          delay,
        }),
      ]).start(() => animate());
    };

    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: opacityAnim,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    />
  );
}

export default function ParticleBackground({ count = 15, color = COLORS.primary }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: i * 300,
    size: 3 + Math.random() * 5,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p) => (
        <Particle key={p.id} delay={p.delay} size={p.size} color={color} opacity={0.2 + Math.random() * 0.3} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
});
