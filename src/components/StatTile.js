import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

/**
 * Metric tile — icon chip, giant numeral, label, optional progress bar.
 * Colour comes from the domain (see DOMAIN in theme.js), never decorative.
 */
export default function StatTile({
  icon,
  value,
  unit,
  label,
  color = COLORS.primary,
  soft,
  progress,
  onPress,
  style,
}) {
  const body = (
    <View style={[styles.tile, style]}>
      <View style={styles.top}>
        <View style={[styles.iconChip, { backgroundColor: soft || `${color}1A` }]}>
          <MaterialIcons name={icon} size={18} color={color} />
        </View>
        {progress !== undefined && (
          <Text style={[styles.pct, { color }]}>
            {Math.round(Math.min(progress, 1) * 100)}%
          </Text>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
        {!!unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>

      {progress !== undefined && (
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.min(Math.max(progress, 0), 1) * 100}%`, backgroundColor: color },
            ]}
          />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ flex: 1 }}>
        {body}
      </TouchableOpacity>
    );
  }
  return body;
}

/** Large screen title with optional right-side action button. */
export function ScreenHeader({ title, subtitle, actionIcon, onAction, style }) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {!!actionIcon && (
        <TouchableOpacity
          style={styles.headerAction}
          onPress={onAction}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name={actionIcon} size={22} color={COLORS.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Small section label with a thin rule — separates blocks without shouting. */
export function SectionTitle({ children, action, onAction }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {!!action && (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 118,
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  top: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    fontSize: FONTS.tiny,
    fontWeight: '800',
  },
  valueRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 4,
    marginTop: SPACING.sm,
  },
  value: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  unit: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    fontWeight: '700',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    fontWeight: '600',
    marginTop: 2,
  },
  track: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: FONTS.title,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    fontWeight: '500',
    marginTop: 2,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },

  sectionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
  },
  sectionAction: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: '700',
  },
});
