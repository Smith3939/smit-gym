/**
 * Modern Aurora Theme - 2025 inspired palette
 * Inspired by Linear, Vercel, Framer, Apple Vision OS
 */

export const COLORS = {
  // Dark mode backgrounds - deep rich tones
  background: '#0A0E1A',
  backgroundDeep: '#060912',
  backgroundLight: '#141824',
  surface: '#141824',
  surfaceLight: '#1C2030',
  surfaceElevated: '#242938',
  surfaceGlass: 'rgba(28, 32, 48, 0.6)',

  // Primary - Vibrant electric pink/coral
  primary: '#FF4D8F',
  primaryDark: '#E0306F',
  primaryLight: '#FF7AAB',
  primaryGlow: 'rgba(255, 77, 143, 0.35)',

  // Secondary - Mint cyan
  secondary: '#22D3EE',
  secondaryDark: '#0EA5C0',
  secondaryLight: '#67E8F9',

  // Tertiary - Soft lavender
  tertiary: '#A78BFA',
  tertiaryDark: '#8B5CF6',
  tertiaryLight: '#C4B5FD',

  // Accent - Lime green
  accent: '#A3E635',
  accentDark: '#84CC16',

  // Status colors - modern muted versions
  success: '#34D399',
  successDark: '#10B981',
  error: '#F87171',
  errorDark: '#EF4444',
  warning: '#FBBF24',
  warningDark: '#F59E0B',
  info: '#60A5FA',

  // Text - high contrast on dark
  text: '#FFFFFF',
  textSecondary: '#C4C8D4',
  textMuted: '#6B7280',
  textDim: '#4B5563',

  // Borders - subtle
  border: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  borderActive: 'rgba(255, 77, 143, 0.4)',

  // Cards
  card: '#141824',
  cardElevated: '#1C2030',
  overlay: 'rgba(6, 9, 18, 0.85)',
};

export const GRADIENTS = {
  // Hero gradients
  primary: ['#FF4D8F', '#E0306F'],
  primaryHero: ['#FF4D8F', '#A78BFA'],

  // Modern aurora gradients
  aurora: ['#FF4D8F', '#A78BFA', '#22D3EE'],
  sunset: ['#FF4D8F', '#FBBF24'],
  ocean: ['#22D3EE', '#A78BFA'],
  forest: ['#A3E635', '#22D3EE'],
  fire: ['#FF4D8F', '#F87171', '#FBBF24'],

  // Dark backgrounds
  dark: ['#141824', '#0A0E1A'],
  darkDeep: ['#0A0E1A', '#060912'],
  darkSurface: ['#242938', '#141824'],

  // Status
  success: ['#34D399', '#10B981'],
  hero: ['#FF4D8F', '#FBBF24'],
  cool: ['#22D3EE', '#A78BFA'],

  // Glass card tints (per category)
  cardPink: ['rgba(255,77,143,0.18)', 'rgba(255,77,143,0.04)'],
  cardPurple: ['rgba(167,139,250,0.18)', 'rgba(167,139,250,0.04)'],
  cardCyan: ['rgba(34,211,238,0.18)', 'rgba(34,211,238,0.04)'],
  cardLime: ['rgba(163,230,53,0.18)', 'rgba(163,230,53,0.04)'],
  cardAmber: ['rgba(251,191,36,0.18)', 'rgba(251,191,36,0.04)'],

  // Multi-color category gradients
  cardOrange: ['rgba(255,77,143,0.18)', 'rgba(251,191,36,0.08)'],
  cardGreen: ['rgba(52,211,153,0.18)', 'rgba(34,211,238,0.08)'],
  cardBlue: ['rgba(34,211,238,0.18)', 'rgba(167,139,250,0.08)'],

  // Glow effects
  glow: ['rgba(255, 77, 143, 0.4)', 'rgba(255, 77, 143, 0)'],
};

export const FONTS = {
  micro: 10,
  tiny: 12,
  small: 14,
  regular: 16,
  medium: 18,
  large: 22,
  xlarge: 28,
  title: 34,
  hero: 44,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  round: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 14,
  },
  glow: {
    shadowColor: '#FF4D8F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glowPurple: {
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glowCyan: {
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};
