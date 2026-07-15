import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';

/**
 * User avatar - shows the profile photo (base64 data-URI) or a fallback icon.
 */
export default function Avatar({ photo, size = 44, borderColor = COLORS.primary }) {
  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2, borderColor },
        ]}
      />
    );
  }
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, borderColor },
      ]}
    >
      <MaterialIcons name="person" size={size * 0.55} color={COLORS.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 1.5,
  },
  fallback: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
