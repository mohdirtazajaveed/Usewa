// Central design system for U-Sewa.
// Every screen should import from here instead of hardcoding colors,
// spacing, or radius values directly.

export const colors = {
  primary: '#0B5FFF',
  primaryDark: '#0847C4',
  primaryLight: '#EAF1FF',

  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',

  textPrimary: '#101828',
  textSecondary: '#344054',
  textTertiary: '#667085',
  textPlaceholder: '#9AA5B1',

  border: '#EAECF0',
  borderLight: '#F2F4F7',

  background: '#FFFFFF',
  backgroundMuted: '#F9FAFB',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  bodyLarge: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyBold: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

// A single reusable "elevated card" shadow, tuned for iOS.
export const cardShadow = {
  shadowColor: '#101828',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2, // Android fallback
};