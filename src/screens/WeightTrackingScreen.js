import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import SimpleChart from '../components/SimpleChart';
import { useToast } from '../components/Toast';
import { PHYSICAL_ROW, PHYSICAL_ROW_CENTER, RTL_ICONS, RTL_ROW_CENTER } from '../utils/rtl';

export default function WeightTrackingScreen({ navigation }) {
  const toast = useToast();
  const [currentWeight, setCurrentWeight] = useState(70.0);
  const [weightHistory, setWeightHistory] = useState([
    { date: '05/05/26', time: '08:10', weight: 70.0 },
    { date: '01/05/26', time: '08:05', weight: 70.5 },
    { date: '28/04/26', time: '08:12', weight: 71.0 },
    { date: '24/04/26', time: '08:08', weight: 70.8 },
    { date: '21/04/26', time: '08:15', weight: 71.2 },
  ]);
  const weightProgress = `${((currentWeight - 40) / 120) * 100}%`;

  const adjustWeight = (amount) => {
    setCurrentWeight((prev) => Math.round((prev + amount) * 10) / 10);
  };

  const submitWeight = () => {
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(2)}`;
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setWeightHistory((prev) => [{ date, time, weight: currentWeight }, ...prev]);
    toast.success(`המשקל ${currentWeight} ק"ג נשמר בהצלחה ⚖️`);
  };

  return (
    <ScrollView
      style={styles.container}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <MaterialIcons name={RTL_ICONS.back} size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MaterialIcons name="monitor-weight" size={28} color={COLORS.tertiary} />
          <Text style={styles.title}>משקל נוכחי</Text>
        </View>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.navigate?.('Main')}
        >
          <MaterialIcons name="home" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weightDisplay}>
        <Text style={styles.weightNumber}>{currentWeight.toFixed(1)}</Text>
        <Text style={styles.weightUnit}>KG</Text>
      </View>

      <View style={styles.weightControls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => adjustWeight(-0.1)}>
          <MaterialIcons name="remove" size={28} color={COLORS.textOnColor} />
        </TouchableOpacity>
        <View style={styles.sliderPlaceholder}>
          <View style={[styles.sliderFill, { width: weightProgress }]} />
          <View style={[styles.sliderThumb, { right: weightProgress }]} />
        </View>
        <TouchableOpacity style={styles.controlButton} onPress={() => adjustWeight(0.1)}>
          <MaterialIcons name="add" size={28} color={COLORS.textOnColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.submitButton} onPress={submitWeight}>
          <Text style={styles.submitButtonText}>שליחת משקל</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.updateButton} onPress={submitWeight}>
          <Text style={styles.updateButtonText}>עדכון משקל</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.goalCard}>
        <MaterialIcons name="gps-fixed" size={40} color={COLORS.tertiary} />
        <Text style={styles.goalLabel}>מטרה</Text>
        <Text style={styles.goalText}>חיטוב</Text>
        <View style={styles.goalWeights}>
          <Text style={styles.goalWeightText}>משקל התחלתי: {weightHistory[weightHistory.length - 1]?.weight || '--'}</Text>
          <MaterialIcons name={RTL_ICONS.forward} size={20} color={COLORS.textSecondary} />
          <Text style={styles.goalWeightText}>משקל נוכחי: {currentWeight}</Text>
        </View>
      </View>

      <SimpleChart
        data={[...weightHistory].reverse().map((entry) => ({
          value: entry.weight,
          label: entry.date.substring(0, 5),
        }))}
        label="גרף משקל"
        height={160}
      />

      <Text style={styles.historyTitle}>משקלים אחרונים</Text>

      <View style={styles.historyTable}>
        <View style={styles.historyHeader}>
          <Text style={[styles.historyHeaderText, { flex: 1 }]}>משקל</Text>
          <Text style={[styles.historyHeaderText, { flex: 1 }]}>שעה</Text>
          <Text style={[styles.historyHeaderText, { flex: 1 }]}>תאריך</Text>
        </View>
        {weightHistory.map((entry, index) => (
          <View key={index} style={[styles.historyRow, index % 2 === 0 && styles.historyRowAlt]}>
            <Text style={[styles.historyText, { flex: 1 }]}>{entry.weight.toFixed(2)}</Text>
            <Text style={[styles.historyText, { flex: 1 }]}>{entry.time}</Text>
            <Text style={[styles.historyText, { flex: 1 }]}>{entry.date}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.xxl,
  },
  topBar: {
    ...RTL_ROW_CENTER,
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    ...RTL_ROW_CENTER,
    gap: SPACING.sm,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: '700',
  },
  weightDisplay: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  weightNumber: {
    color: COLORS.text,
    fontSize: 64,
    fontWeight: 'bold',
  },
  weightUnit: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
  },
  weightControls: {
    ...PHYSICAL_ROW_CENTER,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderPlaceholder: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.tertiary,
    borderRadius: 3,
    alignSelf: 'flex-end',
  },
  sliderThumb: {
    position: 'absolute',
    top: -10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.tertiary,
    marginRight: -13,
  },
  buttonRow: {
    ...RTL_ROW_CENTER,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  submitButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.tertiary,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  updateButtonText: {
    color: COLORS.textOnColor,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  goalLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    marginTop: SPACING.sm,
  },
  goalText: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
  },
  goalWeights: {
    ...PHYSICAL_ROW_CENTER,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  goalWeightText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
  historyTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  historyTable: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  historyHeader: {
    ...PHYSICAL_ROW,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  historyHeaderText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  historyRow: {
    ...PHYSICAL_ROW,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 2,
  },
  historyRowAlt: {
    backgroundColor: COLORS.surface,
  },
  historyText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    textAlign: 'center',
  },
});
