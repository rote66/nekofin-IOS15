import { useTracedRouter } from '@/hooks/performance/useTracedRouter';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { isBelowUpstreamIOSMinimum } from '@/lib/compat/ios15';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { PlayerGlassSurface } from '../../player/PlayerGlassSurface';

type PlayerBackControlProps = {
  accessibilityLabel: string;
  fadeProgress: SharedValue<number>;
  visible: boolean;
};

/** Keep the upstream 44pt HUD untouched on its supported iOS versions. */
export function PlayerBackControl({
  accessibilityLabel,
  fadeProgress,
  visible,
}: PlayerBackControlProps) {
  const router = useTracedRouter('player-top-controls');
  const goToDestination = useAppNavigation();
  const rootNavigation = useNavigation('/');
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeProgress.value }));
  const legacy = isBelowUpstreamIOSMinimum(Platform.OS, Platform.Version);

  const handlePress = () => {
    // No synthetic timeout, debounce, or forced Home redirection after an
    // apparently failed pop. A successful touch must target exactly one route.
    if (legacy && Platform.OS === 'ios') {
      const state = rootNavigation.getState();
      const activeRoute = state?.routes?.[state.index]?.name;
      const canGoBack = rootNavigation.canGoBack();
      if (activeRoute === 'player' && canGoBack) {
        rootNavigation.goBack();
        return;
      }
    }
    // Unusual external-entry states retain normal router semantics rather
    // than silently changing the destination to the Home tab.
    if (router.canGoBack()) router.back();
    else goToDestination('servers');
  };

  if (!legacy) {
    return (
      <PlayerGlassSurface
        contentStyle={styles.originalButtonSize}
        fadeProgress={fadeProgress}
        radius={22}
        style={styles.originalButtonSize}
        surfaceStyle={styles.originalButtonSize}
        visible={visible}
      >
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          hitSlop={6}
          onPress={handlePress}
          style={({ pressed }) => [styles.originalButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
      </PlayerGlassSurface>
    );
  }

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.hitContainer, fadeStyle]}
    >
      <PlayerGlassSurface
        pointerEvents="none"
        fadeProgress={fadeProgress}
        isInteractive={false}
        radius={26}
        style={styles.glass}
        visible={visible}
      >
        <View style={styles.glassContent} />
      </PlayerGlassSurface>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPressIn={handlePress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        <Ionicons color="#fff" name="chevron-back" size={24} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  originalButtonSize: { width: 44, height: 44 },
  originalButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hitContainer: { position: 'relative', width: 52, height: 52 },
  glass: { position: 'absolute', left: 0, top: 0, width: 52, height: 52 },
  glassContent: { width: 52, height: 52 },
  pressable: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pressed: { opacity: 0.65 },
});
