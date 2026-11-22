import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { RTL_ICONS } from '../utils/rtl';

/** Shared, keyboard-friendly authentication layout. Built for a phone first. */
export default function AuthShell({ children, title, onBack }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.scroll, {
          paddingTop: Math.max(insets.top + SPACING.lg, SPACING.xl),
          paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
        }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>
          <View style={styles.brand}>
            <View style={styles.mark}>
              <MaterialIcons name="fitness-center" size={28} color={COLORS.primaryDark} />
            </View>
            <View>
              <Text style={styles.brandName}>SMIT GYM</Text>
              <Text style={styles.tagline}>המאמן האישי שלך</Text>
            </View>
          </View>
          <View style={styles.form}>
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>{title}</Text>
              {onBack && <TouchableOpacity accessibilityRole="button" accessibilityLabel="חזרה" onPress={onBack} style={authStyles.iconButton}>
                <MaterialIcons name={RTL_ICONS.back} size={22} color={COLORS.text} />
              </TouchableOpacity>}
            </View>
            {children}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const authStyles = StyleSheet.create({
  label: { color: COLORS.textSecondary, fontSize: FONTS.small, fontWeight: '600', textAlign: 'right', marginBottom: SPACING.sm },
  field: {
    flexDirection: 'row', direction: 'rtl', alignItems: 'center', minHeight: 56,
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg, gap: SPACING.sm,
  },
  fieldFocused: { borderColor: COLORS.primaryDark, backgroundColor: COLORS.surface },
  input: { flex: 1, minWidth: 0, color: COLORS.text, fontSize: FONTS.regular, paddingVertical: SPACING.md, textAlign: 'right' },
  ltrInput: { direction: 'ltr', writingDirection: 'ltr', textAlign: 'left' },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  primaryButton: {
    minHeight: 56, flexDirection: 'row', direction: 'rtl', gap: SPACING.sm,
    alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryDark, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
  },
  primaryButtonText: { color: COLORS.textOnColor, fontSize: FONTS.regular, fontWeight: '700' },
  secondaryButton: {
    minHeight: 52, flexDirection: 'row', direction: 'rtl', gap: SPACING.sm,
    alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  secondaryButtonText: { color: COLORS.primaryDark, fontSize: FONTS.regular, fontWeight: '600' },
  disabled: { opacity: 0.55 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SPACING.md },
  column: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  brand: { flexDirection: 'row', direction: 'rtl', alignItems: 'center', justifyContent: 'center', gap: SPACING.md, marginBottom: SPACING.xl },
  mark: { width: 56, height: 56, backgroundColor: COLORS.primarySoft, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: COLORS.text, fontSize: FONTS.large, fontWeight: '900', letterSpacing: 1, textAlign: 'right', writingDirection: 'ltr' },
  tagline: { color: COLORS.textSecondary, fontSize: FONTS.small, textAlign: 'right', marginTop: SPACING.xs },
  form: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  heading: { flexDirection: 'row', direction: 'rtl', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  title: { color: COLORS.text, fontSize: FONTS.xlarge, fontWeight: '800', textAlign: 'right', flexShrink: 1 },
});
