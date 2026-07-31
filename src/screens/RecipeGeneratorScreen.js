import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Dimensions, Animated, Easing, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS, FONTS, SPACING, BORDER_RADIUS, GRADIENTS, SHADOWS,
} from '../config/theme';
import { useAuth } from '../context/AuthContext';
import {
  RECIPES, RECIPE_CATEGORIES, searchRecipes, getRecipesByCategory, calculatePortions,
} from '../data/recipes';
import GlassCard from '../components/GlassCard';
import GeometricPattern from '../components/GeometricPattern';
import ProgressRing from '../components/ProgressRing';
import { FadeInView } from '../components/AnimatedCard';
import AuroraBackground from '../components/AuroraBackground';
import { useToast } from '../components/Toast';
import { USE_NATIVE_DRIVER } from '../utils/animation';
import { RTL_ICONS } from '../utils/rtl';

const { width } = Dimensions.get('window');

function CategoryChip({ category, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.categoryChip,
        active && { backgroundColor: category.color + '25', borderColor: category.color },
      ]}
    >
      <MaterialIcons
        name={category.icon}
        size={18}
        color={active ? category.color : COLORS.textMuted}
      />
      <Text style={[styles.categoryChipText, active && { color: category.color }]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

function RecipeCard({ recipe, onPress, delay }) {
  const category = RECIPE_CATEGORIES.find((c) => c.id === recipe.category);

  return (
    <GlassCard
      onPress={onPress}
      delay={delay}
      gradientColors={[category.color + '15', category.color + '05']}
      borderColor={category.color + '30'}
      style={styles.recipeCard}
    >
      <View style={styles.recipeCardContent}>
        <View style={styles.recipeCardHeader}>
          <View style={[styles.recipeCategoryDot, { backgroundColor: category.color }]}>
            <MaterialIcons name={category.icon} size={16} color={COLORS.textOnColor} />
          </View>
          <View style={styles.recipeTags}>
            <View style={styles.recipeTag}>
              <MaterialIcons name="schedule" size={10} color={COLORS.textMuted} />
              <Text style={styles.recipeTagText}>{recipe.prepTime + recipe.cookTime}'</Text>
            </View>
            <View style={styles.recipeTag}>
              <Text style={styles.recipeTagText}>{recipe.difficulty}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>

        <View style={styles.recipeMacros}>
          <View style={styles.recipeMacroItem}>
            <Text style={[styles.recipeMacroValue, { color: category.color }]}>
              {recipe.caloriesPerPortion}
            </Text>
            <Text style={styles.recipeMacroLabel}>קל/מנה</Text>
          </View>
          <View style={styles.recipeMacroSeparator} />
          <View style={styles.recipeMacroItem}>
            <Text style={styles.recipeMacroValue}>{recipe.proteinPerPortion}ג</Text>
            <Text style={styles.recipeMacroLabel}>חלבון</Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

function RecipeDetail({ recipe, calorieBudget, onClose }) {
  const category = RECIPE_CATEGORIES.find((c) => c.id === recipe.category);
  const portionData = calculatePortions(recipe, calorieBudget);
  const slideAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: USE_NATIVE_DRIVER,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(() => onClose());
  };

  return (
    <Animated.View style={[styles.detailContainer, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight, COLORS.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.detailContent, { transform: [{ translateX: slideAnim }] }]}>
        <ScrollView
          contentContainerStyle={styles.detailScroll}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <MaterialIcons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.detailHero}>
            <View style={[styles.detailIconBg, { backgroundColor: category.color + '25' }]}>
              <MaterialIcons name={category.icon} size={48} color={category.color} />
            </View>
            <Text style={styles.detailRecipeName}>{recipe.name}</Text>
            <View style={styles.detailMetaRow}>
              <View style={styles.detailMetaItem}>
                <MaterialIcons name="schedule" size={14} color={COLORS.textMuted} />
                <Text style={styles.detailMetaText}>{recipe.prepTime + recipe.cookTime} דק׳</Text>
              </View>
              <View style={styles.detailMetaDot} />
              <View style={styles.detailMetaItem}>
                <MaterialIcons name="bar-chart" size={14} color={COLORS.textMuted} />
                <Text style={styles.detailMetaText}>{recipe.difficulty}</Text>
              </View>
              <View style={styles.detailMetaDot} />
              <View style={styles.detailMetaItem}>
                <MaterialIcons name="restaurant" size={14} color={COLORS.textMuted} />
                <Text style={styles.detailMetaText}>{recipe.totalServings} מנות</Text>
              </View>
            </View>
          </View>

          {/* Calorie Budget Card */}
          <GlassCard
            gradientColors={[category.color + '25', category.color + '10']}
            borderColor={category.color + '40'}
            style={styles.budgetCard}
            glow
          >
            <View style={styles.budgetHeader}>
              <View>
                <Text style={styles.budgetLabel}>בתקציב {calorieBudget} קל אתה יכול לאכול:</Text>
              </View>
            </View>

            <View style={styles.budgetMain}>
              <View style={styles.budgetLeft}>
                <Text style={[styles.budgetBigNumber, { color: category.color }]}>
                  {portionData.portions}
                </Text>
                <Text style={styles.budgetUnit}>{recipe.portion}</Text>
                <Text style={styles.budgetSubtext}>
                  ({portionData.calories} קל מתוך {calorieBudget})
                </Text>

                {portionData.remainingBudget > 0 && (
                  <View style={styles.remainingBadge}>
                    <MaterialIcons name="add" size={12} color={COLORS.secondary} />
                    <Text style={styles.remainingText}>נשארו {portionData.remainingBudget} קל פנויות</Text>
                  </View>
                )}
              </View>

              <View style={styles.budgetRight}>
                <ProgressRing
                  size={100}
                  strokeWidth={8}
                  progress={portionData.calories / calorieBudget}
                  gradientId="budgetRing"
                  gradientColors={[category.color, COLORS.tertiary]}
                >
                  <Text style={styles.budgetRingValue}>
                    {Math.round((portionData.calories / calorieBudget) * 100)}%
                  </Text>
                  <Text style={styles.budgetRingLabel}>מהיעד</Text>
                </ProgressRing>
              </View>
            </View>

            {/* Macros breakdown for selected portions */}
            {portionData.portions > 0 && (
              <View style={styles.budgetMacros}>
                <View style={[styles.budgetMacroChip, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
                  <Text style={[styles.budgetMacroValue, { color: COLORS.success }]}>
                    {portionData.totalProtein}ג
                  </Text>
                  <Text style={styles.budgetMacroLabel}>חלבון</Text>
                </View>
                <View style={[styles.budgetMacroChip, { backgroundColor: 'rgba(255,159,10,0.15)' }]}>
                  <Text style={[styles.budgetMacroValue, { color: COLORS.secondary }]}>
                    {portionData.totalCarbs}ג
                  </Text>
                  <Text style={styles.budgetMacroLabel}>פחמ׳</Text>
                </View>
                <View style={[styles.budgetMacroChip, { backgroundColor: 'rgba(255,55,95,0.15)' }]}>
                  <Text style={[styles.budgetMacroValue, { color: COLORS.primary }]}>
                    {portionData.totalFat}ג
                  </Text>
                  <Text style={styles.budgetMacroLabel}>שומן</Text>
                </View>
              </View>
            )}
          </GlassCard>

          {/* Ingredients */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>מרכיבים</Text>
              <View style={[styles.sectionLine, { backgroundColor: category.color + '40' }]} />
            </View>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <Text style={styles.ingredientCal}>{ing.cal} קל</Text>
                  <View style={styles.ingredientRight}>
                    <Text style={styles.ingredientAmount}>
                      {ing.amount} {ing.unit}
                    </Text>
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>אופן הכנה</Text>
              <View style={[styles.sectionLine, { backgroundColor: category.color + '40' }]} />
            </View>
            <View style={styles.stepsList}>
              {recipe.instructions.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: category.color }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>טיפים</Text>
                <View style={[styles.sectionLine, { backgroundColor: COLORS.secondary + '40' }]} />
              </View>
              {recipe.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <MaterialIcons name="lightbulb" size={16} color={COLORS.secondary} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

export default function RecipeGeneratorScreen({ navigation }) {
  const { userProfile } = useAuth();
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [calorieBudget, setCalorieBudget] = useState(
    String(userProfile?.dailyCalories || 500)
  );

  const filteredRecipes = useMemo(() => {
    let result = RECIPES;
    if (selectedCategory) {
      result = getRecipesByCategory(selectedCategory);
    }
    if (searchQuery.trim()) {
      result = searchRecipes(searchQuery);
      if (selectedCategory) {
        result = result.filter((r) => r.category === selectedCategory);
      }
    }
    return result;
  }, [selectedCategory, searchQuery]);

  return (
    <View style={styles.root}>
      <AuroraBackground intensity={0.5} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        {/* Header */}
        <FadeInView style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack?.()}
          >
            <MaterialIcons name={RTL_ICONS.back} size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.title}>מתכונים חכמים</Text>
            <Text style={styles.subtitle}>חישוב מנות לפי הקלוריות שלך</Text>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.navigate?.('Main')}
          >
            <MaterialIcons name="home" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </FadeInView>

        {/* Calorie Budget Input */}
        <GlassCard
          gradientColors={['rgba(255,55,95,0.15)', 'rgba(255,159,10,0.08)']}
          borderColor="rgba(255,55,95,0.3)"
          delay={100}
          style={styles.budgetInputCard}
        >
          <View style={styles.budgetInputContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.budgetInputLabel}>תקציב קלוריות לארוחה</Text>
              <View style={styles.budgetInputRow}>
                <TextInput
                  style={styles.budgetInput}
                  value={calorieBudget}
                  onChangeText={setCalorieBudget}
                  keyboardType="numeric"
                  textAlign="right"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.budgetInputUnit}>קל</Text>
              </View>
            </View>
            <View style={styles.budgetIconBg}>
              <MaterialIcons name="local-fire-department" size={28} color={COLORS.primary} />
            </View>
          </View>
        </GlassCard>

        {/* Search */}
        <FadeInView delay={200} style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש מתכון (קציצות, שווארמה...)"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </FadeInView>

        {/* Categories */}
        <FadeInView delay={300}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
            bounces={false}
            alwaysBounceHorizontal={false}
            overScrollMode="never"
          >
            <CategoryChip
              category={{ id: null, name: 'הכל', icon: 'apps', color: COLORS.primary }}
              active={!selectedCategory}
              onPress={() => setSelectedCategory(null)}
            />
            {RECIPE_CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.id}
                category={cat}
                active={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(cat.id)}
              />
            ))}
          </ScrollView>
        </FadeInView>

        {/* Results count */}
        <FadeInView delay={400} style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredRecipes.length} מתכונים זמינים
          </Text>
          <View style={styles.aiBadge}>
            <MaterialIcons name="auto-awesome" size={12} color={COLORS.tertiary} />
            <Text style={styles.aiBadgeText}>בקרוב: יצירת מתכונים AI</Text>
          </View>
        </FadeInView>

        {/* Recipes Grid */}
        <View style={styles.grid}>
          {filteredRecipes.map((recipe, idx) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              delay={500 + idx * 50}
              onPress={() => setSelectedRecipe(recipe)}
            />
          ))}
        </View>

        {filteredRecipes.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>לא נמצאו מתכונים</Text>
            <Text style={styles.emptySubtext}>נסה חיפוש אחר</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Detail overlay */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          calorieBudget={parseInt(calorieBudget) || 500}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
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
  scrollContent: {
    paddingTop: SPACING.xxl + SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: 160,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: '800',
    textAlign: 'right',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginTop: 2,
  },

  // Budget Input
  budgetInputCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  budgetInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetInputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  budgetInput: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '900',
    minWidth: 100,
    padding: 0,
  },
  budgetInputUnit: {
    color: COLORS.textMuted,
    fontSize: FONTS.medium,
    fontWeight: '600',
  },
  budgetIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.regular,
    paddingVertical: SPACING.sm,
  },

  // Categories
  categoriesScroll: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: 2,
    marginBottom: SPACING.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  categoryChipText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    fontWeight: '600',
  },

  // Results header
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.md,
  },
  resultsText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(160,108,213,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(160,108,213,0.3)',
  },
  aiBadgeText: {
    color: COLORS.tertiary,
    fontSize: 10,
    fontWeight: '600',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  recipeCard: {
    width: (width - SPACING.md * 2 - SPACING.md) / 2,
    padding: 0,
    minHeight: 180,
  },
  recipeCardContent: {
    padding: SPACING.md,
    height: '100%',
    justifyContent: 'space-between',
  },
  recipeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  recipeCategoryDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeTags: {
    flexDirection: 'row',
    gap: 4,
  },
  recipeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 999,
    gap: 2,
  },
  recipeTagText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  recipeName: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '700',
    textAlign: 'right',
    marginVertical: SPACING.sm,
    lineHeight: 22,
  },
  recipeMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  recipeMacroItem: {
    alignItems: 'flex-end',
  },
  recipeMacroValue: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
  },
  recipeMacroLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.micro,
    marginTop: 2,
  },
  recipeMacroSeparator: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    marginTop: SPACING.xs,
  },

  // Detail overlay
  detailContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  detailContent: {
    flex: 1,
  },
  detailScroll: {
    paddingTop: SPACING.xxl + SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING.xxl + SPACING.md,
    left: SPACING.md,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailHero: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.lg,
  },
  detailIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  detailRecipeName: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailMetaText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
  },
  detailMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
  },

  // Budget Card
  budgetCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  budgetHeader: {
    marginBottom: SPACING.md,
  },
  budgetLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'right',
  },
  budgetMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  budgetLeft: {
    flex: 1,
    alignItems: 'flex-end',
  },
  budgetRight: {
    marginStart: SPACING.md,
  },
  budgetBigNumber: {
    fontSize: 72,
    fontWeight: '900',
    lineHeight: 76,
  },
  budgetUnit: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '600',
    marginTop: -SPACING.xs,
  },
  budgetSubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: SPACING.xs,
  },
  remainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,159,10,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: SPACING.sm,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.3)',
  },
  remainingText: {
    color: COLORS.secondary,
    fontSize: FONTS.tiny,
    fontWeight: '600',
  },
  budgetRingValue: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  budgetRingLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
  },
  budgetMacros: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  budgetMacroChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  budgetMacroValue: {
    fontSize: FONTS.medium,
    fontWeight: '800',
  },
  budgetMacroLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.micro,
    marginTop: 2,
  },

  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: '800',
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },

  // Ingredients
  ingredientsList: {
    gap: 1,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginBottom: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  ingredientRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  ingredientName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
  ingredientAmount: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 2,
  },
  ingredientCal: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: '700',
  },

  // Steps
  stepsList: {
    gap: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '900',
  },
  stepText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.regular,
    lineHeight: 22,
    textAlign: 'right',
  },

  // Tips
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: 'rgba(255,159,10,0.08)',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.2)',
  },
  tipText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.small,
    lineHeight: 20,
    textAlign: 'right',
  },
});
