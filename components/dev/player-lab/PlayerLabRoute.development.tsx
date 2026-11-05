import { useAppNavigation } from '@/hooks/useAppNavigation';
import { DanmakuSettingsProvider, defaultSettings } from '@/lib/contexts/DanmakuSettingsContext';
import { setVisibilityAsync } from 'expo-navigation-bar';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PlayerLabScreen } from './PlayerLabScreen';

export function PlayerLabRoute() {
  const router = useRouter();
  const goToDestination = useAppNavigation();
  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    goToDestination('settings');
  }, [router, goToDestination]);

  useEffect(() => {
    if (Platform.OS === 'android') void setVisibilityAsync('hidden');

    return () => {
      if (Platform.OS === 'android') void setVisibilityAsync('visible');
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ backgroundColor: '#090B10', flex: 1 }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <DanmakuSettingsProvider initialSettings={defaultSettings} persist={false}>
          <PlayerLabScreen onClose={close} />
        </DanmakuSettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
