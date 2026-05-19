import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { MEAL_TYPES, FOOD_CATEGORIES } from '../data/nutrition';

function MealCard({ meal, isExpanded, onToggle }) {
  return (
    <View style={styles.mealCard}>
      <TouchableOpacity style={styles.mealHeader} onPress={onToggle} activeOpacity={0.7}>
        <MaterialIcons
          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={28}
          color={COLORS.primary}
        />
        <Text style={styles.mealTitle}>
          {meal.name} | {meal.defaultCalories} קלוריות (ח)
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.mealContent}>
          <Text style={styles.mealDescription}>
            לבחירתך אחת מהאופציות הבאות:
          </Text>
          {meal.id === 'breakfast' && (
            <View style={styles.optionsList}>
              <Text style={styles.optionItem}>• גביע קוטג׳ 3% (250 ג)</Text>
              <Text style={styles.optionItem}>• גביע גבינה 3%</Text>
              <Text style={styles.optionItem}>• מעדן חלבון פרו (פס אפור) + 50 קלוריות חופשיות נוספות</Text>
              <Text style={styles.optionItem}>• מלפפון (אופציונלי)</Text>
            </View>
          )}
          {meal.id === 'lunch' && (
            <View style={styles.optionsList}>
              <Text style={styles.sectionTitle}>300 קלוריות של פחמימה:</Text>
              <Text style={styles.optionItem}>• פסטה 160 גרם, אפשר עם רוטב עגבניות ביתי</Text>
              <Text style={styles.optionItem}>• או אורז 220 ג</Text>
              <Text style={styles.optionItem}>• או פירה 320 ג</Text>
              <Text style={styles.optionItem}>• או 3 פיתות / פרוסות כוסמין</Text>
              <Text style={styles.sectionTitle}>350-400 קלוריות של חלבון רזה:</Text>
              <Text style={styles.optionItem}>• 250 ג חזה עוף בספריי שמן בלבד</Text>
              <Text style={styles.optionItem}>• או 250 ג בשר שייטל</Text>
              <Text style={styles.optionItem}>• או 220 גרם פרגית בספריי שמן בלבד</Text>
              <Text style={styles.optionItem}>• או 220 ג דג מסוג טונה / אמנון</Text>
            </View>
          )}
          {meal.id === 'pre_workout' && (
            <View style={styles.optionsList}>
              <Text style={styles.optionItem}>תבחר 1 מהאופציות הבאות:</Text>
              <Text style={styles.optionItem}>• בננה</Text>
              <Text style={styles.optionItem}>• תפוח גדול</Text>
              <Text style={styles.optionItem}>• פרוסת לחם לבן + ממרח לבחירתך</Text>
              <Text style={styles.optionItem}>• חטיף אנרגיה עד 100 קל</Text>
              <Text style={styles.optionItem}>• 3 תמרים</Text>
              <Text style={styles.optionItem}>• קפה / פרה וורקאאוט / קפאין</Text>
            </View>
          )}
          {meal.id === 'dinner' && (
            <View style={styles.optionsList}>
              <Text style={styles.optionItem}>אופציה א - כמו כל האופציות בארוחת הצהריים</Text>
              <Text style={styles.optionItem}>אופציה ב - פיצה כוסמין קוטג</Text>
              <Text style={styles.optionItem}>אופציה ג - טוסט כוסמין וגבינה צהובה דלת שומן</Text>
            </View>
          )}
          {meal.id === 'free_calories' && (
            <View style={styles.optionsList}>
              <Text style={styles.optionItem}>• קלוריות שאתה יכול לאכול איתן מה שאתה רוצה, מתי שאתה רוצה, אסור לוותר עליהן!</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function NutritionScreen({ navigation }) {
  const [expandedMeal, setExpandedMeal] = useState(null);

  const quickActions = [
    { title: 'תפריט התזונה שלי', icon: 'restaurant-menu', action: () => {} },
    { title: 'ערכים יומיים', icon: 'bar-chart', action: () => {} },
    { title: 'מעקב מים', icon: 'water-drop', action: () => navigation?.navigate?.('WaterTracking') },
    { title: 'רשימת קניות', icon: 'shopping-cart', action: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="restaurant" size={32} color={COLORS.primary} />
        <Text style={styles.title}>תזונה</Text>
      </View>

      <View style={styles.actionsGrid}>
        {quickActions.map((action, index) => (
          <TouchableOpacity key={index} style={styles.actionCard} onPress={action.action}>
            <MaterialIcons name={action.icon} size={36} color={COLORS.primary} />
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.aiSuggestionButton}
        onPress={() => navigation?.navigate?.('AIChat')}
      >
        <MaterialIcons name="smart-toy" size={20} color={COLORS.primary} />
        <Text style={styles.aiSuggestionText}>רוצה להחליף מזון? שאל את ה-AI</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>תפריט יומי</Text>

      {MEAL_TYPES.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          isExpanded={expandedMeal === meal.id}
          onToggle={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.xxl,
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
  actionsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionText: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '600',
    textAlign: 'center',
  },
  aiSuggestionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    gap: SPACING.sm,
  },
  aiSuggestionText: {
    color: COLORS.primary,
    fontSize: FONTS.small,
  },
  sectionHeader: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
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
  mealTitle: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  mealContent: {
    padding: SPACING.md,
  },
  mealDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginBottom: SPACING.sm,
  },
  optionsList: {
    gap: SPACING.xs,
  },
  optionItem: {
    color: COLORS.text,
    fontSize: FONTS.small,
    textAlign: 'right',
    lineHeight: 22,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
});
