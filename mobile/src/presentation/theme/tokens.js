/**
 * MySeizures design tokens.
 *
 * Single source of truth for visual values. Screens and components MUST reference these by name
 * instead of writing raw colors, spacing, radii, or type sizes.
 *
 * See docs/visual-design-system.md for the rationale behind each scale.
 */

export const palette = Object.freeze({
  brandPrimary: '#17324D',
  brandAction: '#175CD3',
  brandActionPressed: '#1849A9',
});

export const colors = Object.freeze({
  brand: palette.brandPrimary,
  action: palette.brandAction,
  actionPressed: palette.brandActionPressed,

  textPrimary: '#17324D',
  textSecondary: '#334155',
  textTertiary: '#475467',
  textInverse: '#FFFFFF',
  textDisabled: '#94A3B8',

  surfaceBase: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  surfaceMuted: '#F1F5F9',
  surfacePressed: '#E8EEF5',

  borderDefault: '#D0D5DD',
  borderStrong: '#98A2B3',
  borderFocus: '#175CD3',

  success: '#067647',
  successBackground: '#ECFDF3',
  warning: '#C2410C',
  warningBackground: '#FFF7ED',
  danger: '#B42318',
  dangerBackground: '#FEF3F2',
  info: '#175CD3',
  infoBackground: '#EFF8FF',
});

export const spacing = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
});

export const radius = Object.freeze({
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
});

export const typography = Object.freeze({
  display: Object.freeze({ fontSize: 32, lineHeight: 40, fontWeight: '700' }),
  title: Object.freeze({ fontSize: 28, lineHeight: 36, fontWeight: '700' }),
  subtitle: Object.freeze({ fontSize: 21, lineHeight: 28, fontWeight: '700' }),
  bodyStrong: Object.freeze({ fontSize: 16, lineHeight: 24, fontWeight: '700' }),
  body: Object.freeze({ fontSize: 16, lineHeight: 24, fontWeight: '400' }),
  caption: Object.freeze({ fontSize: 14, lineHeight: 20, fontWeight: '600' }),
  micro: Object.freeze({ fontSize: 13, lineHeight: 18, fontWeight: '500' }),
});

/** Minimum size, in density-independent pixels, of every interactive element. */
export const touchTarget = Object.freeze({
  min: 48,
  comfortable: 56,
});

export const elevation = Object.freeze({
  card: Object.freeze({
    shadowColor: '#101828',
    shadowOffset: Object.freeze({ width: 0, height: 1 }),
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  }),
  sheet: Object.freeze({
    shadowColor: '#101828',
    shadowOffset: Object.freeze({ width: 0, height: -4 }),
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  }),
});

export const tokens = Object.freeze({
  colors,
  spacing,
  radius,
  typography,
  touchTarget,
  elevation,
});

export default tokens;
