import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';

const ToastContext = createContext({});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const success = (msg, duration) => show(msg, 'success', duration);
  const error = (msg, duration) => show(msg, 'error', duration);
  const info = (msg, duration) => show(msg, 'info', duration);
  const warning = (msg, duration) => show(msg, 'warning', duration);

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastItem key={toast.id} toast={toast} index={index} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, index }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }, toast.duration - 250);
  }, []);

  const config = {
    success: { icon: 'check-circle', color: COLORS.success, bg: '#1A3A1F' },
    error: { icon: 'error', color: COLORS.error, bg: '#3A1A1A' },
    info: { icon: 'info', color: COLORS.primary, bg: COLORS.surface },
    warning: { icon: 'warning', color: COLORS.warning, bg: '#3A2F1A' },
  }[toast.type] || { icon: 'info', color: COLORS.primary, bg: COLORS.surface };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: config.bg,
          borderColor: config.color,
          transform: [{ translateY }],
          opacity,
          top: 50 + index * 70,
        },
      ]}
    >
      <MaterialIcons name={config.icon} size={24} color={config.color} />
      <Text style={styles.toastText}>{toast.message}</Text>
    </Animated.View>
  );
}

export const useToast = () => useContext(ToastContext);

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    position: 'absolute',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    maxWidth: width - SPACING.xl,
    minWidth: 280,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});
