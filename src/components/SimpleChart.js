import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';

export default function SimpleChart({ data, label, height = 150, color = COLORS.primary }) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>אין נתונים להצגה</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.chartArea, { height }]}>
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{maxVal.toFixed(1)}</Text>
          <Text style={styles.yLabel}>{((maxVal + minVal) / 2).toFixed(1)}</Text>
          <Text style={styles.yLabel}>{minVal.toFixed(1)}</Text>
        </View>
        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const barHeight = ((item.value - minVal) / range) * (height - 40) + 20;
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: color,
                      },
                    ]}
                  />
                  <View style={[styles.dot, { backgroundColor: color }]} />
                </View>
                <Text style={styles.xLabel} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
  },
  label: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  chartArea: {
    flexDirection: 'row',
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginStart: SPACING.sm,
  },
  yLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 6,
    borderRadius: 3,
    minHeight: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: -3,
  },
  xLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.regular,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
});
