import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, I18nManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function HomeScreen({ navigation }) {
  const menuItems = [
    { title: 'תכנית התזונה שלי', icon: 'restaurant', screen: 'NutritionTab', color: COLORS.primary },
    { title: 'מעקב משקלי בוקר', icon: 'monitor-weight', screen: 'WeightTracking', color: COLORS.primary },
    { title: 'תוכנית האימונים שלי', icon: 'fitness-center', screen: 'WorkoutTab', color: COLORS.primary },
    { title: 'הפרופיל שלי', icon: 'person', screen: 'Profile', color: COLORS.primary },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <MaterialIcons name="fitness-center" size={40} color={COLORS.primary} />
          <Text style={styles.logoText}>SMIT GYM</Text>
        </View>
        <Text style={styles.welcome}>ברוך הבא</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <MaterialIcons name={item.icon} size={48} color={item.color} />
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomLinks}>
        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('AIChat')}
        >
          <MaterialIcons name="smart-toy" size={24} color={COLORS.primary} />
          <Text style={styles.linkText}>שאל את המאמן AI</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    color: COLORS.primary,
    fontSize: FONTS.title,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
    letterSpacing: 3,
  },
  welcome: {
    color: COLORS.text,
    fontSize: FONTS.large,
    marginTop: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  menuItem: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  bottomLinks: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  link: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  linkText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
  },
});
