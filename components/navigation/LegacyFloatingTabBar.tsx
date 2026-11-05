import { navigationDestinations } from '@/components/navigation/navigationDestinations';
import { useAppTheme } from '@/lib/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BAR_HEIGHT = 70;
const BAR_BOTTOM_GAP = 8;

/** The iOS 26 floating capsule visual, built with iOS 15-compatible views. */
export function LegacyFloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const isDark = theme.isDark;
  const barWidth = Math.min(Math.max(width - 28, 0), 510);
  const itemWidth = (barWidth - 10) / Math.max(1, state.routes.length);
  const indicatorPosition = useSharedValue(state.index * itemWidth);
  const items = useMemo(
    () =>
      state.routes.map((route) => ({
        route,
        destination: navigationDestinations.find((item) => item.name === route.name),
      })),
    [state.routes],
  );

  useEffect(() => {
    indicatorPosition.value = withTiming(state.index * itemWidth, {
      duration: 250,
      reduceMotion: ReduceMotion.System,
    });
  }, [indicatorPosition, itemWidth, state.index]);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  if (Platform.OS === 'ios' && Platform.isPad) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { height: BAR_HEIGHT + BAR_BOTTOM_GAP + insets.bottom }]}
    >
      <View
        style={[
          styles.capsule,
          {
            width: barWidth,
            backgroundColor: isDark ? 'rgba(37,39,42,0.77)' : 'rgba(250,251,253,0.80)',
            borderColor: isDark ? 'rgba(255,255,255,0.30)' : 'rgba(95,103,115,0.28)',
          },
        ]}
      >
        <BlurView
          pointerEvents="none"
          tint={isDark ? 'dark' : 'light'}
          intensity={75}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.selectionIndicator,
            {
              width: itemWidth,
              backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.87)',
              borderColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(96,105,119,0.28)',
            },
            indicatorStyle,
          ]}
        />
        {items.map(({ route, destination }, index) => {
          const selected = state.index === index;
          const label = destination?.title ?? route.name;
          const icon =
            destination?.key === 'home'
              ? selected
                ? 'home'
                : 'home-outline'
              : destination?.key === 'servers'
                ? selected
                  ? 'server'
                  : 'server-outline'
                : destination?.key === 'favorites'
                  ? selected
                    ? 'heart'
                    : 'heart-outline'
                  : destination?.key === 'search'
                    ? 'search'
                    : selected
                      ? 'settings'
                      : 'settings-outline';
          const foreground = isDark ? '#FFF' : '#20242B';

          return (
            <Pressable
              key={route.key}
              accessibilityLabel={label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <Ionicons name={icon} size={23} color={foreground} />
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: foreground, fontSize: Math.min(11, 11 * fontScale) },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: BAR_BOTTOM_GAP,
  },
  capsule: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 15,
    elevation: 8,
  },
  item: {
    flex: 1,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 5,
    top: 5,
    bottom: 5,
    borderRadius: 36,
    borderWidth: 1,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  label: { fontWeight: '600', letterSpacing: -0.2, textAlign: 'center' },
  pressed: { opacity: 0.6 },
});
