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
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { createPost } from '../services/socialService';
import { calculateNutritionPlan, distributeMeals } from '../services/nutritionEngine';
import { generateDailyPlan, getAlternatives, calculateFoodMacros } from '../services/mealPlanGenerator';
import { requestFoodSwap } from '../services/aiNutritionService';
import { FOOD_CATEGORIES } from '../data/nutrition';
import GlassCard from '../components/GlassCard';
import GeometricPattern from '../components/GeometricPattern';
import ProgressRing from '../components/ProgressRing';
import { FadeInView } from '../components/AnimatedCard';
import AuroraBackground from '../components/AuroraBackground';
import { RTL_ICONS } from '../utils/rtl';

const todayKey = () => new Date().toISOString().split('T')[0];

const macroTargetFields = [
  {
    key: 'calories',
    label: 'קלוריות',
    unit: 'קל׳',
    icon: 'local-fire-department',
    color: COLORS.success,
    keyboardType: 'number-pad',
  },
  {
    key: 'protein',
    label: 'חלבון',
    unit: 'ג',
    icon: 'fitness-center',
    color: COLORS.accent,
    keyboardType: 'number-pad',
  },
  {
    key: 'carbs',
    label: 'פחמימות',
    unit: 'ג',
    icon: 'grain',
    color: COLORS.secondary,
    keyboardType: 'number-pad',
  },
  {
    key: 'fat',
    label: 'שומן',
    unit: 'ג',
    icon: 'opacity',
    color: COLORS.primary,
    keyboardType: 'number-pad',
  },
];

const foodCategoriesForPicker = Object.entries(FOOD_CATEGORIES).map(([id, category]) => ({
  id,
  name: category.name,
  items: category.items,
}));

function emptyTargetDraft() {
  return {
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  };
}

function planToTargetDraft(plan) {
  if (!plan) return emptyTargetDraft();

  return {
    calories: String(plan.targetCalories || ''),
    protein: String(plan.macros?.protein || ''),
    carbs: String(plan.macros?.carbs || ''),
    fat: String(plan.macros?.fat || ''),
  };
}

