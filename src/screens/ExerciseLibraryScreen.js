import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { MUSCLE_GROUPS, EXERCISES } from '../data/exercises';
import { RTL_ICONS } from '../utils/rtl';

const FAVORITES_TAB = '__favorites__';

/** One exercise row. */
function ExerciseItem({ exercise, groupColor, isFavorite, onToggleFavorite }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => onToggleFavorite(exercise.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.starBtn}
      >
        <MaterialIcons
          name={isFavorite ? 'star' : 'star-border'}
          size={26}
          color={isFavorite ? COLORS.warningBright : COLORS.textDim}
        />
      </TouchableOpacity>

      <View style={styles.cardBody}>
        <Text style={styles.exerciseName} numberOfLines={2}>{exercise.name}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.metaPill, { backgroundColor: `${groupColor}14` }]}>
            <Text style={[styles.metaPillText, { color: groupColor }]}>
              {exercise.defaultSets} סטים
            </Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: COLORS.surfaceLight }]}>
            <Text style={[styles.metaPillText, { color: COLORS.textSecondary }]}>
              {exercise.defaultReps} חזרות
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.cardAccent, { backgroundColor: groupColor }]} />
    </View>
  );
}

export default function ExerciseLibraryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('chest');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const tabScrollRef = useRef(null);

  const toggleFavorite = (id) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // Count per group (memoised — the data is static)
  const counts = useMemo(() => {
    const c = {};
    MUSCLE_GROUPS.forEach((g) => { c[g.id] = (EXERCISES[g.id] || []).length; });
    return c;
  }, []);

  const showingFavorites = activeTab === FAVORITES_TAB;

  const activeGroup = showingFavorites
    ? { id: FAVORITES_TAB, name: 'מועדפים', color: COLORS.warningBright, icon: 'star' }
    : MUSCLE_GROUPS.find((g) => g.id === activeTab) || MUSCLE_GROUPS[0];

  /** Exercises for the active tab, plus the search filter. */
  const visibleExercises = useMemo(() => {
    let list;
    if (showingFavorites) {
      list = [];
      Object.entries(EXERCISES).forEach(([groupId, exercises]) => {
        exercises.forEach((ex) => {
          if (favorites.includes(ex.id)) list.push({ ...ex, groupId });
        });
      });
    } else {
      list = (EXERCISES[activeTab] || []).map((ex) => ({ ...ex, groupId: activeTab }));
    }

    const q = searchQuery.trim();
    return q ? list.filter((ex) => ex.name.includes(q)) : list;
  }, [activeTab, searchQuery, favorites, showingFavorites]);

  const colorFor = (groupId) =>
    MUSCLE_GROUPS.find((g) => g.id === groupId)?.color || COLORS.primary;

  /** Tab pill — icon + label + count. */
  const renderTab = (group, isActive, count, iconSet = 'mc') => (
    <TouchableOpacity
      key={group.id}
      onPress={() => setActiveTab(group.id)}
      activeOpacity={0.85}
      style={[
        styles.tab,
        isActive && { backgroundColor: group.color, borderColor: group.color },
      ]}
    >
      {iconSet === 'mc' ? (
        <MaterialCommunityIcons
          name={group.icon}
          size={18}
          color={isActive ? COLORS.textOnColor : group.color}
        />
      ) : (
        <MaterialIcons
          name={group.icon}
          size={18}
          color={isActive ? COLORS.textOnColor : group.color}
        />
      )}
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
        {group.name}
      </Text>
      <View
        style={[
          styles.tabCount,
          isActive ? styles.tabCountActive : { backgroundColor: `${group.color}1A` },
        ]}
      >
        <Text
          style={[
            styles.tabCountText,
            { color: isActive ? COLORS.textOnColor : group.color },
          ]}
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name={RTL_ICONS.back} size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>ספריית תרגילים</Text>
          <Text style={styles.subtitle}>
            {visibleExercises.length} תרגילים · {activeGroup.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Main')}
          style={styles.iconBtn}
        >
          <MaterialIcons name="home" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש תרגיל..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Muscle-group tabs ──────────────────────────────────────────── */}
      <View style={styles.tabsWrap}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          bounces={false}
          overScrollMode="never"
        >
          {MUSCLE_GROUPS.map((g) => renderTab(g, activeTab === g.id, counts[g.id]))}
          {renderTab(
            { id: FAVORITES_TAB, name: 'מועדפים', color: COLORS.warningBright, icon: 'star' },
            showingFavorites,
            favorites.length,
            'mi'
          )}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={visibleExercises}
        keyExtractor={(item) => `${item.groupId}_${item.id}`}
        renderItem={({ item }) => (
          <ExerciseItem
            exercise={item}
            groupColor={colorFor(item.groupId)}
            isFavorite={favorites.includes(item.id)}
            onToggleFavorite={toggleFavorite}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons
              name={showingFavorites ? 'star-border' : 'search-off'}
              size={44}
              color={COLORS.textDim}
            />
            <Text style={styles.emptyTitle}>
              {showingFavorites
                ? 'אין עדיין תרגילים במועדפים'
                : searchQuery
                  ? 'לא נמצאו תרגילים'
                  : 'אין תרגילים בקטגוריה'}
            </Text>
            <Text style={styles.emptyText}>
              {showingFavorites
                ? 'לחץ על הכוכב ליד תרגיל כדי לשמור אותו כאן'
                : 'נסה חיפוש אחר או קטגוריה אחרת'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    fontWeight: '600',
    marginTop: 1,
  },

  // Search
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.regular,
    paddingVertical: SPACING.sm + 2,
  },

  // Tabs
  tabsWrap: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  tabsRow: {
    // NOTE: plain `row` (not row-reverse) inside this RTL document lays the
    // tabs out right-to-left AND puts the first tab at the scroll origin, so
    // the initial category is visible without any scroll fix-up.
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  tab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: '700',
  },
  tabTextActive: {
    color: COLORS.textOnColor,
  },
  tabCount: {
    minWidth: 22,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  tabCountText: {
    fontSize: FONTS.micro,
    fontWeight: '900',
  },

  // List
  listContent: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  cardAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  starBtn: {
    padding: 2,
  },
  cardBody: {
    flex: 1,
    alignItems: 'flex-end',
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '700',
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    gap: SPACING.xs,
    marginTop: 6,
  },
  metaPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  metaPillText: {
    fontSize: FONTS.micro,
    fontWeight: '700',
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.xs,
  },
  emptyTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'center',
  },
});
