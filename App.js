import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/components/Toast';
import InstallPrompt from './src/components/InstallPrompt';
import UpdateChecker from './src/components/UpdateChecker';
import { COLORS } from './src/config/theme';

const SCROLL_EDGE_PROPS = {
  bounces: false,
  alwaysBounceHorizontal: false,
  alwaysBounceVertical: false,
  overScrollMode: 'never',
};

ScrollView.defaultProps = {
  ...ScrollView.defaultProps,
  ...SCROLL_EDGE_PROPS,
};

FlatList.defaultProps = {
  ...FlatList.defaultProps,
  ...SCROLL_EDGE_PROPS,
};

const RTL_TEXT_STYLE = {
  direction: 'rtl',
  writingDirection: 'rtl',
  textAlign: 'right',
};

Text.defaultProps = {
  ...Text.defaultProps,
  style: [RTL_TEXT_STYLE, Text.defaultProps?.style],
};

TextInput.defaultProps = {
  ...TextInput.defaultProps,
  textAlign: 'right',
  style: [RTL_TEXT_STYLE, TextInput.defaultProps?.style],
};

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'smit-gym-scroll-boundary-fix';

  document.documentElement.setAttribute('dir', 'rtl');
  document.documentElement.setAttribute('lang', 'he');
  document.body?.setAttribute('dir', 'rtl');

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      html,
      body,
      #root {
        margin: 0;
        min-height: 100%;
        background: ${COLORS.background};
        overscroll-behavior: none;
        direction: rtl;
        text-align: right;
      }

      body {
        overflow-x: hidden;
      }

      #root {
        isolation: isolate;
      }

      input, textarea { caret-color: ${COLORS.primaryDark}; }
      ::selection { background: ${COLORS.primarySoft}; color: ${COLORS.text}; }
      :focus-visible { outline: 2px solid ${COLORS.primaryDark}; outline-offset: 3px; }
      input:focus-visible, textarea:focus-visible { outline-offset: -2px; border-radius: 6px; }
      [role="button"], [role="tab"], a { touch-action: manipulation; }
      @media (hover: hover) {
        [role="button"]:not([aria-disabled="true"]):hover { filter: brightness(0.97); }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
      }
    `;
    document.head.appendChild(style);
  }
}

const appTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.primary,
  },
};

const linking = {
  prefixes: [
    'smitgym://',
    ...(Platform.OS === 'web' && typeof window !== 'undefined' ? [window.location.origin] : []),
  ],
  config: {
    screens: {
      SharedProfile: 'share/:shareId',
      Main: '*',
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.appRoot}>
      <SafeAreaProvider style={styles.appRoot}>
        <AuthProvider>
          <ToastProvider>
            <View style={styles.appFrame}>
              <NavigationContainer theme={appTheme} linking={linking}>
                <StatusBar style="dark" backgroundColor={COLORS.background} />
                <AppNavigator />
              </NavigationContainer>
              <InstallPrompt />
              <UpdateChecker />
            </View>
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    backgroundColor: COLORS.background,
  },
  appRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
    direction: 'rtl',
  },
});
