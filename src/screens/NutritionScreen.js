import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { calculateNutritionPlan } from '../services/nutritionEngine';
import { generateDailyPlan, getAlternatives } from '../services/mealPlanGenerator';
import { requestFoodSwap } from '../services/aiNutritionService';
import GlassCard from '../components/GlassCard';
import GeometricPattern from '../components/GeometricPattern';
import ProgressRing from '../components/ProgressRing';
import { FadeInView } from '../components/AnimatedCard';
import AuroraBackground from '../components/AuroraBackground';

// ─── Macro Summary Card ─────────────────────────────────────────────────────
function MacroSummaryCard({ nutritionPlan }) {
  if (!nutritionPlan) return null;

  const { targetCalories, macros, bmi } = nutritionPlan;

  return (
    <View style={styles.macroCard}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroTitle}>היעדים היומיים שלך</Text>
        <View style={styles.bmiTag}>
          <Text style={styles.bmiText}>BMI: {bmi.value}</Text>
        </View>
      </View>

      <View style={styles.calorieRow}>
        <MaterialIcons name="local-fire-department" size={24} color={COLORS.primary} />
        <Text style={styles.calorieText}>{targetCalories}</Text>
        <Text style={styles.calorieLabel}>קלוריות ליום</Text>
      </View>

      <View style={styles.macroRow}>
        <MacroItem label="חלבון" value={macros.protein} unit="ג" color="#4CAF50" />
        <MacroItem label="פחמימות" value={macros.carbs} unit="ג" color="#FF9800" />
        <MacroItem label="שומן" value={macros.fat} unit="ג" color="#F44336" />
      </View>
    </View>
  );
}

