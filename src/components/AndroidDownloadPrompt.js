import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import ModernButton from './ModernButton';
import { BORDER_RADIUS, COLORS, FONTS, SHADOWS, SPACING } from '../config/theme';
import { RTL_ROW_CENTER, RTL_TEXT } from '../utils/rtl';

const DISMISSED_STORAGE_KEY = '@smit_gym_app_download_prompt_dismissed_v2';
const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.smitgym.app';
const IOS_APP_URL = 'https://apps.apple.com/il/app/smit-gym/id1234567890'; // TODO: Update with real App Store ID when available

function getDeviceOS() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
    return null;
  }

  const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  // iOS detection (including iPad on iOS 13+)
  if (/iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }

  return null;
}

function isStandaloneWebApp() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;
}

export default function AppDownloadPrompt() {
  const [visible, setVisible] = useState(false);
  const [deviceOS, setDeviceOS] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function maybeShowPrompt() {
      const os = getDeviceOS();
      if (!os || isStandaloneWebApp()) {
        return;
      }

      if (isMounted) {
        setDeviceOS(os);
      }

      try {
        const dismissed = await AsyncStorage.getItem(DISMISSED_STORAGE_KEY);
        if (isMounted && dismissed !== 'true') {
          setVisible(true);
        }
      } catch (error) {
        if (isMounted) {
          setVisible(true);
        }
      }
    }

    maybeShowPrompt();

    return () => {
      isMounted = false;
    };
  }, []);

  const dismiss = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
    } catch (error) {
      // Non-blocking
    }
  };

  const downloadApp = async () => {
    await dismiss();
    const url = deviceOS === 'ios' ? IOS_APP_URL : ANDROID_APP_URL;
    await Linking.openURL(url);
  };

  if (!visible) return null;

  const isIOS = deviceOS === 'ios';

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            onPress={dismiss}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="סגירה"
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.iconWrap, isIOS && styles.iconWrapIos]}>
            {isIOS ? (
              <FontAwesome5 name="apple" size={32} color={COLORS.primary} />
            ) : (
              <MaterialIcons name="android" size={34} color={COLORS.accent} />
            )}
          </View>

          <Text style={styles.title}>הורידו את האפליקציה לטלפון</Text>
          <Text style={styles.body}>
            משתמשים ב-{isIOS ? 'iPhone' : 'אנדרואיד'}? קבלו חוויה מהירה ונוחה יותר עם אפליקציית Smit Gym.
          </Text>

          <ModernButton
            title={isIOS ? 'להורדה ב-App Store' : 'להורדה ב-Google Play'}
            icon={isIOS ? 'apple' : 'file-download'}
            onPress={downloadApp}
            glow
            style={styles.primaryButton}
          />

          <TouchableOpacity onPress={dismiss} activeOpacity={0.75} style={styles.secondaryAction}>
            <Text style={styles.secondaryText}>לא עכשיו</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: 'rgba(6, 9, 18, 0.78)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
    ...SHADOWS.large,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    width: 38,
    height: 38,
    ...RTL_ROW_CENTER,
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surfaceLight,
  },
  iconWrap: {
    width: 70,
    height: 70,
    ...RTL_ROW_CENTER,
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(163, 230, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.28)',
  },
  iconWrapIos: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.28)',
  },
  title: {
    marginBottom: SPACING.sm,
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: '800',
    ...RTL_TEXT,
  },
  body: {
    marginBottom: SPACING.lg,
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
    lineHeight: 24,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  primaryButton: {
    minHeight: 52,
  },
  secondaryAction: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  secondaryText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    fontWeight: '700',
  },
});
