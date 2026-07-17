import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

const CHECK_INTERVAL_MS = 4 * 60 * 1000; // every 4 minutes

/**
 * Detects when a new version of the web app has been deployed and shows a
 * "new version available" banner that reloads the page.
 *
 * How it works: every build writes /version.json with a fresh builtAt.
 * We remember the first value we see; when a later fetch returns a different
 * one, a new deployment happened while this client was open (or its cached
 * bundle is stale) - so we offer a one-tap refresh.
 */
export default function UpdateChecker() {
  const insets = useSafeAreaInsets();
  const [updateReady, setUpdateReady] = useState(false);
  const baseline = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.builtAt) return;

        if (baseline.current == null) {
          baseline.current = data.builtAt;
        } else if (data.builtAt !== baseline.current) {
          setUpdateReady(true);
        }
      } catch {
        // Offline / file missing on old deployments - ignore silently
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);

    // Also check when the user returns to the app (tab/PWA regains focus)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!updateReady) return null;

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <View style={[styles.wrap, { top: insets.top + SPACING.sm }]} pointerEvents="box-none">
      <TouchableOpacity style={styles.banner} onPress={handleReload} activeOpacity={0.9}>
        <MaterialIcons name="system-update-alt" size={18} color={COLORS.text} />
        <Text style={styles.text}>גרסה חדשה זמינה - לחץ לעדכון</Text>
        <MaterialIcons name="refresh" size={18} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.glow,
  },
  text: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '800',
  },
});
