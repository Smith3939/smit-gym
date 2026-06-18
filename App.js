import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { NavigationBar } from 'expo-navigation-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { FlatList, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/components/Toast';
import AndroidDownloadPrompt from './src/components/AndroidDownloadPrompt';
import { COLORS } from './src/config/theme';

const SCROLL_EDGE_PROPS = {
  bounces: false,
  alwaysBounceHorizontal: false,
  alwaysBounceVertical: false,
  overScrollMode: 'never',
};

SystemUI.setBackgroundColorAsync(COLORS.background).catch(() => {});

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
  const themeColor = COLORS.background;
  const setMeta = (name, content) => {
    let meta = document.querySelector(`meta[name="${name}"]`);

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);
  };

  setMeta('theme-color', themeColor);
  setMeta('msapplication-navbutton-color', themeColor);
  setMeta('apple-mobile-web-app-capable', 'yes');
  setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');

  const viewport = document.querySelector('meta[name="viewport"]');
  const viewportContent = viewport?.getAttribute('content') || '';

  if (viewport && !viewportContent.includes('viewport-fit=cover')) {
    viewport.setAttribute('content', `${viewportContent}, viewport-fit=cover`);
  }

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
        height: 100%;
        min-height: 100%;
        background: ${COLORS.background};
        overscroll-behavior: none;
        direction: rtl;
        text-align: right;
      }

      body {
        overflow-x: hidden;
        min-height: 100vh;
        min-height: 100dvh;
      }

      #root {
        isolation: isolate;
      }

      input,
      textarea {
        direction: rtl;
        text-align: right;
      }
    `;
    document.head.appendChild(style);
  }
}

const appTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
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
            <NavigationContainer theme={appTheme} linking={linking}>
              <StatusBar
                style="light"
                translucent={Platform.OS !== 'android'}
                backgroundColor={Platform.OS === 'android' ? COLORS.background : 'transparent'}
              />
              {Platform.OS === 'android' && <NavigationBar style="dark" />}
              <AppNavigator />
            </NavigationContainer>
            <AndroidDownloadPrompt />
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
    direction: 'rtl',
  },
});
