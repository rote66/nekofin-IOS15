import { createPlayerExitPreparation } from '@/components/player/playerExitPreparation';
import { PlayerSession, type PlayerParams } from '@/components/player/PlayerSession';
import { usePlayerEntryVisibility } from '@/hooks/usePlayerEntryVisibility';
import { usesLegacyIOSPlayerSlot } from '@/lib/compat/ios15';
import { beginNavigationTransition } from '@/lib/navigationWork';
import { canFinishPlayerExit } from '@/lib/playerExitPolicy';
import {
  resolveVideoOrientationLock,
  resolveVideoScreenOrientation,
} from '@/lib/playerOrientation';
import { storage } from '@/lib/storage';
import {
  useNavigation,
  usePreventRemove,
  type NavigationAction,
  type ParamListBase,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Slot, Stack, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { AppState, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';

export default function Layout() {
  const [videoOrientation] = useMMKVString('videoOrientation', storage);
  const useLegacyIOSSlot = usesLegacyIOSPlayerSlot(Platform.OS, Platform.Version);
  const params = useLocalSearchParams<PlayerParams>();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [hasAppeared, setHasAppeared] = useState(Platform.OS !== 'ios');
  const entry = usePlayerEntryVisibility(videoOrientation, hasAppeared);
  const { width, height } = useWindowDimensions();
  const [exitPreparation] = useState(createPlayerExitPreparation);
  const [exitPrepared, setExitPrepared] = useState(Platform.OS !== 'android');
  const [pendingExit, setPendingExit] = useState<NavigationAction | null>(null);
  const [portraitTransitionCompleted, setPortraitTransitionCompleted] = useState(false);
  const lifecycle = useMemo(
    () => ({ entryVisible: entry.visible, isExiting: pendingExit !== null, exitPreparation }),
    [entry.visible, exitPreparation, pendingExit],
  );
  // iPad multitasking can keep a landscape window despite a portrait orientation mask.
  const coordinatePortraitExit = Platform.OS === 'ios' && !Platform.isPad;
  const canFinishExit = canFinishPlayerExit({
    exitPrepared,
    coordinatePortraitExit,
    portraitTransitionCompleted,
    viewportIsPortrait: width <= height,
  });
  // Both native stacks must allow portrait before requesting the exit rotation.
  // Changing only the inner screen leaves Expo observing the outer landscape mask.
  const screenOrientation = resolveVideoScreenOrientation(
    coordinatePortraitExit && pendingExit ? 'portrait' : videoOrientation,
  );

  useEffect(() => {
    if (!coordinatePortraitExit) return;
    // Observe before an exit starts so a fast native rotation cannot beat registration.
    const subscription = ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
      setPortraitTransitionCompleted(
        orientationInfo.orientation === ScreenOrientation.Orientation.PORTRAIT_UP,
      );
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void ScreenOrientation.getOrientationAsync()
        .then((orientation) => {
          setPortraitTransitionCompleted(orientation === ScreenOrientation.Orientation.PORTRAIT_UP);
        })
        .catch((error) => console.warn('Failed to read the player orientation', error));
    });
    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
      appStateSubscription.remove();
    };
  }, [coordinatePortraitExit]);

  useLayoutEffect(
    () =>
      navigation.addListener('transitionEnd', ({ data }) => {
        if (!data.closing) {
          setHasAppeared(true);
        }
      }),
    [navigation],
  );

  useEffect(() => {
    if (Platform.OS !== 'ios' || !hasAppeared) return;
    // A reused native screen can keep the previous viewport even though its
    // orientation mask is already correct. Request rotation after presentation.
    // Fabric applies native screen options after the JS commit. Requesting
    // rotation sooner can still hit the outgoing landscape orientation mask.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        void ScreenOrientation.lockAsync(
          resolveVideoOrientationLock(
            coordinatePortraitExit && pendingExit ? 'portrait' : videoOrientation,
          ),
        ).catch((error) => console.warn('Failed to apply the player orientation', error));
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [coordinatePortraitExit, hasAppeared, pendingExit, videoOrientation]);

  // Only the unsupported iOS versions bypass nested-stack removal prevention.
  // Restore the original guard on iOS 16.4+ and Android.
  usePreventRemove(!useLegacyIOSSlot && (!pendingExit || !canFinishExit), ({ data }) => {
    if (pendingExit) return;
    beginNavigationTransition('root:player-exit-preparation');
    setPortraitTransitionCompleted(false);
    setPendingExit(data.action);
  });

  useEffect(() => {
    if (!pendingExit || Platform.OS !== 'android') return;
    let active = true;
    void exitPreparation
      .prepare()
      .catch((error) => console.warn('Failed to prepare player exit', error))
      .finally(() => {
        if (active) setExitPrepared(true);
      });
    return () => {
      active = false;
    };
  }, [exitPreparation, pendingExit]);

  useEffect(() => {
    if (!pendingExit || !coordinatePortraitExit || width > height) return;
    // A player that was already portrait has no rotation event to wait for.
    let active = true;
    void ScreenOrientation.getOrientationAsync()
      .then((orientation) => {
        if (active && orientation === ScreenOrientation.Orientation.PORTRAIT_UP) {
          setPortraitTransitionCompleted(true);
        }
      })
      .catch((error) => console.warn('Failed to read the player orientation', error));
    return () => {
      active = false;
    };
  }, [coordinatePortraitExit, height, pendingExit, width]);

  useEffect(() => {
    if (!pendingExit || !canFinishExit) return;
    // Let native screens commit the animation and removal guard before starting the pop.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => navigation.dispatch(pendingExit));
    });
    return () => cancelAnimationFrame(frame);
  }, [canFinishExit, navigation, pendingExit]);

  return (
    <>
      {/* Configure the root player route before dispatching the deferred pop. */}
      <Stack.Screen
        options={{
          // The old system needs explicit header suppression, but 16.4+
          // retains the upstream root-screen configuration unchanged.
          ...(useLegacyIOSSlot ? { headerShown: false, headerBackVisible: false } : {}),
          // Keep Android's separate video Surface in the native translation animation.
          animation: pendingExit
            ? Platform.OS === 'android'
              ? 'slide_from_bottom'
              : 'default'
            : 'none',
          animationDuration: Platform.OS === 'android' ? 220 : undefined,
          statusBarHidden: true,
          orientation: Platform.OS === 'ios' ? screenOrientation : undefined,
          navigationBarHidden: Platform.OS === 'android' ? true : undefined,
        }}
      />
      <View style={styles.container} onLayout={entry.onLayout}>
        {useLegacyIOSSlot ? (
          // Slot avoids the hidden UIKit navigation bar that intercepts the
          // iOS 15.1–16.3 player HUD Back touch. PlayerSession keeps upstream
          // playback and exit lifecycle state around the route content.
          <PlayerSession params={params} lifecycle={lifecycle} decodeParams={false}>
            <Slot />
          </PlayerSession>
        ) : (
          <Stack
            screenLayout={({ children, route }) => (
              <PlayerSession params={route.params as PlayerParams} lifecycle={lifecycle}>
                {children}
              </PlayerSession>
            )}
            // The native stack remains visible while its SurfaceView is detached on Android.
            screenOptions={{
              headerShown: false,
              orientation: Platform.OS === 'ios' ? screenOrientation : undefined,
              statusBarHidden: true,
              navigationBarHidden: Platform.OS === 'android' ? true : undefined,
              autoHideHomeIndicator: true,
              contentStyle: { backgroundColor: '#000' },
            }}
          >
            <Stack.Screen name="index" options={{ title: '', animation: 'none' }} />
          </Stack>
        )}
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
