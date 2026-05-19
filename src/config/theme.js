export const COLORS = {
  background: '#0F0F14',
  backgroundLight: '#1A1A23',
  surface: '#1E1E28',
  surfaceLight: '#2A2A38',
  surfaceGlass: 'rgba(42, 42, 56, 0.6)',
  primary: '#FF6B35',
  primaryDark: '#E54B1F',
  primaryLight: '#FF8C5A',
  primaryGlow: 'rgba(255, 107, 53, 0.3)',
  secondary: '#FFB627',
  tertiary: '#A06CD5',
  accent: '#5BC0EB',
  text: '#FFFFFF',
  textSecondary: '#B0B0C0',
  textMuted: '#707080',
  success: '#4CD964',
  successDark: '#2EA84A',
  error: '#FF3B3B',
  warning: '#FFC107',
  border: 'rgba(255,255,255,0.08)',
  borderActive: 'rgba(255,107,53,0.4)',
  card: '#1A1A23',
  overlay: 'rgba(0,0,0,0.75)',
};

export const GRADIENTS = {
  primary: ['#FF6B35', '#E54B1F'],
  primaryHero: ['#FF6B35', '#A06CD5'],
  dark: ['#1E1E28', '#0F0F14'],
  darkSurface: ['#2A2A38', '#1E1E28'],
  success: ['#4CD964', '#2EA84A'],
  hero: ['#FF6B35', '#FFB627'],
  cool: ['#5BC0EB', '#A06CD5'],
  cardOrange: ['rgba(255,107,53,0.15)', 'rgba(160,108,213,0.1)'],
  cardPurple: ['rgba(160,108,213,0.15)', 'rgba(91,192,235,0.1)'],
  cardGreen: ['rgba(76,217,100,0.15)', 'rgba(91,192,235,0.1)'],
  cardBlue: ['rgba(91,192,235,0.15)', 'rgba(160,108,213,0.1)'],
  glow: ['rgba(255,107,53,0.4)', 'rgba(255,107,53,0)'],
};

export const FONTS = {
  regular: 16,
  small: 14,
  tiny: 12,
  micro: 10,
  medium: 18,
  large: 22,
  xlarge: 28,
  title: 32,
  hero: 42,
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
  xl: 24,
  xxl: 32,
  round: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
};
