import { useAppNavigation } from '@/hooks/useAppNavigation';
import { ContentDimensionsProvider } from '@/hooks/useContentDimensions';
import { usesCompactIPadSidebar } from '@/lib/compat/ios15';
import { useTranslation } from '@/lib/i18n';
import { useOuterTheme } from '@/lib/theme/OuterTheme';
import { NativeTabSidebar } from '@/modules/native-layout/NativeTabSidebar.ios';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSegments } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { tabletDestinationKey, tabletDestinations } from './tabletDestinations';
import { TabletSidebarContext } from './TabletSidebarContext';
import { useSidebarServers } from './useSidebarServers';

export function TabletNavigation({ children }: PropsWithChildren) {
  if (Platform.OS !== 'ios' || !Platform.isPad) return children;
  return Number.parseInt(Platform.Version, 10) >= 18 ? (
    <AdaptiveTabNavigation>{children}</AdaptiveTabNavigation>
  ) : (
    <SplitNavigation>{children}</SplitNavigation>
  );
}

function AdaptiveTabNavigation({ children }: PropsWithChildren) {
  const { t: tr } = useTranslation();
  const goToDestination = useAppNavigation();
  const segments = useSegments();
  const { items, homeServerId, selectServer } = useSidebarServers();
  return (
    <NativeTabSidebar
      style={{ flex: 1 }}
      serversTitle={tr('navigation.servers')}
      servers={items}
      selectedServerId={tabletDestinationKey(segments) === 'home' ? (homeServerId ?? '') : ''}
      onServerSelected={({ nativeEvent }) => {
        if (selectServer(nativeEvent.id)) goToDestination('home');
      }}
    >
      {children}
    </NativeTabSidebar>
  );
}

function SplitNavigation({ children }: PropsWithChildren) {
  const { t: tr } = useTranslation();
  const theme = useOuterTheme();
  const goToDestination = useAppNavigation();
  const segments = useSegments();
  const selected = tabletDestinationKey(segments);
  const { items: servers, homeServerId, selectServer } = useSidebarServers();
  const safeArea = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // TabletNavigation mounts this fallback only on iPad.
  const compact = usesCompactIPadSidebar(Platform.OS, true, Platform.Version, width);
  const [sidebarVisible, setSidebarVisible] = useState(!compact);
  useEffect(() => {
    // iPadOS 16.4–17 approximates native adaptive split behavior when Stage
    // Manager or Split View narrows the window. iPadOS 15 remains unchanged.
    setSidebarVisible(!compact);
  }, [compact]);
  const showSidebar = useCallback(() => setSidebarVisible(true), []);
  const sidebar = useMemo(
    () => ({ isCollapsed: !sidebarVisible, showSidebar }),
    [sidebarVisible, showSidebar],
  );
  const iconNames = {
    house: 'home-outline',
    externaldrive: 'server-outline',
    heart: 'heart-outline',
    magnifyingglass: 'search-outline',
    gearshape: 'settings-outline',
  } as const;

  return (
    <TabletSidebarContext value={sidebar}>
      <View style={[styles.root, { backgroundColor: theme.colors.backgroundGrouped }]}>
        {sidebarVisible ? (
          <View
            style={[
              styles.sidebar,
              compact && styles.sidebarOverlay,
              {
                backgroundColor: theme.colors.backgroundGrouped,
                borderRightColor: theme.colors.separator,
              },
            ]}
          >
            <View style={styles.sidebarHeader}>
              <Text style={[styles.sidebarTitle, { color: theme.colors.text }]}>NekoFin</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr('common.close')}
                onPress={() => setSidebarVisible(false)}
                hitSlop={8}
              >
                <Ionicons
                  name="chevron-back-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sidebarContent}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                {tr('media.media')}
              </Text>
              {tabletDestinations.map((entry) => {
                const active = selected === entry.key;
                return (
                  <Pressable
                    key={entry.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      goToDestination(entry.key);
                      if (compact) setSidebarVisible(false);
                    }}
                    style={[
                      styles.destination,
                      active && { backgroundColor: theme.colors.surfaceMuted },
                    ]}
                  >
                    <Ionicons
                      name={iconNames[entry.icon as keyof typeof iconNames]}
                      size={19}
                      color={active ? theme.colors.tint : theme.colors.textSecondary}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.destinationLabel,
                        { color: active ? theme.colors.tint : theme.colors.text },
                      ]}
                    >
                      {entry.title}
                    </Text>
                  </Pressable>
                );
              })}
              {servers.length ? (
                <>
                  <Text
                    style={[
                      styles.sectionTitle,
                      styles.serverSectionTitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {tr('navigation.servers')}
                  </Text>
                  {servers.map((server) => {
                    const active = homeServerId === server.id && selected === 'home';
                    return (
                      <Pressable
                        key={server.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          if (selectServer(server.id)) goToDestination('home');
                          if (compact) setSidebarVisible(false);
                        }}
                        style={[
                          styles.destination,
                          active && { backgroundColor: theme.colors.surfaceMuted },
                        ]}
                      >
                        {server.avatarUri ? (
                          <Image
                            source={{ uri: server.avatarUri }}
                            contentFit="cover"
                            style={styles.serverAvatar}
                          />
                        ) : (
                          <Ionicons
                            name="server-outline"
                            size={19}
                            color={server.type === 'emby' ? '#34C759' : '#8B5CF6'}
                          />
                        )}
                        <Text
                          numberOfLines={1}
                          style={[styles.destinationLabel, { color: theme.colors.text }]}
                        >
                          {server.name}
                        </Text>
                        {active ? (
                          <Ionicons name="checkmark" size={17} color={theme.colors.tint} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </>
              ) : null}
            </ScrollView>
          </View>
        ) : (
          // Keep a permanently reachable sidebar toggle on iPadOS 15–17.
          // unstable_headerLeftItems is an iOS 26-only native-stack API.
          <View
            style={[
              styles.collapsedRail,
              {
                backgroundColor: theme.colors.backgroundGrouped,
                borderRightColor: theme.colors.separator,
                paddingTop: safeArea.top + 12,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tr('navigation.showSidebar')}
              testID="tablet-sidebar-expand"
              onPress={showSidebar}
              style={styles.railButton}
            >
              <Ionicons name="menu-outline" size={24} color={theme.colors.tint} />
            </Pressable>
          </View>
        )}
        {compact && sidebarVisible ? (
          <Pressable
            accessibilityLabel={tr('common.close')}
            accessibilityRole="button"
            onPress={() => setSidebarVisible(false)}
            style={styles.overlayScrim}
          />
        ) : null}
        <View style={styles.detail}>
          <SafeAreaProvider style={{ flex: 1 }}>
            <ContentDimensionsProvider>{children}</ContentDimensionsProvider>
          </SafeAreaProvider>
        </View>
      </View>
    </TabletSidebarContext>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 280, maxWidth: '38%', borderRightWidth: StyleSheet.hairlineWidth },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    maxWidth: '75%',
    zIndex: 3,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  overlayScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  collapsedRail: { width: 52, borderRightWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  railButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarHeader: {
    minHeight: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarTitle: { fontSize: 24, fontWeight: '700' },
  sidebarContent: { paddingHorizontal: 12, paddingBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  serverSectionTitle: { paddingTop: 26 },
  destination: {
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 3,
  },
  destinationLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  serverAvatar: { width: 22, height: 22, borderRadius: 11 },
  detail: { flex: 1, minWidth: 0 },
});
