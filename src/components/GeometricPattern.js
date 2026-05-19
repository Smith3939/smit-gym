import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Defs, Pattern, Rect, G } from 'react-native-svg';
import { COLORS } from '../config/theme';

/**
 * Geometric pattern background overlay
 * Adds subtle visual texture to cards/screens
 */
export default function GeometricPattern({
  type = 'dots',
  color = COLORS.primary,
  opacity = 0.1,
  size = 200,
}) {
  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          {type === 'dots' && (
            <Pattern id="dotsPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <Circle cx="10" cy="10" r="1.5" fill={color} opacity={opacity} />
            </Pattern>
          )}
          {type === 'grid' && (
            <Pattern id="gridPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <Path d="M 30 0 L 0 0 0 30" stroke={color} strokeWidth="0.5" fill="none" opacity={opacity} />
            </Pattern>
          )}
          {type === 'lines' && (
            <Pattern id="linesPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <Line x1="0" y1="10" x2="20" y2="10" stroke={color} strokeWidth="1" opacity={opacity} />
            </Pattern>
          )}
          {type === 'waves' && (
            <Pattern id="wavesPattern" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
              <Path d="M 0 10 Q 10 0 20 10 T 40 10" stroke={color} strokeWidth="1" fill="none" opacity={opacity} />
            </Pattern>
          )}
          {type === 'circles' && (
            <Pattern id="circlesPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <Circle cx="20" cy="20" r="8" stroke={color} strokeWidth="0.5" fill="none" opacity={opacity} />
            </Pattern>
          )}
          {type === 'hexagon' && (
            <Pattern id="hexPattern" x="0" y="0" width="30" height="26" patternUnits="userSpaceOnUse">
              <Path
                d="M 15 0 L 30 8 L 30 22 L 15 30 L 0 22 L 0 8 Z"
                stroke={color}
                strokeWidth="0.5"
                fill="none"
                opacity={opacity}
              />
            </Pattern>
          )}
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill={`url(#${type}Pattern)`} />
      </Svg>
    </View>
  );
}

/**
 * Animated decorative blob - floating gradient shape
 */
export function DecorativeBlob({ size = 100, color = COLORS.primary, top, left, right, bottom, opacity = 0.4 }) {
  const position = {};
  if (top !== undefined) position.top = top;
  if (left !== undefined) position.left = left;
  if (right !== undefined) position.right = right;
  if (bottom !== undefined) position.bottom = bottom;

  return (
    <View style={[styles.blob, position, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <Pattern id="blobGrad" x="0" y="0" width="100%" height="100%">
            <Circle cx="50" cy="50" r="50" fill={color} opacity={opacity} />
          </Pattern>
        </Defs>
        <Path
          d="M 50 10 Q 80 20 85 50 Q 90 80 50 90 Q 10 85 15 50 Q 20 15 50 10 Z"
          fill={color}
          opacity={opacity}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  blob: {
    position: 'absolute',
  },
});