function parsePositiveNumber(value) {
  const parsed = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function applyManualTargets(basePlan, manualTargets) {
  if (!basePlan || !manualTargets) return basePlan;

  const targetCalories = manualTargets.calories || basePlan.targetCalories;
  const macros = {
    protein: manualTargets.protein || basePlan.macros.protein,
    carbs: manualTargets.carbs || basePlan.macros.carbs,
    fat: manualTargets.fat || basePlan.macros.fat,
  };

  return {
    ...basePlan,
    targetCalories,
    macros,
    meals: distributeMeals(targetCalories, macros),
    summary: {
      caloriesLabel: `${targetCalories} קלוריות ליום`,
      proteinLabel: `${macros.protein} גרם חלבון`,
      carbsLabel: `${macros.carbs} גרם פחמימות`,
      fatLabel: `${macros.fat} גרם שומן`,
    },
  };
}

function sumFoodLog(entries) {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + (entry.calories || 0),
      protein: totals.protein + (entry.protein || 0),
      carbs: totals.carbs + (entry.carbs || 0),
      fat: totals.fat + (entry.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

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

  // Only show the swap button when there are real alternatives to swap to.
  // (e.g. "free calories" slots have no category alternatives → no dead-end modal)
  const hasAlternatives = slot.options && slot.options.length > 1;

  return (
    <View style={styles.slotSection}>
      <View style={styles.slotHeader}>
        {hasAlternatives ? (
          <TouchableOpacity
            style={styles.swapButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => onSwap(mealId, slotIndex, slot)}
            disabled={swapping}
          >
            {swapping ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <MaterialIcons name="swap-horiz" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 20 }} />
        )}
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

          <ScrollView
            style={styles.modalScroll}
            bounces={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            nestedScrollEnabled={true}
          >
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

// ─── Daily Food Log ─────────────────────────────────────────────────────────
function DailyFoodLogCard({ entries, totals, targetCalories, onAddFood, onRemoveFood }) {
  const remainingCalories = Math.max(0, targetCalories - totals.calories);

  return (
    <GlassCard
      delay={250}
      gradientColors={['rgba(52,211,153,0.18)', 'rgba(34,211,238,0.08)']}
      borderColor="rgba(52,211,153,0.28)"
      style={styles.foodLogCard}
    >
      <View style={styles.foodLogHeader}>
        <TouchableOpacity style={styles.addFoodButton} onPress={onAddFood} activeOpacity={0.85}>
          <MaterialIcons name="add" size={20} color={COLORS.background} />
          <Text style={styles.addFoodText}>הוסף אוכל</Text>
        </TouchableOpacity>
        <View style={styles.foodLogTitleWrap}>
          <Text style={styles.foodLogTitle}>מה אכלתי היום</Text>
          <Text style={styles.foodLogSubtitle}>{remainingCalories} קל׳ נשארו ליעד</Text>
        </View>
      </View>

      <View style={styles.foodLogTotals}>
        <LogTotal label="קלוריות" value={totals.calories} color={COLORS.success} />
        <LogTotal label="חלבון" value={`${Math.round(totals.protein)}ג`} color={COLORS.accent} />
        <LogTotal label="פחמ׳" value={`${Math.round(totals.carbs)}ג`} color={COLORS.secondary} />
        <LogTotal label="שומן" value={`${Math.round(totals.fat)}ג`} color={COLORS.primary} />
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyFoodLog}>
          <MaterialIcons name="playlist-add" size={24} color={COLORS.textMuted} />
          <Text style={styles.emptyFoodLogText}>עדיין לא הוספת אוכל להיום</Text>
        </View>
      ) : (
        <View style={styles.foodLogList}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.foodLogItem}>
              <TouchableOpacity
                style={styles.removeFoodButton}
                onPress={() => onRemoveFood(entry.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
              <View style={styles.foodLogItemText}>
                <Text style={styles.foodLogItemName}>{entry.name}</Text>
                <Text style={styles.foodLogItemMeta}>
                  {entry.amount} {entry.unit} | {entry.calories} קל׳
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

function LogTotal({ label, value, color }) {
  return (
    <View style={styles.logTotalPill}>
      <Text style={[styles.logTotalValue, { color }]}>{value}</Text>
      <Text style={styles.logTotalLabel}>{label}</Text>
    </View>
  );
}

function MacroTargetEditor({ draft, hasCustomTargets, onChange, onApply, onReset }) {
  return (
    <GlassCard
      delay={175}
      gradientColors={['rgba(255,191,36,0.14)', 'rgba(255,77,143,0.08)']}
      borderColor="rgba(251,191,36,0.26)"
      style={styles.targetEditorCard}
    >
      <View style={styles.targetEditorHeader}>
        <View style={styles.targetEditorActions}>
          <TouchableOpacity
            style={styles.targetApplyButton}
            onPress={onApply}
            activeOpacity={0.85}
          >
            <MaterialIcons name="check" size={18} color={COLORS.background} />
            <Text style={styles.targetApplyText}>שמור</Text>
          </TouchableOpacity>
          {hasCustomTargets && (
            <TouchableOpacity
              style={styles.targetResetButton}
              onPress={onReset}
              activeOpacity={0.85}
            >
              <MaterialIcons name="restart-alt" size={18} color={COLORS.warning} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.targetEditorTitleWrap}>
          <Text style={styles.targetEditorTitle}>יעדים מותאמים</Text>
          <Text style={styles.targetEditorSubtitle}>בחר קלוריות, חלבון, פחמימות ושומן ליום</Text>
        </View>
      </View>

      <View style={styles.targetGrid}>
        {macroTargetFields.map((field) => (
          <View key={field.key} style={styles.targetInputTile}>
            <View style={styles.targetInputLabelRow}>
              <MaterialIcons name={field.icon} size={16} color={field.color} />
              <Text style={styles.targetInputLabel}>{field.label}</Text>
            </View>
            <View style={styles.targetInputWrap}>
              <TextInput
                style={styles.targetInput}
                keyboardType={field.keyboardType}
                value={draft[field.key]}
                onChangeText={(value) => onChange(field.key, value)}
                placeholder="0"
                placeholderTextColor={COLORS.textDim}
                selectTextOnFocus
              />
              <Text style={styles.targetInputUnit}>{field.unit}</Text>
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

// ─── Food Picker Modal ──────────────────────────────────────────────────────
function FoodPickerModal({
  visible,
  onClose,
  selectedCategory,
  onSelectCategory,
  selectedFood,
  onSelectFood,
  amount,
  onChangeAmount,
  onAdd,
}) {
  const category = foodCategoriesForPicker.find((item) => item.id === selectedCategory);
  const unit = selectedFood?.per100g ? 'גרם' : 'יחידות';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>הוספת אוכל</Text>
            <MaterialIcons name="restaurant-menu" size={24} color={COLORS.success} />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPicker}
            bounces={false}
            nestedScrollEnabled={true}
          >
            {foodCategoriesForPicker.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === item.id && styles.categoryChipActive,
                ]}
                onPress={() => onSelectCategory(item.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === item.id && styles.categoryChipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.foodPickerList} bounces={false} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
            {category?.items.map((food) => (
              <TouchableOpacity
                key={food.id}
                style={[
                  styles.foodPickerItem,
                  selectedFood?.id === food.id && styles.foodPickerItemActive,
                ]}
                onPress={() => onSelectFood(food)}
              >
                <View style={styles.foodPickerMacroRow}>
                  <Text style={styles.foodPickerMacro}>{food.calories} קל׳</Text>
                  <Text style={styles.foodPickerMacro}>ח {food.protein}ג</Text>
                  <Text style={styles.foodPickerMacro}>פ {food.carbs}ג</Text>
                  <Text style={styles.foodPickerMacro}>ש {food.fat}ג</Text>
                </View>
                <View style={styles.foodPickerNameWrap}>
                  <Text style={styles.foodPickerName}>{food.name}</Text>
                  <Text style={styles.foodPickerUnit}>
                    לפי {food.per100g ? '100 גרם' : 'מנה'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.amountRow}>
            <TouchableOpacity
              style={[styles.confirmFoodButton, !selectedFood && styles.confirmFoodButtonDisabled]}
              onPress={onAdd}
              disabled={!selectedFood}
            >
              <Text style={styles.confirmFoodText}>הוסף ליומן</Text>
            </TouchableOpacity>
            <View style={styles.amountInputWrap}>
              <TextInput
                style={styles.amountInput}
                placeholder={selectedFood?.per100g ? '100' : '1'}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={onChangeAmount}
              />
              <Text style={styles.amountUnit}>{unit}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Nutrition Screen ──────────────────────────────────────────────────
export default function NutritionScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const toast = useToast();
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [dailyMealPlan, setDailyMealPlan] = useState(null);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [swapping, setSwapping] = useState(false);
  const [foodLog, setFoodLog] = useState([]);
  const [foodLogLoaded, setFoodLogLoaded] = useState(false);
  const [loadedFoodLogKey, setLoadedFoodLogKey] = useState(null);
  const [foodPickerVisible, setFoodPickerVisible] = useState(false);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState(foodCategoriesForPicker[0]?.id || 'protein');
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodAmount, setFoodAmount] = useState('');
  const [manualTargets, setManualTargets] = useState(null);
  const [manualTargetsLoaded, setManualTargetsLoaded] = useState(false);
  const [targetDraft, setTargetDraft] = useState(emptyTargetDraft);
  const [swapModal, setSwapModal] = useState({
    visible: false,
    alternatives: [],
    reasoning: '',
    mealId: null,
    slotIndex: null,
  });

  const foodLogStorageKey = `foodLog:${user?.uid || 'guest'}:${todayKey()}`;
  const manualTargetsStorageKey = `nutritionTargets:${user?.uid || 'guest'}`;

  useEffect(() => {
    let isMounted = true;

    async function loadManualTargets() {
      try {
        setManualTargetsLoaded(false);
        const stored = await AsyncStorage.getItem(manualTargetsStorageKey);
        if (isMounted) {
          setManualTargets(stored ? JSON.parse(stored) : null);
          setManualTargetsLoaded(true);
        }
      } catch (error) {
        console.error('Error loading nutrition targets:', error);
        if (isMounted) {
          setManualTargets(null);
          setManualTargetsLoaded(true);
        }
      }
    }

    loadManualTargets();
    return () => {
      isMounted = false;
    };
  }, [manualTargetsStorageKey]);

  // Calculate nutrition plan when user profile or custom targets change
  useEffect(() => {
    if (userProfile && manualTargetsLoaded) {
      const basePlan = calculateNutritionPlan(userProfile);
      const plan = applyManualTargets(basePlan, manualTargets);
      setNutritionPlan(plan);

      // Generate daily meal plan from calculated targets
      const mealPlan = generateDailyPlan(plan.meals);
      setDailyMealPlan(mealPlan);
    }
  }, [manualTargets, manualTargetsLoaded, userProfile]);

  useEffect(() => {
    if (nutritionPlan) {
      setTargetDraft(planToTargetDraft(nutritionPlan));
    }
  }, [nutritionPlan]);

  useEffect(() => {
    if (!manualTargetsLoaded) return;

    const save = manualTargets
      ? AsyncStorage.setItem(manualTargetsStorageKey, JSON.stringify(manualTargets))
      : AsyncStorage.removeItem(manualTargetsStorageKey);

    save.catch((error) => {
      console.error('Error saving nutrition targets:', error);
    });
  }, [manualTargets, manualTargetsLoaded, manualTargetsStorageKey]);

  useEffect(() => {
    let isMounted = true;

    async function loadFoodLog() {
      try {
        setFoodLogLoaded(false);
        setLoadedFoodLogKey(null);
        const stored = await AsyncStorage.getItem(foodLogStorageKey);
        if (isMounted) {
          setFoodLog(stored ? JSON.parse(stored) : []);
          setFoodLogLoaded(true);
          setLoadedFoodLogKey(foodLogStorageKey);
        }
      } catch (error) {
        console.error('Error loading food log:', error);
        if (isMounted) {
          setFoodLogLoaded(true);
          setLoadedFoodLogKey(foodLogStorageKey);
        }
      }
    }

    loadFoodLog();
    return () => {
      isMounted = false;
    };
  }, [foodLogStorageKey]);

  useEffect(() => {
    if (!foodLogLoaded || loadedFoodLogKey !== foodLogStorageKey) return;

    AsyncStorage.setItem(foodLogStorageKey, JSON.stringify(foodLog)).catch((error) => {
      console.error('Error saving food log:', error);
    });
  }, [foodLog, foodLogLoaded, foodLogStorageKey, loadedFoodLogKey]);

  const openFoodPicker = useCallback(() => {
    const category = foodCategoriesForPicker.find((item) => item.id === selectedFoodCategory)
      || foodCategoriesForPicker[0];
    setSelectedFood(category?.items?.[0] || null);
    setFoodAmount(category?.items?.[0]?.per100g ? '100' : '1');
    setFoodPickerVisible(true);
  }, [selectedFoodCategory]);

  const handleSelectFoodCategory = useCallback((categoryId) => {
    const category = foodCategoriesForPicker.find((item) => item.id === categoryId);
    const firstFood = category?.items?.[0] || null;
    setSelectedFoodCategory(categoryId);
    setSelectedFood(firstFood);
    setFoodAmount(firstFood?.per100g ? '100' : '1');
  }, []);

  const handleSelectFood = useCallback((food) => {
    setSelectedFood(food);
    setFoodAmount(food?.per100g ? '100' : '1');
  }, []);

  const handleAddLoggedFood = useCallback(() => {
    if (!selectedFood) return;

    const normalizedAmount = Number(String(foodAmount).replace(',', '.'));
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      Alert.alert('כמות חסרה', 'הזן כמות תקינה כדי להוסיף את האוכל.');
      return;
    }

    const macros = calculateFoodMacros(selectedFood, normalizedAmount);
    const entry = {
      id: `${Date.now()}-${selectedFood.id}`,
      foodId: selectedFood.id,
      name: selectedFood.name,
      amount: normalizedAmount,
      unit: selectedFood.per100g ? 'גרם' : 'יחידות',
      per100g: selectedFood.per100g,
      addedAt: new Date().toISOString(),
      ...macros,
    };

    setFoodLog((prev) => [entry, ...prev]);
    setFoodPickerVisible(false);
    setFoodAmount('');
  }, [foodAmount, selectedFood]);

  const handleRemoveLoggedFood = useCallback((entryId) => {
    setFoodLog((prev) => prev.filter((entry) => entry.id !== entryId));
  }, []);

  const handleChangeTargetDraft = useCallback((fieldKey, value) => {
    const sanitized = value.replace(/[^\d.,]/g, '');
    setTargetDraft((prev) => ({
      ...prev,
      [fieldKey]: sanitized,
    }));
  }, []);

  const handleApplyManualTargets = useCallback(() => {
    const nextTargets = {
      calories: parsePositiveNumber(targetDraft.calories),
      protein: parsePositiveNumber(targetDraft.protein),
      carbs: parsePositiveNumber(targetDraft.carbs),
      fat: parsePositiveNumber(targetDraft.fat),
    };

    const hasInvalidTarget = Object.values(nextTargets).some((value) => !value);
    if (hasInvalidTarget) {
      Alert.alert('יעדים חסרים', 'הזן מספר חיובי עבור קלוריות, חלבון, פחמימות ושומן.');
      return;
    }

    setManualTargets(nextTargets);
    Alert.alert('נשמר', 'היעדים עודכנו והתפריט הותאם מחדש.');
  }, [targetDraft]);

  const handleResetManualTargets = useCallback(() => {
    const basePlan = calculateNutritionPlan(userProfile);
    setManualTargets(null);
    setTargetDraft(planToTargetDraft(basePlan));
    Alert.alert('אופס', 'חזרנו לחישוב האוטומטי לפי הפרופיל שלך.');
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

  const handleShareMenu = async () => {
    if (!nutritionPlan || !user) return;
    try {
      await createPost({
        uid: user.uid,
        authorName: userProfile?.name || 'מתאמן',
        authorPhoto: userProfile?.photo || null,
        authorGym: userProfile?.gymName || null,
        text: 'התפריט היומי שלי 🥗',
        image: null,
        type: 'meal',
        payload: {
          calories: nutritionPlan.targetCalories,
          protein: nutritionPlan.macros?.protein || 0,
          carbs: nutritionPlan.macros?.carbs || 0,
          fat: nutritionPlan.macros?.fat || 0,
          meals: dailyMealPlan
            ? mealOrder.map((id) => dailyMealPlan[id]?.name).filter(Boolean)
            : [],
        },
      });
      toast.success('התפריט שותף לקהילה! 🥗');
    } catch (e) {
      toast.error('השיתוף נכשל, נסה שוב');
    }
  };

  const targetCalories = nutritionPlan?.targetCalories || 2000;
  const consumedTotals = sumFoodLog(foodLog);
  const consumedCalories = consumedTotals.calories;
  const progress = Math.min(consumedCalories / targetCalories, 1);

  return (
    <View style={styles.root}>
      <AuroraBackground intensity={0.45} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
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
                    <Text style={[styles.macroValue, { color: COLORS.success }]}>{Math.round(consumedTotals.protein)}ג</Text>
                    <Text style={styles.macroLabel}>חלבון</Text>
                  </View>
                  <View style={[styles.macroBadge, { backgroundColor: 'rgba(255,182,39,0.2)' }]}>
                    <Text style={[styles.macroValue, { color: COLORS.secondary }]}>{Math.round(consumedTotals.carbs)}ג</Text>
                    <Text style={styles.macroLabel}>פחמ׳</Text>
                  </View>
                  <View style={[styles.macroBadge, { backgroundColor: 'rgba(255,77,143,0.2)' }]}>
                    <Text style={[styles.macroValue, { color: COLORS.primary }]}>{Math.round(consumedTotals.fat)}ג</Text>
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
            <MaterialIcons name={RTL_ICONS.chevronForward} size={24} color={COLORS.tertiary} />
          </View>
        </GlassCard>

        <MacroTargetEditor
          draft={targetDraft}
          hasCustomTargets={!!manualTargets}
          onChange={handleChangeTargetDraft}
          onApply={handleApplyManualTargets}
          onReset={handleResetManualTargets}
        />

        <DailyFoodLogCard
          entries={foodLog}
          totals={consumedTotals}
          targetCalories={targetCalories}
          onAddFood={openFoodPicker}
          onRemoveFood={handleRemoveLoggedFood}
        />

        {/* Section header */}
        <FadeInView delay={300} style={styles.sectionHeaderBlock}>
          <View>
            <Text style={styles.sectionHeader}>תפריט מומלץ</Text>
            <Text style={styles.sectionSubtext}>
              אפשר לבחור ממנו רעיונות, אבל היומן למעלה הוא מה שאכלת באמת
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

        {/* Share menu to community */}
        {dailyMealPlan && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleShareMenu}
            style={styles.shareMenuButton}
          >
            <MaterialIcons name="share" size={20} color={COLORS.success} />
            <Text style={styles.shareMenuButtonText}>שתף את התפריט לקהילה</Text>
          </TouchableOpacity>
        )}

        {/* Swap Modal */}
        <SwapModal
          visible={swapModal.visible}
          onClose={() => setSwapModal({ ...swapModal, visible: false })}
          alternatives={swapModal.alternatives}
          reasoning={swapModal.reasoning}
          onSelect={handleSelectAlternative}
        />

        <FoodPickerModal
          visible={foodPickerVisible}
          onClose={() => setFoodPickerVisible(false)}
          selectedCategory={selectedFoodCategory}
          onSelectCategory={handleSelectFoodCategory}
          selectedFood={selectedFood}
          onSelectFood={handleSelectFood}
          amount={foodAmount}
          onChangeAmount={setFoodAmount}
          onAdd={handleAddLoggedFood}
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
  shareMenuButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.5)',
  },
  shareMenuButtonText: {
    color: COLORS.success,
    fontSize: FONTS.regular,
    fontWeight: '700',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    alignItems: 'flex-end',
  },
  heroRight: {
    marginStart: SPACING.md,
  },
  heroBadge: {
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
  },
  mealHeaderContent: {
    flex: 1,
    alignItems: 'flex-end',
    marginEnd: SPACING.sm,
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    paddingEnd: SPACING.sm,
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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

  // Custom Targets
  targetEditorCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  targetEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  targetEditorTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  targetEditorTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
    textAlign: 'right',
  },
  targetEditorSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    marginTop: 2,
    textAlign: 'right',
  },
  targetEditorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  targetApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    minHeight: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  targetApplyText: {
    color: COLORS.background,
    fontSize: FONTS.small,
    fontWeight: '900',
  },
  targetResetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.28)',
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  targetInputTile: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 132,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  targetInputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  targetInputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    fontWeight: '800',
    textAlign: 'right',
  },
  targetInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.sm,
  },
  targetInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '900',
    textAlign: 'right',
    paddingVertical: SPACING.xs,
  },
  targetInputUnit: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    fontWeight: '700',
    marginStart: SPACING.xs,
  },

  // Daily Food Log
  foodLogCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  foodLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  foodLogTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  foodLogTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
    textAlign: 'right',
  },
  foodLogSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    marginTop: 2,
    textAlign: 'right',
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.round,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 40,
  },
  addFoodText: {
    color: COLORS.background,
    fontSize: FONTS.small,
    fontWeight: '800',
  },
  foodLogTotals: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  logTotalPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    minHeight: 58,
  },
  logTotalValue: {
    fontSize: FONTS.small,
    fontWeight: '800',
  },
  logTotalLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.micro,
    marginTop: 2,
  },
  emptyFoodLog: {
    minHeight: 68,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  emptyFoodLogText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
  },
  foodLogList: {
    gap: SPACING.sm,
  },
  foodLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  removeFoodButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  foodLogItemText: {
    flex: 1,
    alignItems: 'flex-end',
    marginStart: SPACING.sm,
  },
  foodLogItemName: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '700',
    textAlign: 'right',
  },
  foodLogItemMeta: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 2,
    textAlign: 'right',
  },
  categoryPicker: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  categoryChip: {
    borderRadius: BORDER_RADIUS.round,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(52,211,153,0.18)',
    borderColor: COLORS.success,
  },
  categoryChipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: COLORS.success,
  },
  foodPickerList: {
    maxHeight: 310,
    marginBottom: SPACING.md,
  },
  foodPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  foodPickerItemActive: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(52,211,153,0.12)',
  },
  foodPickerNameWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  foodPickerName: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '800',
    textAlign: 'right',
  },
  foodPickerUnit: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 2,
  },
  foodPickerMacroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    maxWidth: 128,
  },
  foodPickerMacro: {
    color: COLORS.textMuted,
    fontSize: FONTS.micro,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  amountInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  amountInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '700',
    textAlign: 'right',
    paddingVertical: SPACING.sm,
  },
  amountUnit: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    marginStart: SPACING.sm,
  },
  confirmFoodButton: {
    minHeight: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  confirmFoodButtonDisabled: {
    opacity: 0.45,
  },
  confirmFoodText: {
    color: COLORS.background,
    fontSize: FONTS.small,
    fontWeight: '800',
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
    color: COLORS.textOnColor,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
  },
});
