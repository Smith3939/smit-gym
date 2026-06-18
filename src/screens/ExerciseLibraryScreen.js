import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { MUSCLE_GROUPS, EXERCISES } from '../data/exercises';
import { RTL_ICONS } from '../utils/rtl';

function ExerciseItem({ exercise, isFavorite, onToggleFavorite }) {
  return (
    <View style={styles.exerciseItem}>
      <TouchableOpacity onPress={() => onToggleFavorite(exercise.id)}>
        <MaterialIcons
          name={isFavorite ? 'star' : 'star-border'}
          size={28}
          color={COLORS.primary}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.playIcon}>
        <MaterialIcons name="play-circle-outline" size={28} color={COLORS.primary} />
      </TouchableOpacity>
      <View style={styles.exerciseItemDivider} />
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseMeta}>
          {exercise.defaultSets} סטים × {exercise.defaultReps} חזרות
        </Text>
      </View>
    </View>
  );
}

export default function ExerciseLibraryScreen({ navigation }) {
  const [selectedGroup, setSelectedGroup] = useState('chest');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const toggleFavorite = (exerciseId) => {
    setFavorites((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const filteredExercises = useMemo(() => {
    let exercises = [];

    if (showFavoritesOnly) {
      Object.values(EXERCISES).forEach((group) => {
        group.forEach((ex) => {
          if (favorites.includes(ex.id)) exercises.push(ex);
        });
      });
    } else {
      exercises = EXERCISES[selectedGroup] || [];
    }

    if (searchQuery.trim()) {
      exercises = exercises.filter((ex) =>
        ex.name.includes(searchQuery.trim())
      );
    }

    return exercises;
  }, [selectedGroup, searchQuery, favorites, showFavoritesOnly]);

  const selectedGroupName = showFavoritesOnly
    ? 'מועדפים'
    : MUSCLE_GROUPS.find((g) => g.id === selectedGroup)?.name || '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name={RTL_ICONS.back} size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>תרגילים - {selectedGroupName}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backButton}>
          <MaterialIcons name="home" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={22} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש תרגיל"
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.groupScroll}
        contentContainerStyle={styles.groupScrollContent}
        bounces={false}
        alwaysBounceHorizontal={false}
        overScrollMode="never"
      >
        <TouchableOpacity
          style={[styles.groupChip, showFavoritesOnly && styles.groupChipActive]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <MaterialIcons
            name="star"
            size={18}
            color={showFavoritesOnly ? COLORS.text : COLORS.primary}
          />
          <Text style={[styles.groupChipText, showFavoritesOnly && styles.groupChipTextActive]}>
            מועדפים ({favorites.length})
          </Text>
        </TouchableOpacity>
        {MUSCLE_GROUPS.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.groupChip,
              selectedGroup === group.id && !showFavoritesOnly && styles.groupChipActive,
            ]}
            onPress={() => {
              setSelectedGroup(group.id);
              setShowFavoritesOnly(false);
            }}
          >
            <Text style={[
              styles.groupChipText,
              selectedGroup === group.id && !showFavoritesOnly && styles.groupChipTextActive,
            ]}>
              {group.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseItem
            exercise={item}
            isFavorite={favorites.includes(item.id)}
            onToggleFavorite={toggleFavorite}
          />
        )}
        contentContainerStyle={styles.listContent}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {showFavoritesOnly ? 'אין תרגילים במועדפים' : 'לא נמצאו תרגילים'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.regular,
    paddingVertical: SPACING.sm,
    marginStart: SPACING.sm,
  },
  groupScroll: {
    maxHeight: 50,
    marginBottom: SPACING.md,
  },
  groupScrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    flexDirection: 'row',
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  groupChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  groupChipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: '600',
  },
  groupChipTextActive: {
    color: COLORS.text,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
    textAlign: 'right',
  },
  exerciseMeta: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: 2,
  },
  exerciseItemDivider: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.md,
  },
  playIcon: {
    marginStart: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.regular,
    marginTop: SPACING.md,
  },
});
