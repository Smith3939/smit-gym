import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Modal, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

const DISMISSED_KEY = '@smit_gym_install_dismissed_v1';
const INSTALLED_KEY = '@smit_gym_installed_v1';

/* ── environment helpers (web only) ─────────────────────────────────────── */

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

/** Running as an installed app (home-screen / standalone window)? */
function isRunningStandalone() {
  if (!isWeb) return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    window.matchMedia?.('(display-mode: fullscreen)')?.matches === true ||
    window.matchMedia?.('(display-mode: minimal-ui)')?.matches === true ||
    window.navigator.standalone === true // iOS Safari
  );
}

function isIOS() {
  if (!isWeb) return false;
  const ua = window.navigator.userAgent || '';
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac but has touch
  const iPadOS = /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

function isSafari() {
  if (!isWeb) return false;
  const ua = window.navigator.userAgent || '';
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
}

/** localStorage helpers that never throw (private mode / disabled storage). */
const store = {
  get(key) {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
  },
};

/* ── component ──────────────────────────────────────────────────────────── */

/**
 * Offers installing Smit Gym to the home screen, and stays out of the way
 * once it's installed.
 *
 * Detection (any one is enough to consider it installed):
 *  - the page is running in standalone/fullscreen display mode
 *  - iOS `navigator.standalone`
 *  - `getInstalledRelatedApps()` reports a matching install
 *  - we previously saw the `appinstalled` event (persisted)
 *
 * Install path:
 *  - Chrome/Edge/Android: capture `beforeinstallprompt` and trigger the real
 *    native install dialog on tap
 *  - iOS Safari: no such API — show the Share → "הוסף למסך הבית" steps
 */
export default function InstallPrompt() {
  const insets = useSafeAreaInsets();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (!isWeb) return;

    // ── Already installed? then never show anything ──────────────────────
    if (isRunningStandalone() || store.get(INSTALLED_KEY) === '1') {
      setInstalled(true);
      return;
    }

    let cancelled = false;

    // Chrome can tell us whether a related app is already installed.
    navigator.getInstalledRelatedApps?.()
      .then((apps) => {
        if (!cancelled && apps && apps.length > 0) {
          setInstalled(true);
          store.set(INSTALLED_KEY, '1');
        }
      })
      .catch(() => { /* unsupported — fall through */ });

    const dismissed = store.get(DISMISSED_KEY) === '1';

    // ── Chrome / Edge / Android: real install prompt ──────────────────────
    const onBeforeInstall = (e) => {
      e.preventDefault();           // keep it; show our own UI first
      setDeferredPrompt(e);
      if (!dismissed) setVisible(true);
    };

    // ── Fired after a successful install (any surface) ────────────────────
    const onInstalled = () => {
      store.set(INSTALLED_KEY, '1');
      setInstalled(true);
      setVisible(false);
      setShowIOSSheet(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // ── iOS Safari has no beforeinstallprompt — offer manual steps ────────
    let iosTimer;
    if (isIOS() && isSafari() && !dismissed) {
      iosTimer = setTimeout(() => {
        if (!cancelled && !isRunningStandalone()) setVisible(true);
      }, 2500);
    }

    // Keep in sync if the user installs while the tab stays open
    const displayModeQuery = window.matchMedia?.('(display-mode: standalone)');
    const onDisplayModeChange = (e) => { if (e.matches) onInstalled(); };
    displayModeQuery?.addEventListener?.('change', onDisplayModeChange);

    return () => {
      cancelled = true;
      clearTimeout(iosTimer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      displayModeQuery?.removeEventListener?.('change', onDisplayModeChange);
    };
  }, []);

  const dismiss = () => {
    store.set(DISMISSED_KEY, '1');
    setVisible(false);
  };

  const handleInstall = async () => {
    // iOS: we can only explain the manual flow
    if (!deferredPrompt) {
      setShowIOSSheet(true);
      return;
    }
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        store.set(INSTALLED_KEY, '1');
        setInstalled(true);
      } else {
        store.set(DISMISSED_KEY, '1');
      }
    } catch {
      /* prompt already used / not allowed — ignore */
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (installed || !visible) return null;

  return (
    <>
      {/* Bottom banner */}
      <View
        style={[styles.wrap, { bottom: Math.max(insets.bottom, SPACING.md) + 72 }]}
        pointerEvents="box-none"
      >
        <View style={styles.card}>
          <TouchableOpacity
            onPress={dismiss}
            style={styles.close}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.row}>
            <Image
              source={{ uri: '/icon-192.png' }}
              style={styles.appIcon}
              resizeMode="cover"
            />
            <View style={styles.textBlock}>
              <Text style={styles.title}>התקן את Smit Gym</Text>
              <Text style={styles.subtitle}>
                גישה מהירה מהמסך הראשי, בלי דפדפן
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.installBtn}
            onPress={handleInstall}
            activeOpacity={0.9}
          >
            <MaterialIcons
              name={deferredPrompt ? 'get-app' : 'ios-share'}
              size={18}
              color={COLORS.textOnColor}
            />
            <Text style={styles.installText}>
              {deferredPrompt ? 'התקנה' : 'איך מתקינים?'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* iOS manual instructions */}
      <Modal
        visible={showIOSSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIOSSheet(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowIOSSheet(false)}>
                <MaterialIcons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>התקנה על האייפון</Text>
              <View style={{ width: 22 }} />
            </View>

            <Step
              n="1"
              icon="ios-share"
              text='לחץ על כפתור השיתוף בתחתית הדפדפן'
            />
            <Step
              n="2"
              icon="add-box"
              text='גלול ובחר "הוסף למסך הבית" (Add to Home Screen)'
            />
            <Step
              n="3"
              icon="check-circle"
              text='לחץ "הוסף" — האפליקציה תופיע עם האייקון שלנו'
            />

            <TouchableOpacity
              style={styles.gotIt}
              onPress={() => { setShowIOSSheet(false); dismiss(); }}
            >
              <Text style={styles.gotItText}>הבנתי</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Step({ n, icon, text }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
      <MaterialIcons name={icon} size={20} color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9998,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  close: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
  },
  appIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  textBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 2,
    textAlign: 'right',
  },
  installBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm + 3,
    marginTop: SPACING.md,
  },
  installText: {
    color: COLORS.textOnColor,
    fontSize: FONTS.small,
    fontWeight: '800',
  },

  // iOS sheet
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  sheetHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
  },
  step: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: COLORS.textOnColor,
    fontSize: FONTS.tiny,
    fontWeight: '900',
  },
  stepText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.small,
    textAlign: 'right',
    lineHeight: 20,
  },
  gotIt: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  gotItText: {
    color: COLORS.textOnColor,
    fontSize: FONTS.regular,
    fontWeight: '800',
  },
});
