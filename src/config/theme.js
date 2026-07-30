/**
 * Smit Gym — Light Sport Theme
 *
 * Design language (see docs/DESIGN_PROMPT.md):
 * - Neutral light base holds ~90% of the screen; colour is reserved for DATA.
 * - Every domain has ONE fixed colour: workouts, nutrition, water, community,
 *   energy. Colour therefore carries meaning, not decoration.
 * - Cards are white with a soft shadow, generous radius, generous spacing.
 * - Gradients appear only as small accents (rings, primary button, hero card).
 */

export const COLORS = {
  // ── Base surfaces ─────────────────────────────────────────────────────────
  background: '#F2F2F7',       // page background (iOS grouped)
  backgroundDeep: '#E9E9EF',
  backgroundLight: '#FFFFFF',
  surface: '#FFFFFF',          // cards
  surfaceLight: '#F7F7FA',     // inputs / inset rows
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.82)',

  // ── Domain colours (colour == meaning) ────────────────────────────────────
  primary: '#FF375F',          // workouts / calories / brand
  primaryDark: '#D81E45',
  primaryLight: '#FF6B87',
  primaryGlow: 'rgba(255, 55, 95, 0.22)',
  primarySoft: 'rgba(255, 55, 95, 0.10)',

  secondary: '#0A84FF',        // water / info
  secondaryDark: '#0060DF',
  secondaryLight: '#5AB0FF',
  secondarySoft: 'rgba(10, 132, 255, 0.10)',

  tertiary: '#BF5AF2',         // community / AI
  tertiaryDark: '#9A32D4',
  tertiaryLight: '#D08CF7',
  tertiarySoft: 'rgba(191, 90, 242, 0.10)',

  accent: '#FF9F0A',           // energy / steps
  accentDark: '#E08600',
  accentSoft: 'rgba(255, 159, 10, 0.12)',

  // ── Status ────────────────────────────────────────────────────────────────
  success: '#248A3D',          // nutrition (darkened for contrast on white)
  successBright: '#30D158',    // use for fills/rings, not small text
  successDark: '#1B6E2E',
  successSoft: 'rgba(48, 209, 88, 0.12)',
  error: '#D70015',
  errorDark: '#A5000F',
  warning: '#B25000',
  warningBright: '#FF9F0A',
  info: '#0A84FF',

  // ── Text ──────────────────────────────────────────────────────────────────
  text: '#0B0B0F',             // primary text (near-black)
  textSecondary: '#4B4B55',
  textMuted: '#8A8A93',
  textDim: '#B0B0B8',
  textOnColor: '#FFFFFF',      // text sitting ON a coloured/gradient surface

  // ── Lines ─────────────────────────────────────────────────────────────────
  border: 'rgba(0, 0, 0, 0.07)',
  borderLight: 'rgba(0, 0, 0, 0.04)',
  borderActive: 'rgba(255, 55, 95, 0.35)',

  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.45)',
};

/** Per-domain colour lookup — use this instead of picking colours ad hoc. */
export const DOMAIN = {
  workout: { color: COLORS.primary, soft: COLORS.primarySoft, ring: ['#FF375F', '#FF6B87'] },
  nutrition: { color: COLORS.success, soft: COLORS.successSoft, ring: ['#30D158', '#6FE38C'] },
  water: { color: COLORS.secondary, soft: COLORS.secondarySoft, ring: ['#0A84FF', '#5AB0FF'] },
  community: { color: COLORS.tertiary, soft: COLORS.tertiarySoft, ring: ['#BF5AF2', '#D08CF7'] },
  energy: { color: COLORS.accent, soft: COLORS.accentSoft, ring: ['#FF9F0A', '#FFC24D'] },
};

export const GRADIENTS = {
  primary: ['#FF375F', '#FF6B87'],
  primaryHero: ['#FF375F', '#BF5AF2'],
  aurora: ['#FF375F', '#BF5AF2', '#0A84FF'],
  sunset: ['#FF375F', '#FF9F0A'],
  ocean: ['#0A84FF', '#BF5AF2'],
  forest: ['#30D158', '#0A84FF'],
  fire: ['#FF375F', '#FF9F0A'],

  // Neutral / surface
  dark: ['#FFFFFF', '#F7F7FA'],
  darkDeep: ['#F2F2F7', '#E9E9EF'],
  darkSurface: ['#FFFFFF', '#FAFAFC'],
  surface: ['#FFFFFF', '#FAFAFC'],

  success: ['#30D158', '#6FE38C'],
  hero: ['#FF375F', '#FF9F0A'],
  cool: ['#0A84FF', '#BF5AF2'],

  // Very soft card tints (light mode — barely-there washes)
  cardPink: ['rgba(255,55,95,0.10)', 'rgba(255,55,95,0.02)'],
  cardPurple: ['rgba(191,90,242,0.10)', 'rgba(191,90,242,0.02)'],
  cardCyan: ['rgba(10,132,255,0.10)', 'rgba(10,132,255,0.02)'],
  cardLime: ['rgba(48,209,88,0.10)', 'rgba(48,209,88,0.02)'],
  cardAmber: ['rgba(255,159,10,0.12)', 'rgba(255,159,10,0.02)'],
  cardOrange: ['rgba(255,55,95,0.10)', 'rgba(255,159,10,0.03)'],
  cardGreen: ['rgba(48,209,88,0.10)', 'rgba(10,132,255,0.03)'],
  cardBlue: ['rgba(10,132,255,0.10)', 'rgba(191,90,242,0.03)'],

  glow: ['rgba(255,55,95,0.18)', 'rgba(255,55,95,0)'],
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
  hero: 42,
  display: 56,   // the "giant metric" size
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
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  round: 999,
};

/** Soft, believable shadows for a light UI. */
export const SHADOWS = {
  small: {
    shadowColor: '#0B0B0F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: '#0B0B0F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  large: {
    shadowColor: '#0B0B0F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#FF375F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  glowPurple: {
    shadowColor: '#BF5AF2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 6,
  },
  glowCyan: {
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 6,
  },
};
