import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { DEFAULT_PROGRAMS, EXERCISES } from '../data/exercises';

function ExerciseCard({ exercise, programExercise, onUpdateSet }) {
  const exerciseData = EXERCISES[programExercise.muscleGroup]?.find(
    (e) => e.id === programExercise.exerciseId
  );
  const sets = Array.from({ length: programExercise.sets }, (_, i) => i + 1);

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exerciseData?.name || programExercise.exerciseId}</Text>
          <Text style={styles.exerciseInfo}>
            {programExercise.reps} חזרות, {programExercise.sets} סטים
          </Text>
        </View>
        <TouchableOpacity style={styles.playButton}>
          <MaterialIcons name="play-circle-outline" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {sets.map((setNum) => (
        <View key={setNum} style={styles.setRow}>
          <View style={styles.setField}>
            <Text style={styles.setLabel}>RIR</Text>
            <TouchableOpacity style={styles.setButton}>
              <Text style={styles.setButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.setField}>
            <Text style={styles.setLabel}>RPE</Text>
            <TouchableOpacity style={styles.setButton}>
              <Text style={styles.setButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.setFieldInput}>
            <TextInput
              style={styles.input}
              placeholder={programExercise.reps.split('-')[0]}
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.setLabel}>חזרות</Text>
          </View>
          <View style={styles.setFieldInput}>
            <TextInput
              style={styles.input}
              placeholder="___"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.setLabel}>קילו</Text>
          </View>
          <View style={styles.setNumber}>
            <Text style={styles.setNumberText}>{setNum}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function WorkoutScreen() {
  const [activeProgram, setActiveProgram] = useState('A');
  const programs = ['A', 'B', 'בטן', 'אירובי'];

  const currentProgram = DEFAULT_PROGRAMS[activeProgram];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="fitness-center" size={32} color={COLORS.primary} />
        <Text style={styles.title}>SMIT GYM</Text>
      </View>

      <View style={styles.tabBar}>
        {programs.map((prog) => (
          <TouchableOpacity
            key={prog}
            style={[styles.tab, activeProgram === prog && styles.activeTab]}
            onPress={() => setActiveProgram(prog)}
          >
            <Text style={[styles.tabText, activeProgram === prog && styles.activeTabText]}>
              {prog}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.startButton}>
        <MaterialIcons name="chat" size={24} color={COLORS.text} />
        <Text style={styles.startButtonText}>התחלת אימון</Text>
      </TouchableOpacity>

      {currentProgram?.exercises.map((exercise, index) => (
        <ExerciseCard key={index} programExercise={exercise} />
      ))}

      {!currentProgram && (
        <View style={styles.emptyState}>
          <MaterialIcons name="fitness-center" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>
            {activeProgram === 'בטן' ? 'תרגילי בטן' : 'תוכנית אירובי'}
          </Text>
          <Text style={styles.emptySubtext}>בקרוב...</Text>
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
    alignItems: 'center',
    padding: SPACING.md,
  },
  title: {
    color: COLORS.primary,
    fontSize: FONTS.large,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  tabBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xs,
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.text,
  },
  startButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  startButtonText: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  exerciseCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  exerciseHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  exerciseInfo: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  playButton: {
    marginLeft: SPACING.md,
  },
  setRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
    padding: SPACING.sm,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: 'bold',
  },
  setField: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  setFieldInput: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  setLabel: {
    color: COLORS.primary,
    fontSize: FONTS.tiny,
    fontWeight: '600',
  },
  setButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: 'bold',
  },
  input: {
    color: COLORS.text,
    fontSize: FONTS.small,
    textAlign: 'center',
    minWidth: 40,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: FONTS.large,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.regular,
    marginTop: SPACING.sm,
  },
});
