import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';

const GLASS_SIZE = 250; // ml per glass

export default function WaterTrackingScreen({ navigation }) {
  const [dailyGoal] = useState(3500); // ml
  const [consumed, setConsumed] = useState(0);
  const [log, setLog] = useState([]);

  const totalGlasses = Math.ceil(dailyGoal / GLASS_SIZE);
  const filledGlasses = Math.floor(consumed / GLASS_SIZE);
  const progress = Math.min(consumed / dailyGoal, 1);

  const addWater = (amount) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setConsumed((prev) => prev + amount);
    setLog((prev) => [{ time, amount, id: Date.now() }, ...prev]);
  };

  const removeLastEntry = () => {
    if (log.length === 0) return;
    const lastEntry = log[0];
    setConsumed((prev) => Math.max(0, prev - lastEntry.amount));
    setLog((prev) => prev.slice(1));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-forward" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>מעקב מים</Text>
        <MaterialIcons name="water-drop" size={28} color={COLORS.primary} />
      </View>

      <View style={styles.progressSection}>
        <View style={styles.circleContainer}>
          <View style={styles.circleOuter}>
            <View style={[styles.circleFill, { height: `${progress * 100}%` }]} />
            <View style={styles.circleContent}>
              <MaterialIcons name="water-drop" size={36} color={COLORS.primary} />
              <Text style={styles.consumedText}>{(consumed / 1000).toFixed(1)}</Text>
              <Text style={styles.unitText}>ליטר</Text>
              <Text style={styles.goalText}>מתוך {(dailyGoal / 1000).toFixed(1)} ליטר</Text>
            </View>
          </View>
        </View>

        <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
      </View>

      <View style={styles.glassesGrid}>
        {Array.from({ length: totalGlasses }, (_, i) => (
          <View key={i} style={styles.glassItem}>
            <MaterialIcons
              name="local-drink"
              size={32}
              color={i < filledGlasses ? COLORS.primary : COLORS.surfaceLight}
            />
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={() => addWater(250)}>
          <MaterialIcons name="local-drink" size={24} color={COLORS.text} />
          <Text style={styles.quickButtonText}>כוס (250 מ"ל)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => addWater(500)}>
          <MaterialIcons name="water-drop" size={24} color={COLORS.text} />
          <Text style={styles.quickButtonText}>בקבוק (500 מ"ל)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => addWater(750)}>
          <MaterialIcons name="water" size={24} color={COLORS.text} />
          <Text style={styles.quickButtonText}>בקבוק גדול (750 מ"ל)</Text>
        </TouchableOpacity>
      </View>

      {log.length > 0 && (
        <TouchableOpacity style={styles.undoButton} onPress={removeLastEntry}>
          <MaterialIcons name="undo" size={18} color={COLORS.primary} />
          <Text style={styles.undoText}>בטל אחרון</Text>
        </TouchableOpacity>
      )}

      {log.length > 0 && (
        <View style={styles.logSection}>
          <Text style={styles.logTitle}>יומן שתייה היום</Text>
          {log.map((entry) => (
            <View key={entry.id} style={styles.logEntry}>
              <Text style={styles.logAmount}>{entry.amount} מ"ל</Text>
              <Text style={styles.logTime}>{entry.time}</Text>
              <MaterialIcons name="local-drink" size={16} color={COLORS.primary} />
            </View>
          ))}
        </View>
      )}
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  backButton: {
    marginLeft: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  progressSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  circleContainer: {
    width: 200,
    height: 200,
  },
  circleOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: COLORS.surface,
  },
  circleFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary + '30',
  },
  circleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consumedText: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  unitText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
  },
  goalText: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: SPACING.xs,
  },
  percentText: {
    color: COLORS.primary,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  glassesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  glassItem: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  quickButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  quickButtonText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
  undoButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  undoText: {
    color: COLORS.primary,
    fontSize: FONTS.small,
  },
  logSection: {
    margin: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  logTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  logEntry: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  logTime: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    flex: 1,
    textAlign: 'right',
  },
  logAmount: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
});
