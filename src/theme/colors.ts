/**
 * Convexa Design System - Color Tokens
 * Extracted from the HTML Tailwind config to match reference designs exactly.
 */
export const ConvexaColors = {
  // Core surfaces
  background: '#0b1326',
  surface: '#0b1326',
  surfaceDim: '#0b1326',
  surfaceContainerLowest: '#060e20',
  surfaceContainerLow: '#131b2e',
  surfaceContainer: '#171f33',
  surfaceContainerHigh: '#222a3d',
  surfaceContainerHighest: '#2d3449',
  surfaceVariant: '#2d3449',
  surfaceBright: '#31394d',

  // Primary
  primary: '#afc6ff',
  primaryContainer: '#004fb1',
  primaryFixed: '#d9e2ff',
  primaryFixedDim: '#afc6ff',
  onPrimary: '#002d6c',
  onPrimaryContainer: '#b1c8ff',
  onPrimaryFixed: '#001a43',
  onPrimaryFixedVariant: '#004398',
  inversePrimary: '#0059c6',

  // Secondary
  secondary: '#d0bcff',
  secondaryContainer: '#571bc1',
  secondaryFixed: '#e9ddff',
  secondaryFixedDim: '#d0bcff',
  onSecondary: '#3c0091',
  onSecondaryContainer: '#c4abff',
  onSecondaryFixed: '#23005c',
  onSecondaryFixedVariant: '#5516be',

  // Tertiary
  tertiary: '#dbb8ff',
  tertiaryContainer: '#644586',
  tertiaryFixed: '#efdbff',
  tertiaryFixedDim: '#dbb8ff',
  onTertiary: '#3f2160',
  onTertiaryContainer: '#dcbaff',
  onTertiaryFixed: '#29074a',
  onTertiaryFixedVariant: '#573878',

  // Neutral / On-surface
  onSurface: '#dae2fd',
  onSurfaceVariant: '#cbc3d9',
  onBackground: '#dae2fd',
  inverseSurface: '#dae2fd',
  inverseOnSurface: '#283044',

  // Border / Outline
  outline: '#948da2',
  outlineVariant: '#494456',

  // Error / Status
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',
  onErrorContainer: '#ffdad6',

  // Surface tint
  surfaceTint: '#afc6ff',

  // Convenience aliases
  textPrimary: '#dae2fd',
  textSecondary: '#cbc3d9',
  emerald: '#10b981',

  // Glass card background
  glassCard: 'rgba(45, 52, 73, 0.4)',
} as const;

export const ConvexaLightColors = {
  // Core surfaces
  background: '#f8f9fa',
  surface: '#f8f9fa',
  surfaceDim: '#e8eaec',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3f8',
  surfaceContainer: '#e8eaec',
  surfaceContainerHigh: '#e0e2ec',
  surfaceContainerHighest: '#d3d5df',
  surfaceVariant: '#e1e2ec',
  surfaceBright: '#ffffff',

  // Primary
  primary: '#0059c6',
  primaryContainer: '#d9e2ff',
  primaryFixed: '#d9e2ff',
  primaryFixedDim: '#afc6ff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#001a43',
  onPrimaryFixed: '#001a43',
  onPrimaryFixedVariant: '#004398',
  inversePrimary: '#afc6ff',

  // Secondary
  secondary: '#561cc2',
  secondaryContainer: '#e9ddff',
  secondaryFixed: '#e9ddff',
  secondaryFixedDim: '#d0bcff',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#23005c',
  onSecondaryFixed: '#23005c',
  onSecondaryFixedVariant: '#5516be',

  // Tertiary
  tertiary: '#644586',
  tertiaryContainer: '#efdbff',
  tertiaryFixed: '#efdbff',
  tertiaryFixedDim: '#dbb8ff',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#29074a',
  onTertiaryFixed: '#29074a',
  onTertiaryFixedVariant: '#573878',

  // Neutral / On-surface
  onSurface: '#1a1c20',
  onSurfaceVariant: '#44474f',
  onBackground: '#1a1c20',
  inverseSurface: '#2f3033',
  inverseOnSurface: '#f1f0f4',

  // Border / Outline
  outline: '#74777f',
  outlineVariant: '#c4c6d0',

  // Error / Status
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#410002',

  // Surface tint
  surfaceTint: '#0059c6',

  // Convenience aliases
  textPrimary: '#1a1c20',
  textSecondary: '#44474f',
  emerald: '#10b981',

  // Glass card background
  glassCard: 'rgba(255, 255, 255, 0.75)',
} as const;

export type ThemeColors = Record<keyof typeof ConvexaColors, string>;

// Keep backward compat
export const AppColors = {
  primaryDark: ConvexaColors.background,
  primaryMid: ConvexaColors.surfaceContainerLow,
  surfaceCard: ConvexaColors.surfaceContainerHigh,
  surfaceElevated: ConvexaColors.surfaceBright,
  accentCyan: ConvexaColors.primary,
  accentViolet: ConvexaColors.secondary,
  accentPink: '#EC4899',
  accentGreen: ConvexaColors.emerald,
  accentOrange: '#F59E0B',
  textPrimary: ConvexaColors.textPrimary,
  textSecondary: ConvexaColors.textSecondary,
  textMuted: '#64748B',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

export type AppColorsType = typeof AppColors;
