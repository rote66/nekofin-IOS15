import { FloatingTabBarInsetProvider } from '@/components/navigation/FloatingTabBarInset';
import { LegacyFloatingTabBar } from '@/components/navigation/LegacyFloatingTabBar';
import { navigationDestinations } from '@/components/navigation/navigationDestinations';
import { TabletNavigation } from '@/components/navigation/TabletNavigation';
import { usesAndroidNavigationRail } from '@/lib/adaptiveLayout';
import { iosTabPresentation } from '@/lib/compat/ios15';
import { useTranslation } from '@/lib/i18n';
import { useAppTheme } from '@/lib/theme';
import { useOuterTheme } from '@/lib/theme/OuterTheme';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform, useWindowDimensions } from 'react-native';

export default function TabLayout() {
  useTranslation();
  const accentColor = useOuterTheme().colors.tint;
  const theme = useAppTheme();
  const tablet = Platform.OS === 'ios' && Platform.isPad;
  const tabPolicy = iosTabPresentation(Platform.OS, tablet, Platform.Version);
  const { width, height } = useWindowDimensions();
  const rail = Platform.OS === 'android' && usesAndroidNavigationRail(width, height);

  return (
    <TabletNavigation>
      <FloatingTabBarInsetProvider>
        {tabPolicy.legacyNativeTabs ? (
          <Tabs
            tabBar={(props) => <LegacyFloatingTabBar {...props} />}
            screenOptions={{ headerShown: false }}
          >
            {navigationDestinations.map((destination) => (
              <Tabs.Screen
                key={destination.key}
                name={destination.name}
                options={{ title: destination.title }}
              />
            ))}
          </Tabs>
        ) : (
          <NativeTabs
            sidebarAdaptable={tabPolicy.sidebarAdaptable ? true : undefined}
            hidden={rail}
            backgroundColor="transparent"
            blurEffect="systemUltraThinMaterial"
            minimizeBehavior={tabPolicy.nativeTabMinimization ? 'onScrollDown' : undefined}
            shadowColor="transparent"
            iconColor={
              Platform.OS === 'android'
                ? { default: theme.colors.textSecondary, selected: accentColor }
                : undefined
            }
            labelStyle={
              Platform.OS === 'android'
                ? {
                    default: { color: theme.colors.textSecondary, fontSize: 12 },
                    selected: { color: accentColor, fontSize: 12, fontWeight: '700' },
                  }
                : undefined
            }
            labelVisibilityMode={Platform.OS === 'android' ? 'labeled' : undefined}
            rippleColor={Platform.OS === 'android' ? 'transparent' : undefined}
          >
            {navigationDestinations.map((destination) => (
              <NativeTabs.Trigger
                key={destination.key}
                name={destination.name}
                role={
                  (Platform.OS === 'android' || tabPolicy.nativeTabMinimization) &&
                  destination.role === 'search'
                    ? 'search'
                    : undefined
                }
                contentStyle={
                  destination.key === 'home'
                    ? { backgroundColor: theme.colors.background }
                    : undefined
                }
                disableAutomaticContentInsets={
                  Platform.OS === 'android' ||
                  (tablet && (destination.key === 'home' || destination.key === 'servers'))
                }
              >
                <NativeTabs.Trigger.Label>{destination.title}</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                  drawable={destination.drawable}
                  sf={destination.sf}
                  selectedColor={accentColor}
                />
              </NativeTabs.Trigger>
            ))}
          </NativeTabs>
        )}
      </FloatingTabBarInsetProvider>
    </TabletNavigation>
  );
}
