import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  I18nManager, Dimensions, Animated, Easing,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS, FONTS, SPACING, BORDER_RADIUS, GRADIENTS, SHADOWS,
} from '../config/theme';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import ProgressRing from '../components/ProgressRing';
import ParticleBackground from '../components/ParticleBackground';
import AnimatedAthlete from '../components/AnimatedAthlete';
import { FadeInView } from '../components/AnimatedCard';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

const MOTIVATIONAL_QUOTES = [
  'הצלחה היא סכום של מאמצים קטנים שחוזרים על עצמם 💪',
  'המאמן הכי טוב שלך - זה אתה! 🏆',
  'גוף בריא, נפש בריאה ✨',
  'כל אימון הוא ניצחון 🔥',
  'תתחיל היום - תודה לעצמך מחר 🚀',
  'התקדמות, לא שלמות 🎯',
];

function StatCard({ icon, label, value, unit, color, delay, progress, gradient }) {
  return (
    <GlassCard
      style={styles.statCard}
      gradientColors={gradient}
      delay={delay}
    >
      <View style={styles.statCardContent}>
        <View style={[styles.statIconBg, { backgroundColor: color + '20' }]}>
          <MaterialIcons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
        <Text style={styles.statLabel}>{label}</Text>

        {progress !== undefined && (
          <View style={styles.statProgressBg}>
            <View style={[styles.statProgressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color }]} />
          </View>
        )}
      </View>
    </GlassCard>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const displayName = userProfile?.name || user?.displayName || 'מתאמן';
  const firstName = displayName.split(' ')[0];

  const [quote] = useState(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'בוקר טוב' : greetingHour < 18 ? 'צהריים טובים' : 'ערב טוב';

  // Calculate stats
  const weight = parseFloat(userProfile?.weight) || 0;
  const targetCal = userProfile?.dailyCalories || 2000;
  const consumedCal = 0; // TODO: from real data
  const workoutsThisWeek = 3; // TODO: from real data
  const stepsToday = 0; // TODO: from real data
  const waterToday = 0; // TODO: from real data
  const waterGoal = (userProfile?.waterGoal || 3.5) * 1000;

  const menuItems = [
    {
      title: 'תזונה',
      subtitle: 'תפריט יומי',
      icon: 'restaurant',
      screen: 'NutritionTab',
      gradient: GRADIENTS.cardGreen,
      iconColor: COLORS.success,
    },
    {
      title: 'אימונים',
      subtitle: 'A · B · בטן',
      icon: 'fitness-center',
      screen: 'WorkoutTab',
      gradient: GRADIENTS.cardOrange,
      iconColor: COLORS.primary,
    },
    {
      title: 'משקל',
      subtitle: 'מעקב יומי',
      icon: 'monitor-weight',
      screen: 'WeightTracking',
      gradient: GRADIENTS.cardPurple,
      iconColor: COLORS.tertiary,
    },
    {
      title: 'מים',
      subtitle: 'שתייה יומית',
      icon: 'water-drop',
      screen: 'WaterTracking',
      gradient: GRADIENTS.cardBlue,
      iconColor: COLORS.accent,
    },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0F0F14', '#1A1A23', '#0F0F14']}
        style={StyleSheet.absoluteFillObject}
      />

      <ParticleBackground count={12} color={COLORS.primary} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeInView style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialIcons name="settings" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.notifBtn}>
            <MaterialIcons name="notifications" size={24} color={COLORS.textSecondary} />
            <View style={styles.notifDot} />
          </View>
        </FadeInView>

        {/* Hero greeting */}
        <FadeInView delay={100} style={styles.heroSection}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
            <Text style={styles.quote}>{quote}</Text>
          </View>
          <View style={styles.athleteContainer}>
            <AnimatedAthlete size={140} />
          </View>
        </FadeInView>

        {/* Daily progress hero card */}
        <GlassCard
          style={styles.heroCard}
          gradientColors={['rgba(255,107,53,0.25)', 'rgba(160,108,213,0.15)']}
          borderColor="rgba(255,107,53,0.3)"
          delay={200}
          glow
        >
          <View style={styles.heroCardContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>היום</Text>
              <Text style={styles.heroBigNumber}>{workoutsThisWeek}</Text>
              <Text style={styles.heroSubtext}>אימונים השבוע</Text>

              <View style={styles.streakBadge}>
                <MaterialIcons name="local-fire-department" size={16} color={COLORS.secondary} />
                <Text style={styles.streakText}>3 ימי רצף</Text>
              </View>
            </View>

            <View style={styles.heroRight}>
              <ProgressRing
                size={130}
                strokeWidth={12}
                progress={workoutsThisWeek / 5}
                gradientId="heroRing"
                gradientColors={[COLORS.primary, COLORS.tertiary]}
              >
                <Text style={styles.ringPercent}>{Math.round((workoutsThisWeek / 5) * 100)}%</Text>
                <Text style={styles.ringLabel}>מהיעד</Text>
              </ProgressRing>
            </View>
          </View>
        </GlassCard>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="local-fire-department"
            value={consumedCal}
            unit={`/ ${targetCal} קל`}
            label="קלוריות היום"
            color={COLORS.primary}
            gradient={GRADIENTS.cardOrange}
            progress={consumedCal / targetCal}
            delay={300}
          />
          <StatCard
            icon="water-drop"
            value={(waterToday / 1000).toFixed(1)}
            unit={`/ ${(waterGoal / 1000).toFixed(1)} ל'`}
            label="מים"
            color={COLORS.accent}
            gradient={GRADIENTS.cardBlue}
            progress={waterToday / waterGoal}
            delay={400}
          />
          <StatCard
            icon="directions-walk"
            value={stepsToday}
            unit="צעדים"
            label={`יעד: ${userProfile?.stepGoal || 12000}`}
            color={COLORS.success}
            gradient={GRADIENTS.cardGreen}
            progress={stepsToday / (userProfile?.stepGoal || 12000)}
            delay={500}
          />
          <StatCard
            icon="monitor-weight"
            value={weight || '--'}
            unit={weight ? 'ק"ג' : ''}
            label="משקל נוכחי"
            color={COLORS.tertiary}
            gradient={GRADIENTS.cardPurple}
            delay={600}
          />
        </View>

        {/* Quick access menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>גישה מהירה</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <GlassCard
                key={index}
                onPress={() => navigation.navigate(item.screen)}
                style={styles.menuCard}
                gradientColors={item.gradient}
                borderColor={item.iconColor + '30'}
                delay={700 + index * 100}
              >
                <View style={styles.menuCardInner}>
                  <View style={[styles.menuIconBg, { backgroundColor: item.iconColor + '20' }]}>
                    <MaterialIcons name={item.icon} size={32} color={item.iconColor} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  <View style={styles.menuArrow}>
                    <MaterialIcons name="chevron-left" size={20} color={item.iconColor} />
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* AI Coach CTA */}
        <GlassCard
          onPress={() => navigation.navigate('AIChat')}
          gradientColors={['rgba(160,108,213,0.25)', 'rgba(91,192,235,0.15)']}
          borderColor="rgba(160,108,213,0.4)"
          delay={1100}
          style={styles.aiCard}
          glow
        >
          <View style={styles.aiCardInner}>
            <View style={styles.aiIconBg}>
              <MaterialIcons name="smart-toy" size={36} color={COLORS.tertiary} />
            </View>
            <View style={styles.aiContent}>
              <Text style={styles.aiTitle}>המאמן AI שלך</Text>
              <Text style={styles.aiSubtitle}>שאל אותי על תזונה, תרגילים, מוטיבציה</Text>
            </View>
            <MaterialIcons name="chevron-left" size={28} color={COLORS.tertiary} />
          </View>
        </GlassCard>

        {/* Exercise library link */}
        <GlassCard
          onPress={() => navigation.navigate('ExerciseLibrary')}
          delay={1200}
          style={styles.libraryCard}
        >
          <View style={styles.libraryInner}>
            <MaterialIcons name="library-books" size={28} color={COLORS.text} />
            <Text style={styles.libraryText}>ספריית התרגילים המלאה</Text>
            <MaterialIcons name="chevron-left" size={24} color={COLORS.textMuted} />
          </View>
        </GlassCard>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl + SPACING.md,
  },
  topBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  heroSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greetingBlock: {
    flex: 1,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
    textAlign: 'right',
  },
  userName: {
    color: COLORS.text,
    fontSize: FONTS.hero,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  quote: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  athleteContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  heroCardContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    alignItems: 'flex-end',
  },
  heroRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: '600',
    letterSpacing: 1,
  },
  heroBigNumber: {
    color: COLORS.text,
    fontSize: 56,
    fontWeight: '900',
    marginTop: SPACING.xs,
    lineHeight: 60,
  },
  heroSubtext: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
  streakBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,182,39,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    marginTop: SPACING.md,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,182,39,0.3)',
  },
  streakText: {
    color: COLORS.secondary,
    fontSize: FONTS.tiny,
    fontWeight: '700',
  },
  ringPercent: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
  },
  ringLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    padding: SPACING.md,
  },
  statCardContent: {
    alignItems: 'flex-end',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
  },
  statUnit: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 2,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  statProgressBg: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  statProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: SPACING.md,
  },
  menuGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  menuCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    padding: 0,
  },
  menuCardInner: {
    padding: SPACING.md,
    alignItems: 'flex-end',
    position: 'relative',
  },
  menuIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  menuTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  menuSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 2,
  },
  menuArrow: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
  },
  aiCard: {
    marginBottom: SPACING.md,
    padding: 0,
  },
  aiCardInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  aiIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(160,108,213,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  aiTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  aiSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    marginTop: 2,
    textAlign: 'right',
  },
  libraryCard: {
    padding: 0,
  },
  libraryInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  libraryText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});