function MacroItem({ label, value, unit, color }) {
  return (
    <View style={styles.macroItem}>
      <View style={[styles.macroIndicator, { backgroundColor: color }]} />
      <Text style={styles.macroValue}>{value}{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

// ─── Meal Card Component ────────────────────────────────────────────────────
function MealCard({ meal, isExpanded, onToggle, onSwapFood, swapping }) {
  if (!meal || !meal.slots) return null;

  return (
    <View style={styles.mealCard}>
      <TouchableOpacity style={styles.mealHeader} onPress={onToggle} activeOpacity={0.7}>
        <MaterialIcons
          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={28}
          color={COLORS.primary}
        />
        <View style={styles.mealHeaderContent}>
          <Text style={styles.mealTitle}>{meal.name}</Text>
          <Text style={styles.mealCalories}>{meal.targetCalories} קלוריות</Text>
        </View>
        <MaterialIcons name={meal.icon} size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.mealContent}>
          {meal.slots.map((slot, slotIndex) => (
            <SlotSection
              key={slotIndex}
              slot={slot}
              mealId={meal.id}
              slotIndex={slotIndex}
              onSwap={onSwapFood}
              swapping={swapping}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Slot Section (food category within a meal) ─────────────────────────────
function SlotSection({ slot, mealId, slotIndex, onSwap, swapping }) {
  const selectedOption = slot.options?.[slot.selectedIndex];
  if (!selectedOption && slot.optional) return null;

  return (
    <View style={styles.slotSection}>
      <View style={styles.slotHeader}>
        <TouchableOpacity
          style={styles.swapButton}
          onPress={() => onSwap(mealId, slotIndex, slot)}
          disabled={swapping}
        >
          {swapping ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <MaterialIcons name="swap-horiz" size={20} color={COLORS.primary} />
          )}
        </TouchableOpacity>
        <Text style={styles.slotLabel}>{slot.label} | {slot.targetCalories} קל</Text>
      </View>

      {selectedOption ? (
        <View style={styles.foodItem}>
          <Text style={styles.foodName}>{selectedOption.name}</Text>
          <Text style={styles.foodAmount}>
            {selectedOption.amount} {selectedOption.unit}
          </Text>
          <View style={styles.foodMacros}>
            <Text style={styles.foodMacroText}>ח: {selectedOption.protein}ג</Text>
            <Text style={styles.foodMacroText}>פ: {selectedOption.carbs}ג</Text>
            <Text style={styles.foodMacroText}>ש: {selectedOption.fat}ג</Text>
            <Text style={styles.foodMacroText}>{selectedOption.calories} קל</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.emptySlot}>אין אפשרויות זמינות</Text>
      )}

      {/* Show other options as smaller alternatives */}
      {slot.options && slot.options.length > 1 && (
        <View style={styles.alternativesList}>
          <Text style={styles.alternativesTitle}>אפשרויות נוספות:</Text>
          {slot.options
            .filter((_, idx) => idx !== slot.selectedIndex)
            .slice(0, 3)
            .map((opt, idx) => (
              <Text key={idx} style={styles.alternativeItem}>
                • {opt.name} ({opt.amount} {opt.unit})
              </Text>
            ))}
        </View>
      )}
    </View>
  );
}

// ─── Swap Modal ─────────────────────────────────────────────────────────────
function SwapModal({ visible, onClose, alternatives, onSelect, reasoning }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>החלפת מזון</Text>
            <MaterialIcons name="swap-horiz" size={24} color={COLORS.primary} />
          </View>

          {reasoning && (
            <Text style={styles.modalReasoning}>{reasoning}</Text>
          )}

          <ScrollView style={styles.modalScroll}>
            {alternatives.map((alt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.alternativeCard}
                onPress={() => onSelect(alt, index)}
              >
                <View style={styles.altCardHeader}>
                  <Text style={styles.altName}>{alt.name}</Text>
                  <Text style={styles.altAmount}>{alt.amount} {alt.unit}</Text>
                </View>
                <View style={styles.altMacros}>
                  <Text style={styles.altMacroText}>{alt.calories} קל</Text>
                  <Text style={styles.altMacroText}>ח: {alt.protein}ג</Text>
                  <Text style={styles.altMacroText}>פ: {alt.carbs}ג</Text>
                  <Text style={styles.altMacroText}>ש: {alt.fat}ג</Text>
                </View>
                {alt.reason && (
                  <Text style={styles.altReason}>{alt.reason}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Nutrition Screen ──────────────────────────────────────────────────
export default function NutritionScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [dailyMealPlan, setDailyMealPlan] = useState(null);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [swapping, setSwapping] = useState(false);
  const [swapModal, setSwapModal] = useState({
    visible: false,
    alternatives: [],
    reasoning: '',
    mealId: null,
    slotIndex: null,
  });

  // Calculate nutrition plan when user profile changes
  useEffect(() => {
    if (userProfile) {
      const plan = calculateNutritionPlan(userProfile);
      setNutritionPlan(plan);

      // Generate daily meal plan from calculated targets
      const mealPlan = generateDailyPlan(plan.meals);
      setDailyMealPlan(mealPlan);
    }
  }, [userProfile]);

  // Handle food swap request
  const handleSwapFood = useCallback(async (mealId, slotIndex, slot) => {
    const selectedOption = slot.options?.[slot.selectedIndex];
    if (!selectedOption) return;

    setSwapping(true);

    try {
      // Try AI-powered swap first
      const result = await requestFoodSwap(
        {
          id: selectedOption.foodId,
          name: selectedOption.name,
          category: slot.category,
          amount: selectedOption.amount,
          per100g: selectedOption.unit === 'גרם',
        },
        slot.targetCalories,
        userProfile
      );

      if (result && result.alternatives && result.alternatives.length > 0) {
        setSwapModal({
          visible: true,
          alternatives: result.alternatives,
          reasoning: result.reasoning || '',
          mealId,
          slotIndex,
        });
      } else {
        // Fallback to local alternatives
        const localAlts = getAlternatives(selectedOption.foodId, slot.category, slot.targetCalories);
        setSwapModal({
          visible: true,
          alternatives: localAlts,
          reasoning: 'חלופות מהמאגר המקומי',
          mealId,
          slotIndex,
        });
      }
    } catch (error) {
      console.error('Swap error:', error);
      // Fallback
      const localAlts = getAlternatives(selectedOption.foodId, slot.category, slot.targetCalories);
      setSwapModal({
        visible: true,
        alternatives: localAlts,
        reasoning: 'חלופות מהמאגר המקומי',
        mealId,
        slotIndex,
      });
    } finally {
      setSwapping(false);
    }
  }, [userProfile]);

  // Handle selecting an alternative from the modal
  const handleSelectAlternative = useCallback((alternative, index) => {
    const { mealId, slotIndex } = swapModal;

    setDailyMealPlan((prev) => {
      const updated = { ...prev };
      const meal = { ...updated[mealId] };
      const slots = [...meal.slots];
      const slot = { ...slots[slotIndex] };

      // Add the selected alternative as the new first option and select it
      const newOption = {
        foodId: alternative.foodId,
        name: alternative.name,
        amount: alternative.amount,
        unit: alternative.unit,
        calories: alternative.calories,
        protein: alternative.protein,
        carbs: alternative.carbs,
        fat: alternative.fat,
      };

      // Put new selection at the beginning
      slot.options = [newOption, ...slot.options.filter((o) => o.foodId !== alternative.foodId)];
      slot.selectedIndex = 0;
      slots[slotIndex] = slot;
      meal.slots = slots;
      updated[mealId] = meal;

      return updated;
    });

    setSwapModal({ visible: false, alternatives: [], reasoning: '', mealId: null, slotIndex: null });
    Alert.alert('✅ הוחלף!', `${alternative.name} - ${alternative.amount} ${alternative.unit}`);
  }, [swapModal]);

  // If no profile data yet
  if (!userProfile || !userProfile.weight || !userProfile.height) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="person-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>עדכן את הפרופיל שלך</Text>
        <Text style={styles.emptySubtext}>
          כדי לחשב את התפריט המותאם אישית, נדרשים נתוני משקל, גובה וגיל
        </Text>
        <TouchableOpacity
          style={styles.goToProfileButton}
          onPress={() => navigation?.navigate?.('Profile')}
        >
          <Text style={styles.goToProfileText}>עבור לפרופיל</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mealOrder = ['breakfast', 'lunch', 'pre_workout', 'dinner', 'free_calories'];

  const targetCalories = nutritionPlan?.targetCalories || 2000;
  const consumedCalories = 0; // TODO: from real data
  const progress = consumedCalories / targetCalories;

  return (
    <View style={styles.root}>
      <AuroraBackground intensity={0.45} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <FadeInView style={styles.headerNew}>
          <View style={styles.headerIconBg}>
            <MaterialIcons name="restaurant" size={28} color={COLORS.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>תזונה</Text>
            <Text style={styles.headerSubtitle}>תכנית התזונה שלך</Text>
          </View>
        </FadeInView>

        {/* Hero Nutrition Card */}
        <GlassCard
          delay={100}
          gradientColors={['rgba(76,217,100,0.25)', 'rgba(91,192,235,0.1)']}
          borderColor="rgba(76,217,100,0.3)"
          style={styles.heroCard}
          glow
        >
          <View style={styles.patternOverlay}>
            <GeometricPattern type="circles" color={COLORS.success} opacity={0.2} size={400} />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.heroBadge}>
                <MaterialIcons name="local-fire-department" size={14} color={COLORS.success} />
                <Text style={styles.heroBadgeText}>היום</Text>
              </View>
              <Text style={styles.heroBigNumber}>{consumedCalories}</Text>
              <Text style={styles.heroSubtext}>מתוך {targetCalories} קל</Text>

              {nutritionPlan?.macros && (
                <View style={styles.macrosRow}>
                  <View style={[styles.macroBadge, { backgroundColor: 'rgba(76,217,100,0.2)' }]}>
                    <Text style={[styles.macroValue, { color: COLORS.success }]}>{nutritionPlan.macros.protein}ג</Text>
                    <Text style={styles.macroLabel}>חלבון</Text>
                  </View>
                  <View style={[styles.macroBadge, { backgroundColor: 'rgba(255,182,39,0.2)' }]}>
                    <Text style={[styles.macroValue, { color: COLORS.secondary }]}>{nutritionPlan.macros.carbs}ג</Text>
                    <Text style={styles.macroLabel}>פחמ׳</Text>
                  </View>
                  <View style={[styles.macroBadge, { backgroundColor: 'rgba(255,77,143,0.2)' }]}>
                    <Text style={[styles.macroValue, { color: COLORS.primary }]}>{nutritionPlan.macros.fat}ג</Text>
                    <Text style={styles.macroLabel}>שומן</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.heroRight}>
              <ProgressRing
                size={110}
                strokeWidth={10}
                progress={progress}
                gradientId="nutritionRing"
                gradientColors={[COLORS.success, COLORS.accent]}
              >
                <Text style={styles.heroRingValue}>{Math.round(progress * 100)}%</Text>
                <Text style={styles.heroRingLabel}>מהיעד</Text>
              </ProgressRing>
            </View>
          </View>
        </GlassCard>

        {/* AI Consultation - now styled as glass card */}
        <GlassCard
          onPress={() => navigation?.navigate?.('AIChat')}
          gradientColors={['rgba(160,108,213,0.2)', 'rgba(91,192,235,0.1)']}
          borderColor="rgba(160,108,213,0.4)"
          delay={200}
          style={{ marginBottom: SPACING.md, padding: 0 }}
        >
          <View style={styles.aiButtonInner}>
            <View style={styles.aiIconBg}>
              <MaterialIcons name="smart-toy" size={24} color={COLORS.tertiary} />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.aiTitle}>התייעץ עם ה-AI</Text>
              <Text style={styles.aiSubtitle}>שאל על מזונות, חלופות, או טיפים</Text>
            </View>
            <MaterialIcons name="chevron-left" size={24} color={COLORS.tertiary} />
          </View>
        </GlassCard>

        {/* Section header */}
        <FadeInView delay={300} style={styles.sectionHeaderBlock}>
          <View>
            <Text style={styles.sectionHeader}>התפריט היומי שלך</Text>
            <Text style={styles.sectionSubtext}>
              לחץ על ↔ כדי להחליף מזון עם המלצת AI
            </Text>
          </View>
          <View style={styles.sectionDot} />
        </FadeInView>

        {dailyMealPlan && mealOrder.map((mealId) => {
          const meal = dailyMealPlan[mealId];
          if (!meal) return null;
          return (
            <MealCard
              key={mealId}
              meal={meal}
              isExpanded={expandedMeal === mealId}
              onToggle={() => setExpandedMeal(expandedMeal === mealId ? null : mealId)}
              onSwapFood={handleSwapFood}
              swapping={swapping}
            />
          );
        })}

        {/* Swap Modal */}
        <SwapModal
          visible={swapModal.visible}
          onClose={() => setSwapModal({ ...swapModal, visible: false })}
          alternatives={swapModal.alternatives}
          reasoning={swapModal.reasoning}
          onSelect={handleSelectAlternative}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.xxl + SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  headerNew: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  headerIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginTop: 2,
  },

  // Hero Card
  heroCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  patternOverlay: {
    position: 'absolute',
    top: -50,
    right: -50,
    opacity: 0.6,
  },
  heroContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    alignItems: 'flex-end',
  },
  heroRight: {
    marginLeft: SPACING.md,
  },
  heroBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(76,217,100,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(76,217,100,0.4)',
  },
  heroBadgeText: {
    color: COLORS.success,
    fontSize: FONTS.tiny,
    fontWeight: '700',
  },
  heroBigNumber: {
    color: COLORS.text,
    fontSize: 48,
    fontWeight: '900',
    marginTop: SPACING.xs,
    lineHeight: 52,
  },
  heroSubtext: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
  macrosRow: {
    flexDirection: 'row-reverse',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  macroBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    minWidth: 50,
  },
  macroValue: {
    fontSize: FONTS.small,
    fontWeight: 'bold',
  },
  macroLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.micro,
    marginTop: 2,
  },
  heroRingValue: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  heroRingLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
  },

  // AI Button (new style)
  aiButtonInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  aiIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(160,108,213,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
  },
  aiSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    marginTop: 2,
  },

  // Section header
  sectionHeaderBlock: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },

  header: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
  },

  // Macro Summary
  macroCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  macroHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  macroTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  bmiTag: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  bmiText: {
    color: COLORS.text,
    fontSize: FONTS.tiny,
    fontWeight: '600',
  },
  calorieRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  calorieText: {
    color: COLORS.primary,
    fontSize: FONTS.title,
    fontWeight: 'bold',
  },
  calorieLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
  },
  macroRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  macroIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroValue: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  macroLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
  },

  // AI Button
  aiButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    gap: SPACING.sm,
  },
  aiButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: '600',
  },

  // Section
  sectionHeader: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  sectionSubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },

  // Meal Card
  mealCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
  },
  mealHeaderContent: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  mealTitle: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
  },
  mealCalories: {
    color: COLORS.primary,
    fontSize: FONTS.tiny,
    marginTop: 2,
  },
  mealContent: {
    padding: SPACING.md,
  },

  // Slot Section
  slotSection: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  slotHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  slotLabel: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: 'bold',
  },
  swapButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,
  },

  // Food Item
  foodItem: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  foodName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
    textAlign: 'right',
  },
  foodAmount: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginTop: 2,
  },
  foodMacros: {
    flexDirection: 'row-reverse',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  foodMacroText: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
  },

  // Alternatives
  alternativesList: {
    marginTop: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  alternativesTitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  alternativeItem: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    lineHeight: 20,
  },
  emptySlot: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'center',
    padding: SPACING.md,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '70%',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: 'bold',
  },
  modalReasoning: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  modalScroll: {
    maxHeight: 400,
  },
  alternativeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  altCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  altName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
  altAmount: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: '600',
  },
  altMacros: {
    flexDirection: 'row-reverse',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  altMacroText: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
  },
  altReason: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 24,
  },
  goToProfileButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  goToProfileText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
  },
});
