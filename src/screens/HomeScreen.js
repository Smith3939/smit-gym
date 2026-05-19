import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  I18nManager, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS, FONTS, SPACING, BORDER_RADIUS, GRADIENTS, SHADOWS,
} from '../config/theme';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import ProgressRing from '../components/ProgressRing';
import AuroraBackground from '../components/AuroraBackground';
import AnimatedAthlete from '../components/AnimatedAthlete';
import { FadeInView } from '../components/AnimatedCard';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

const MOTIVATIONAL_QUOTES = [
  'הצלחה היא סכום של מאמצים קטנים שחוזרים על עצמם',
  'המאמן הכי טוב שלך - זה אתה',
  'גוף בריא, נפש בריאה',
  'כל אימון הוא ניצחון',
  'התקדמות, לא שלמות',
];

function StatPill({ icon, value, unit, label, color, gradient, progress }) {
  return (
    <GlassCard
      style={styles.statPill}
      gradientColors={gradient}
      borderColor={color + '30'}
    >
      <View style={styles.statPillTop}>
        <View style={[styles.statIconCircle, { backgroundColor: color + '20' }]}>
          <MaterialIcons name={icon} size={18} color={color} />
        </View>
        {progress !== undefined && (
          <Text style={[styles.statPercent, { color }]}>{Math.round(progress * 100)}%</Text>
        )}
      </View>

      <View style={styles.statPillBottom}>
        <View style={styles.statValueRow}>
          <Text style={styles.statValue}>{value}</Text>
          {unit && <Text style={styles.statUnit}>{unit}</Text>}
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>

      {progress !== undefined && (
        <View style={styles.statProgressTrack}>
          <View
            style={[
              styles.statProgressBar,
              { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color },
            ]}
          />
        </View>
      )}
    </GlassCard>
  );
}

