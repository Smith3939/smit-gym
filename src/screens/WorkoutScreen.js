import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import {
  generateProgram,
  getAvailableProgramTypes,
  suggestProgramType,
  swapExerciseInProgram,
  PROGRAM_TYPES,
} from '../services/workoutEngine';
import { requestExerciseSwap, requestSessionVariation } from '../services/aiWorkoutService';

// ─── Program Selector Modal ─────────────────────────────────────────────────
function ProgramSelectorModal({ visible, onClose, onSelect, currentType, suggestedType }) {
  const programTypes = getAvailableProgramTypes();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>בחר סוג תוכנית</Text>
            <MaterialIcons name="fitness-center" size={24} color={COLORS.primary} />
          </View>

          <ScrollView>
            {programTypes.map((pt) => (
              <TouchableOpacity
                key={pt.id}
                style={[
                  styles.programOption,
                  currentType === pt.id && styles.programOptionActive,
                ]}
                onPress={() => onSelect(pt.id)}
              >
                <View style={styles.programOptionHeader}>
                  <Text style={styles.programOptionName}>{pt.name}</Text>
                  {suggestedType === pt.id && (
                    <View style={styles.suggestedBadge}>
                      <Text style={styles.suggestedText}>מומלץ</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.programOptionDesc}>{pt.description}</Text>
                <Text style={styles.programOptionDays}>{pt.days} ימי אימון</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Exercise Swap Modal ────────────────────────────────────────────────────
function ExerciseSwapModal({ visible, onClose, alternatives, reasoning, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>החלפת תרגיל</Text>
            <MaterialIcons name="swap-horiz" size={24} color={COLORS.primary} />
          </View>

          {reasoning && <Text style={styles.modalReasoning}>{reasoning}</Text>}

          <ScrollView style={styles.modalScroll}>
            {alternatives.map((alt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.altCard}
                onPress={() => onSelect(alt)}
              >
                <Text style={styles.altName}>{alt.name}</Text>
                <Text style={styles.altDetails}>
                  {alt.sets} סטים | {alt.reps} חזרות
                </Text>
                {alt.reason && <Text style={styles.altReason}>{alt.reason}</Text>}
                {alt.benefit && <Text style={styles.altBenefit}>{alt.benefit}</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Exercise Card Component ────────────────────────────────────────────────
function ExerciseCard({ exercise, index, onSwap, onUpdateSet, setLogs, swapping }) {
  const sets = Array.from({ length: exercise.sets || 3 }, (_, i) => i + 1);
  const logKey = `${exercise.exerciseId}_${index}`;

  return (
    <View style={[styles.exerciseCard, exercise.isWarmup && styles.warmupCard]}>
      <View style={styles.exerciseHeader}>
        <TouchableOpacity
          style={styles.swapBtn}
          onPress={() => onSwap(exercise, index)}
          disabled={swapping || exercise.isWarmup || exercise.isCardio}
        >
          {swapping ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <MaterialIcons
              name="swap-horiz"
              size={20}
              color={exercise.isWarmup || exercise.isCardio ? COLORS.textMuted : COLORS.primary}
            />
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseInfo}>
            {exercise.sets} סטים | {exercise.reps} חזרות
            {exercise.isCompound && ' | מורכב'}
            {exercise.isWarmup && ' | חימום'}
            {exercise.isCardio && ' | אירובי'}
          </Text>
        </View>
        {exercise.isCompound && (
          <View style={styles.compoundBadge}>
            <MaterialIcons name="star" size={14} color={COLORS.primary} />
          </View>
        )}
      </View>

      {/* Set Logging Rows */}
      {!exercise.isCardio && sets.map((setNum) => {
        const setLog = setLogs?.[logKey]?.[setNum] || {};
        return (
          <View key={setNum} style={styles.setRow}>
            <View style={styles.setFieldInput}>
              <TextInput
                style={styles.input}
                placeholder={exercise.reps?.split('-')?.[0] || '10'}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={setLog.reps || ''}
                onChangeText={(text) => onUpdateSet(logKey, setNum, 'reps', text)}
              />
              <Text style={styles.setLabel}>חזרות</Text>
            </View>
            <View style={styles.setFieldInput}>
              <TextInput
                style={styles.input}
                placeholder="___"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={setLog.weight || ''}
                onChangeText={(text) => onUpdateSet(logKey, setNum, 'weight', text)}
              />
              <Text style={styles.setLabel}>ק"ג</Text>
            </View>
            <View style={styles.setNumber}>
              <Text style={styles.setNumberText}>{setNum}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Workout Screen ────────────────────────────────────────────────────
export default function WorkoutScreen() {
  const { userProfile } = useAuth();
  const [program, setProgram] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [setLogs, setSetLogs] = useState({});
  const [swapModal, setSwapModal] = useState({
    visible: false,
    alternatives: [],
    reasoning: '',
    exerciseIndex: null,
  });

  const suggestedType = suggestProgramType(userProfile?.activityLevel);

  // Generate program on first load or when goal changes
  useEffect(() => {
    if (userProfile) {
      const goal = userProfile.goal || 'cut';
      const type = suggestProgramType(userProfile.activityLevel);
      const newProgram = generateProgram(type, goal);
      setProgram(newProgram);
      setActiveDay(Object.keys(newProgram.sessions)[0]);
    }
  }, [userProfile?.goal, userProfile?.activityLevel]);

  // Handle program type selection
  const handleSelectProgram = useCallback((programType) => {
    const goal = userProfile?.goal || 'cut';
    const newProgram = generateProgram(programType, goal);
    setProgram(newProgram);
    setActiveDay(Object.keys(newProgram.sessions)[0]);
    setShowProgramSelector(false);
    setSetLogs({});
  }, [userProfile]);

  // Handle exercise swap
  const handleSwapExercise = useCallback(async (exercise, exerciseIndex) => {
    if (!program || !activeDay) return;

    setSwapping(true);
    const currentSession = program.sessions[activeDay];
    const currentProgramIds = currentSession.exercises.map((ex) => ex.exerciseId);

    try {
      const result = await requestExerciseSwap(
        exercise,
        userProfile,
        currentProgramIds
      );

      if (result && result.alternatives && result.alternatives.length > 0) {
        setSwapModal({
          visible: true,
          alternatives: result.alternatives,
          reasoning: result.reasoning || '',
          exerciseIndex,
        });
      } else {
        Alert.alert('אין חלופות', 'לא נמצאו תרגילים חלופיים מתאימים');
      }
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן לטעון חלופות כרגע');
    } finally {
      setSwapping(false);
    }
  }, [program, activeDay, userProfile]);

  // Handle selecting an alternative
  const handleSelectAlternative = useCallback((alternative) => {
    const { exerciseIndex } = swapModal;
    const updatedProgram = swapExerciseInProgram(program, activeDay, exerciseIndex, alternative);
    setProgram(updatedProgram);
    setSwapModal({ visible: false, alternatives: [], reasoning: '', exerciseIndex: null });
    Alert.alert('✅ הוחלף!', `${alternative.name}`);
  }, [program, activeDay, swapModal]);

  // Handle AI variation for entire day
  const handleVariateDay = useCallback(async () => {
    if (!program || !activeDay) return;

    Alert.alert(
      'גיוון אימון',
      'האם לגוון את כל התרגילים באימון הזה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'גוון!',
          onPress: async () => {
            setSwapping(true);
            try {
              const currentSession = program.sessions[activeDay];
              const result = await requestSessionVariation(currentSession, userProfile, 'similar');

              if (result && result.exercises && result.exercises.length > 0) {
                const updatedProgram = JSON.parse(JSON.stringify(program));
                updatedProgram.sessions[activeDay].exercises = result.exercises;
                updatedProgram.updatedAt = new Date().toISOString();
                setProgram(updatedProgram);
                Alert.alert('✅ גוון!', result.reasoning || 'האימון עודכן בהצלחה');
              } else {
                Alert.alert('שגיאה', 'לא ניתן לגוון כרגע, נסה שוב מאוחר יותר');
              }
            } catch (error) {
              Alert.alert('שגיאה', 'לא ניתן לגוון כרגע');
            } finally {
              setSwapping(false);
            }
          },
        },
      ]
    );
  }, [program, activeDay, userProfile]);

  // Handle set logging
  const handleUpdateSet = useCallback((logKey, setNum, field, value) => {
    setSetLogs((prev) => ({
      ...prev,
      [logKey]: {
        ...(prev[logKey] || {}),
        [setNum]: {
          ...(prev[logKey]?.[setNum] || {}),
          [field]: value,
        },
      },
    }));
  }, []);

  // If no program yet
  if (!program) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="fitness-center" size={64} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>בוא נתחיל!</Text>
        <Text style={styles.emptySubtext}>עדכן את הפרופיל שלך כדי לקבל תוכנית אימון מותאמת</Text>
      </View>
    );
  }

  const currentSession = program.sessions[activeDay];
  const dayKeys = Object.keys(program.sessions);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="fitness-center" size={32} color={COLORS.primary} />
        <Text style={styles.title}>SMIT GYM</Text>
      </View>

      {/* Program Info Bar */}
      <TouchableOpacity
        style={styles.programInfoBar}
        onPress={() => setShowProgramSelector(true)}
      >
        <MaterialIcons name="keyboard-arrow-down" size={24} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.programDesc}>{program.description}</Text>
        </View>
        <MaterialIcons name="swap-vert" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Day Tabs */}
      <View style={styles.tabBar}>
        {dayKeys.map((dayKey) => (
          <TouchableOpacity
            key={dayKey}
            style={[styles.tab, activeDay === dayKey && styles.activeTab]}
            onPress={() => setActiveDay(dayKey)}
          >
            <Text style={[styles.tabText, activeDay === dayKey && styles.activeTabText]}>
              {dayKey}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Session Header */}
      {currentSession && (
        <View style={styles.sessionHeader}>
          <TouchableOpacity style={styles.variateButton} onPress={handleVariateDay}>
            <MaterialIcons name="auto-fix-high" size={18} color={COLORS.primary} />
            <Text style={styles.variateText}>גוון עם AI</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.sessionName}>{currentSession.name}</Text>
            <Text style={styles.sessionMeta}>
              {currentSession.exercises.length} תרגילים | ~{currentSession.estimatedDuration} דקות
            </Text>
          </View>
        </View>
      )}

      {/* Exercise List */}
      {currentSession?.exercises.map((exercise, index) => (
        <ExerciseCard
          key={`${exercise.exerciseId}_${index}`}
          exercise={exercise}
          index={index}
          onSwap={handleSwapExercise}
          onUpdateSet={handleUpdateSet}
          setLogs={setLogs}
          swapping={swapping}
        />
      ))}

      {/* Finish Workout Button */}
      <TouchableOpacity style={styles.finishButton}>
        <MaterialIcons name="check-circle" size={24} color={COLORS.text} />
        <Text style={styles.finishButtonText}>סיים אימון</Text>
      </TouchableOpacity>

      {/* Modals */}
      <ProgramSelectorModal
        visible={showProgramSelector}
        onClose={() => setShowProgramSelector(false)}
        onSelect={handleSelectProgram}
        currentType={program.type}
        suggestedType={suggestedType}
      />

      <ExerciseSwapModal
        visible={swapModal.visible}
        onClose={() => setSwapModal({ ...swapModal, visible: false })}
        alternatives={swapModal.alternatives}
        reasoning={swapModal.reasoning}
        onSelect={handleSelectAlternative}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
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

  // Program Info Bar
  programInfoBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  programName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  programDesc: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: 2,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.text,
  },

  // Session Header
  sessionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
  },
  sessionName: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  sessionMeta: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: 2,
  },
  variateButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  variateText: {
    color: COLORS.primary,
    fontSize: FONTS.tiny,
    fontWeight: '600',
  },

  // Exercise Card
  exerciseCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  warmupCard: {
    borderColor: COLORS.warning,
    opacity: 0.85,
  },
  exerciseHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  exerciseInfo: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: 2,
  },
  compoundBadge: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
  },
  swapBtn: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,
  },

  // Set Rows
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
  input: {
    color: COLORS.text,
    fontSize: FONTS.small,
    textAlign: 'center',
    minWidth: 40,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 2,
  },

  // Finish Button
  finishButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  finishButtonText: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
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
    maxHeight: '75%',
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

  // Program Selector
  programOption: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  programOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDark + '20',
  },
  programOptionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  programOptionName: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
  },
  programOptionDesc: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  programOptionDays: {
    color: COLORS.primary,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  suggestedBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  suggestedText: {
    color: COLORS.text,
    fontSize: FONTS.tiny,
    fontWeight: 'bold',
  },

  // Exercise Swap Modal
  altCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  altName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
    textAlign: 'right',
  },
  altDetails: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  altReason: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  altBenefit: {
    color: COLORS.success,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: 2,
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
  },
});
