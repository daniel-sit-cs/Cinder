// Design tokens — single source of truth for the entire app
// Based on the UI/UX Design Specification guide

export const colors = {
  // Backgrounds (use depth, not pure black)
  bg:          '#0D0D0F',
  surface:     '#1A1A2E',
  card:        '#1E1E2A',
  cardBorder:  'rgba(255,255,255,0.06)',

  // Accent — electric violet (primary), cyan (secondary)
  accent:       '#7C5CFC',
  accentMuted:  'rgba(124,92,252,0.15)',
  accentDim:    'rgba(124,92,252,0.35)',
  cyan:         '#4ECDC4',
  cyanMuted:    'rgba(78,205,196,0.15)',

  // Text
  textPrimary:   '#F0F0F5',
  textSecondary: '#8888A0',
  textMuted:     '#555570',

  // Feedback
  success: '#00D68F',
  error:   '#FF6B6B',
  warning: '#F5A623',
};

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
};

export const spacing = {
  xs:  8,
  sm:  12,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const font = {
  hero:    { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  section: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  title:   { fontSize: 18, fontWeight: '600' as const },
  body:    { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  label:   { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  micro:   { fontSize: 11, fontWeight: '400' as const },
};