function ActionCard({ title, subtitle, icon, gradient, color, onPress, delay }) {
  return (
    <GlassCard
      onPress={onPress}
      gradientColors={gradient}
      borderColor={color + '30'}
      delay={delay}
      style={styles.actionCard}
    >
      <View style={styles.actionCardInner}>
        <View style={[styles.actionIconBg, { backgroundColor: color + '20' }]}>
          <MaterialIcons name={icon} size={26} color={color} />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
        <View style={styles.actionArrow}>
          <MaterialIcons name="arrow-back" size={16} color={color} />
        </View>
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

  // Calculated stats
  const weight = parseFloat(userProfile?.weight) || 0;
  const targetCal = userProfile?.dailyCalories || 2000;
  const consumedCal = 0;
  const workoutsThisWeek = 3;
  const stepsToday = 0;
  const waterToday = 0;
  const waterGoal = (userProfile?.waterGoal || 3.5) * 1000;

  const actions = [
    {
      title: 'תזונה',
      subtitle: 'תפריט יומי',
      icon: 'restaurant',
      screen: 'NutritionTab',
      gradient: GRADIENTS.cardGreen,
      color: COLORS.success,
    },
    {
      title: 'אימונים',
      subtitle: 'A · B · אירובי',
      icon: 'fitness-center',
      screen: 'WorkoutTab',
      gradient: GRADIENTS.cardPink,
      color: COLORS.primary,
    },
    {
      title: 'מתכונים',
      subtitle: 'לפי קלוריות',
      icon: 'menu-book',
      screen: 'RecipeGenerator',
      gradient: GRADIENTS.cardAmber,
      color: COLORS.warning,
    },
    {
      title: 'מים',
      subtitle: 'מעקב יומי',
      icon: 'water-drop',
      screen: 'WaterTracking',
      gradient: GRADIENTS.cardCyan,
      color: COLORS.secondary,
    },
  ];

  return (
    <View style={styles.root}>
      <AuroraBackground intensity={0.6} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <FadeInView style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialIcons name="settings" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.brandPill}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>SMIT GYM</Text>
          </View>

          <View style={styles.iconBtn}>
            <MaterialIcons name="notifications-none" size={20} color={COLORS.textSecondary} />
            <View style={styles.notifIndicator} />
          </View>
        </FadeInView>

        {/* Greeting */}
        <FadeInView delay={100} style={styles.greetingBlock}>
          <Text style={styles.greetingHello}>{greeting},</Text>
          <Text style={styles.greetingName}>{firstName}</Text>
          <Text style={styles.greetingQuote}>{quote}</Text>
        </FadeInView>

        {/* Hero card with progress + athlete */}
        <GlassCard
          delay={200}
          gradientColors={['rgba(255,77,143,0.2)', 'rgba(167,139,250,0.12)']}
          borderColor="rgba(255,77,143,0.3)"
          style={styles.heroCard}
          glow
        >
          <View style={styles.heroCardContent}>
            <View style={styles.heroLeft}>
              <View style={styles.heroStreakBadge}>
                <View style={styles.heroFireDot} />
                <Text style={styles.heroStreakText}>3 ימי רצף</Text>
              </View>
              <Text style={styles.heroHugeNumber}>{workoutsThisWeek}</Text>
              <Text style={styles.heroLabel}>אימונים השבוע</Text>

              <View style={styles.heroDivider} />

              <View style={styles.heroBottomRow}>
                <MaterialIcons name="trending-up" size={14} color={COLORS.success} />
                <Text style={styles.heroPositive}>+15% מהשבוע שעבר</Text>
              </View>
            </View>

            <View style={styles.heroRight}>
              <View style={styles.athleteWrap}>
                <AnimatedAthlete size={130} />
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Quick stats row */}
        <View style={styles.statsRow}>
          <StatPill
            icon="local-fire-department"
            value={consumedCal}
            unit={`/${targetCal}`}
            label="קלוריות"
            color={COLORS.primary}
            gradient={GRADIENTS.cardPink}
            progress={consumedCal / targetCal}
          />
          <StatPill
            icon="water-drop"
            value={(waterToday / 1000).toFixed(1)}
            unit="L"
            label="מים"
            color={COLORS.secondary}
            gradient={GRADIENTS.cardCyan}
            progress={waterToday / waterGoal}
          />
        </View>

        <View style={styles.statsRow}>
          <StatPill
            icon="directions-walk"
            value={stepsToday}
            unit="צעדים"
            label={`יעד: ${(userProfile?.stepGoal || 12000).toLocaleString()}`}
            color={COLORS.accent}
            gradient={GRADIENTS.cardLime}
            progress={stepsToday / (userProfile?.stepGoal || 12000)}
          />
          <StatPill
            icon="monitor-weight"
            value={weight || '--'}
            unit={weight ? 'kg' : ''}
            label="משקל נוכחי"
            color={COLORS.tertiary}
            gradient={GRADIENTS.cardPurple}
          />
        </View>

        {/* Quick actions grid */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>מה תרצה לעשות?</Text>
        </View>

        <View style={styles.actionsGrid}>
          {actions.map((action, idx) => (
            <ActionCard
              key={idx}
              title={action.title}
              subtitle={action.subtitle}
              icon={action.icon}
              gradient={action.gradient}
              color={action.color}
              onPress={() => navigation.navigate(action.screen)}
              delay={600 + idx * 80}
            />
          ))}
        </View>

        {/* AI Coach hero CTA */}
        <GlassCard
          onPress={() => navigation.navigate('AIChat')}
          gradientColors={['rgba(167,139,250,0.25)', 'rgba(34,211,238,0.15)']}
          borderColor="rgba(167,139,250,0.4)"
          delay={1000}
          style={styles.aiCard}
          glow
        >
          <View style={styles.aiCardInner}>
            <LinearGradient
              colors={[COLORS.tertiary, COLORS.secondary]}
              style={styles.aiIconCircle}
            >
              <MaterialIcons name="auto-awesome" size={28} color={COLORS.text} />
            </LinearGradient>

            <View style={styles.aiTextBlock}>
              <View style={styles.aiTitleRow}>
                <Text style={styles.aiTitle}>המאמן AI</Text>
                <View style={styles.aiTag}>
                  <View style={styles.aiTagDot} />
                  <Text style={styles.aiTagText}>חי</Text>
                </View>
              </View>
              <Text style={styles.aiSubtitle}>שאל אותי כל שאלה על תזונה, אימונים, מוטיבציה</Text>
            </View>

            <View style={styles.aiArrow}>
              <MaterialIcons name="arrow-back" size={24} color={COLORS.tertiary} />
            </View>
          </View>
        </GlassCard>

        {/* Bottom utility links */}
        <View style={styles.utilityRow}>
          <TouchableOpacity
            style={styles.utilityCard}
            onPress={() => navigation.navigate('ExerciseLibrary')}
            activeOpacity={0.85}
          >
            <View style={styles.utilityIcon}>
              <MaterialIcons name="library-books" size={20} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.utilityText}>תרגילים</Text>
            <MaterialIcons name="chevron-left" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.utilityCard}
            onPress={() => navigation.navigate('WeightTracking')}
            activeOpacity={0.85}
          >
            <View style={styles.utilityIcon}>
              <MaterialIcons name="show-chart" size={20} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.utilityText}>משקל</Text>
            <MaterialIcons name="chevron-left" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xl }} />
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
    padding: SPACING.md,
    paddingTop: SPACING.xxl + SPACING.md,
  },

  // Top bar
  topBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  brandPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  brandText: {
    color: COLORS.text,
    fontSize: FONTS.tiny,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Greeting
  greetingBlock: {
    marginBottom: SPACING.lg,
  },
  greetingHello: {
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
    textAlign: 'right',
    fontWeight: '500',
  },
  greetingName: {
    color: COLORS.text,
    fontSize: FONTS.hero,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: -4,
    lineHeight: 50,
  },
  greetingQuote: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },

  // Hero card
  heroCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  heroCardContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    alignItems: 'flex-end',
  },
  heroRight: {
    width: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  athleteWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStreakBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  heroFireDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.warning,
  },
  heroStreakText: {
    color: COLORS.warning,
    fontSize: FONTS.micro,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroHugeNumber: {
    color: COLORS.text,
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 70,
    marginTop: SPACING.sm,
  },
  heroLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: '500',
  },
  heroDivider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
    marginVertical: SPACING.sm,
  },
  heroBottomRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  heroPositive: {
    color: COLORS.success,
    fontSize: FONTS.tiny,
    fontWeight: '700',
  },

  // Stats
  statsRow: {
    flexDirection: 'row-reverse',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statPill: {
    flex: 1,
    padding: SPACING.md,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  statPillTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPercent: {
    fontSize: FONTS.tiny,
    fontWeight: '800',
  },
  statPillBottom: {
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
  },
  statValueRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: '900',
  },
  statUnit: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    fontWeight: '600',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    fontWeight: '600',
    marginTop: 2,
  },
  statProgressTrack: {
    height: 3,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 1.5,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  statProgressBar: {
    height: '100%',
    borderRadius: 1.5,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  // Action cards
  actionsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionCard: {
    width: (width - SPACING.md * 2 - SPACING.md) / 2,
    padding: 0,
    minHeight: 130,
  },
  actionCardInner: {
    padding: SPACING.md,
    alignItems: 'flex-end',
    height: '100%',
    justifyContent: 'space-between',
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '800',
  },
  actionSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    fontWeight: '500',
    marginTop: 2,
  },
  actionArrow: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    opacity: 0.6,
  },

  // AI card
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
  aiIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  aiTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
  },
  aiTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  aiTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  aiTagText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '800',
  },
  aiSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    marginTop: 2,
    textAlign: 'right',
  },
  aiArrow: {
    marginLeft: SPACING.xs,
  },

  // Utility row
  utilityRow: {
    flexDirection: 'row-reverse',
    gap: SPACING.md,
  },
  utilityCard: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  utilityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '600',
    textAlign: 'right',
  },
});
