import type { ResolvedColorScheme } from '@/lib/contexts/ThemePreferenceContext';
import { requireOptionalNativeModule } from 'expo-modules-core';

import { createAppTheme } from './theme';

type MaterialColors = {
  primary: string;
  surface: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outlineVariant: string;
  onPrimary: string;
  error: string;
  scrim: string;
};

const nativeLayout = requireOptionalNativeModule<{
  getMaterialColors: (scheme: string) => MaterialColors | null;
}>('NativeLayout');

export function createPlatformTheme(colorScheme: ResolvedColorScheme) {
  // SDK 55 removed the JS helper, but Compose still supports the same Material
  // 3 dynamic palette. Read it through the app's native layout module so
  // Android 12+ keeps its wallpaper-derived colors.
  const colors = nativeLayout?.getMaterialColors(colorScheme);
  if (!colors) return createAppTheme({ colorScheme });
  const theme = createAppTheme({ colorScheme, accentColor: colors.primary });
  return {
    ...theme,
    colors: {
      ...theme.colors,
      background: colors.surface,
      backgroundGrouped: colors.surface,
      surface: colors.surfaceContainerLow,
      surfaceElevated: colors.surfaceContainerHigh,
      surfaceMuted: colors.surfaceContainerHighest,
      text: colors.onSurface,
      textSecondary: colors.onSurfaceVariant,
      textTertiary: colors.onSurfaceVariant,
      separator: colors.outlineVariant,
      tint: colors.primary,
      inverseText: colors.onPrimary,
      danger: colors.error,
      scrim: colors.scrim,
    },
  };
}
