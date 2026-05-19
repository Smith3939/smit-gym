import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, I18nManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { FadeInView, AnimatedCard } from '../components/AnimatedCard';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function HomeScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const displayName = userProfile?.name || user?.displayName || '';

  const menuItems = [
    { title: 'תכנית התזונה שלי', icon: 'restaurant', screen: 'NutritionTab', subtitle: 'תפריט וקלוריות' },
    { title: 'מעקב משקלי בוקר', icon: 'monitor-weight', screen: 'WeightTracking', subtitle: 'שקילה יומית' },
    { title: 'תוכנית האימונים שלי', icon: 'fitness-center', screen: 'WorkoutTab', subtitle: 'אימוני A/B/בטן' },
    { title: 'הפרופיל שלי', icon: 'person', screen: 'Profile', subtitle: 'פרטים אישיים' },
  ];

  const quickLinks = [
    { title: 'שאל את המאמן AI', icon: 'smart-toy', screen: 'AIChat' },
    { title: 'ספריית תרגילים', icon: 'list-alt', screen: 'ExerciseLibrary' },
    { title: 'מעקב מים', icon: 'water-drop', screen: 'WaterTracking' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="settings" size={26} color={COLORS.textMuted} />
      </TouchableOpacity>

      <FadeInView style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIconBg}>
            <MaterialIcons name="fitness-center" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.logoText}>SMIT GYM</Text>
        </View>
        <Text style={styles.welcome}>ברוך הבא{displayName ? ',' : ''}</Text>
        {displayName ? <Text style={styles.userName}>{displayName}</Text> : null}
      </FadeInView>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <AnimatedCard
            key={index}
            onPress={() => navigation.navigate(item.screen)}
            style={styles.menuItem}
            delay={100 + index * 80}
          >
            <View style={styles.menuIconBg}>
              <MaterialIcons name={item.icon} size={42} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
            <Text style={styles.menuSubtext}>{item.subtitle}</Text>
          </AnimatedCard>
        ))}
      </View>

      <FadeInView delay={500} style={styles.bottomLinks}>
        <Text style={styles.sectionLabel}>גישה מהירה</Text>
        {quickLinks.map((link, index) => (
          <TouchableOpacity
            key={index}
            style={styles.link}
            onPress={() => navigation.navigate(link.screen)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={22} color={COLORS.textMuted} />
            <Text style={styles.linkText}>{link.title}</Text>
            <MaterialIcons name={link.icon} size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ))}
      </FadeInView>
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
    paddingTop: SPACING.xxl + SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  settingsButton: {
    position: 'absolute',
    top: SPACING.xxl,
    left: SPACING.lg,
    zIndex: 1,
    padding: SPACING.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  logoText: {
    color: COLORS.primary,
    fontSize: FONTS.title,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
    letterSpacing: 4,
  },
  welcome: {
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
    marginTop: SPACING.md,
  },
  userName: {
    color: COLORS.primary,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
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
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  menuText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '700',
    textAlign: 'center',
  },
  menuSubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'center',
    marginTop: 4,
  },
  bottomLinks: {
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  link: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  linkText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});
