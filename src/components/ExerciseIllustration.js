import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';
import { EXERCISE_ILLUSTRATIONS } from '../data/exerciseIllustrations';

function Drawing({ pose }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 100" accessible={false}>
      <Path d="M10 93 H110" stroke={COLORS.border} strokeWidth={2} />
      {!!pose.equipment && <Path d={pose.equipment} stroke={COLORS.textMuted} strokeWidth={3} fill="none" strokeLinecap="round" />}
      {!!pose.far && <Path d={pose.far} stroke={COLORS.textMuted} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      <Path d={pose.body} stroke={COLORS.text} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={pose.head[0]} cy={pose.head[1]} r={6} fill={COLORS.primaryDark} />
    </Svg>
  );
}

export default function ExerciseIllustration({ exerciseId, name }) {
  const [open, setOpen] = useState(false);
  const guide = Object.hasOwn(EXERCISE_ILLUSTRATIONS, exerciseId) ? EXERCISE_ILLUSTRATIONS[exerciseId] : null;
  if (!guide) return null;

  return (
    <>
      <Pressable style={styles.thumb} accessibilityRole="button"
        accessibilityLabel={`הצג איור: ${name}`} onPress={() => setOpen(true)}>
        <Drawing pose={guide.poses.at(-1)} />
        <View style={styles.zoom} pointerEvents="none">
          <MaterialIcons name="zoom-in" size={14} color={COLORS.text} />
        </View>
      </Pressable>
      {open && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessible={false} />
            <View style={styles.sheet} accessibilityViewIsModal>
              <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.heading}>
                  <Text style={styles.title} accessibilityRole="header">{name}</Text>
                  <Pressable style={styles.close} accessibilityRole="button" accessibilityLabel="סגור איור" onPress={() => setOpen(false)}>
                    <MaterialIcons name="close" size={22} color={COLORS.text} />
                  </Pressable>
                </View>
                <View style={styles.poses}>
                  {guide.poses.map((pose, i) => (
                    <View key={i} style={styles.panel}>
                      <View style={styles.drawing}><Drawing pose={pose} /></View>
                      <Text style={styles.label}>{i === 0 ? guide.start : guide.end}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.cue}>{guide.cue}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 64, height: 52, marginHorizontal: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  zoom: { position: 'absolute', bottom: 1, left: 1, backgroundColor: COLORS.surface, borderRadius: 5 },
  overlay: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(10,10,18,0.55)' },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '85%', borderRadius: 18, backgroundColor: COLORS.surface, overflow: 'hidden' },
  content: { padding: 16, gap: 12 },
  heading: { flexDirection: 'row-reverse', direction: 'ltr', alignItems: 'center', gap: 8 },
  title: { flex: 1, color: COLORS.text, fontWeight: '800', fontSize: 20, textAlign: 'right' },
  close: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  poses: { flexDirection: 'row-reverse', direction: 'ltr', gap: 8 },
  panel: { flex: 1, minWidth: 0, padding: 8, borderRadius: 12, backgroundColor: COLORS.surfaceLight },
  drawing: { width: '100%', aspectRatio: 1.2, maxHeight: 170 },
  label: { textAlign: 'center', color: COLORS.text, fontSize: 13, fontWeight: '700' },
  cue: { color: COLORS.textSecondary, fontSize: 16, lineHeight: 24, textAlign: 'right' },
});
