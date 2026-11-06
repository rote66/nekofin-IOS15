import { isBelowUpstreamIOSMinimum } from '@/lib/compat/ios15';
import { useTranslation } from '@/lib/i18n';
import { useAppTheme } from '@/lib/theme';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { createElement, useContext } from 'react';
import { Platform, type ColorValue } from 'react-native';

import { nativeScreenTitleOptions } from './NativeScreenTitle';
import { nativeStatusBarOptions } from './nativeStackConfig';
import { platformHeaderOptions } from './platformHeaderOptions';
import { TabletChromeContext, TabletHeaderTitle } from './TabletChromeContext';
import { useTabletSidebar } from './TabletSidebarContext';

/** Let UIKit render its own navigation and scroll-edge materials on iOS 26+. */
export function useNativeListStackOptions(backgroundColor: string) {
  const { t: tr } = useTranslation();
  const theme = useAppTheme();
  const ios = Platform.OS === 'ios';
  const legacyIOS = isBelowUpstreamIOSMinimum(Platform.OS, Platform.Version);
  const sidebar = useTabletSidebar();
  const chrome = useContext(TabletChromeContext);
  return {
    ...platformHeaderOptions,
    ...nativeStatusBarOptions(theme.isDark),
    orientation: Platform.OS === 'ios' ? (Platform.isPad ? 'all' : 'portrait_up') : undefined,
    // UIKit's "prominent" blur is brighter/darker than the semantic grouped
    // page backgrounds on iOS 15. Give legacy nav bars the same opaque color
    // as their content, instead of showing a contrasting blur band.
    headerTransparent: ios && !legacyIOS,
    ...nativeScreenTitleOptions,
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    ...(Platform.OS === 'android' && chrome
      ? {
          headerTitle: ({ children, tintColor }: { children: string; tintColor?: ColorValue }) =>
            createElement(TabletHeaderTitle, { tintColor }, children),
        }
      : {}),
    // Restore upstream's reopen-sidebar button on supported iPadOS. iOS < 16.4
    // keeps its compatibility navigation-bar fallback untouched.
    ...(ios && !legacyIOS && sidebar?.isCollapsed
      ? {
          headerBackVisible: true,
          unstable_headerLeftItems: () => [
            {
              type: 'button' as const,
              label: tr('navigation.showSidebar'),
              accessibilityLabel: tr('navigation.showSidebar'),
              icon: { type: 'sfSymbol' as const, name: 'sidebar.left' as const },
              onPress: sidebar.showSidebar,
            },
          ],
        }
      : {}),
    headerBlurEffect: ios && !legacyIOS && !isLiquidGlassAvailable() ? 'prominent' : 'none',
    // Android lays non-overlay headers outside the content background. A transparent
    // toolbar exposes the outgoing screen until its native transition finishes.
    headerStyle: { backgroundColor: ios && !legacyIOS ? 'transparent' : backgroundColor },
    // Keep the gradual blur: iOS 27 gives "automatic" a distinct, sharper material.
    ...(!legacyIOS
      ? { scrollEdgeEffects: { top: 'soft' as const, bottom: 'automatic' as const } }
      : {}),
    contentStyle: { backgroundColor },
  } as const;
}
