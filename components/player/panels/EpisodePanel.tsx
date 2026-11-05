import { ItemImage } from '@/components/ItemImage';
import { getImagePreferenceOptions } from '@/components/media/cardHelpers';
import { NativeSettingsItem, NativeSettingsText } from '@/components/ui/NativeSettings';
import { SettingsSubtitle, SettingsSymbol, SettingsTitle } from '@/components/ui/SettingsVisual';
import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import { isBelowUpstreamIOSMinimum } from '@/lib/compat/ios15';
import { useTranslation } from '@/lib/i18n';
import { useAppTheme } from '@/lib/theme';
import { formatDurationFromTicks } from '@/lib/utils';
import type { MediaItem } from '@/services/media/types';
import { RNHostView as ComposeRNHostView, LazyColumn } from '@expo/ui/jetpack-compose';
import { testID as composeTestID } from '@expo/ui/jetpack-compose/modifiers';
import {
  ContentUnavailableView,
  List as SwiftList,
  Section as SwiftSection,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  backgroundOverlay,
  clipShape,
  createModifier,
  frame,
  onAppear,
  onDisappear,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models';
import { memo, useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export type EpisodePanelProps = {
  episodes: readonly MediaItem[];
  currentItemId?: string | null;
  onSelectEpisode: (episodeId: string) => void;
};

type EpisodeRowModel = {
  id: string;
  title: string;
  metadata: string;
  overview?: string;
  imageUrl?: string;
  blurhash?: string;
};

const imageOptions = getImagePreferenceOptions(ImageType.Thumb);
const supportsNativeScrollViewEpisodeStyle =
  Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 17;
const supportsContentUnavailableView = supportsNativeScrollViewEpisodeStyle;
const supportsNativeEpisodeScroll =
  Platform.OS === 'ios' && !isBelowUpstreamIOSMinimum(Platform.OS, Platform.Version);

type EpisodeNativeRowProps = EpisodeRowModel & {
  current: boolean;
  onSelectEpisode: (episodeId: string) => void;
};

const EpisodeNativeRow = memo(function EpisodeNativeRow({
  id,
  title,
  metadata,
  overview,
  imageUrl,
  blurhash,
  current,
  onSelectEpisode,
}: EpisodeNativeRowProps) {
  const { t: tr } = useTranslation();
  const theme = useAppTheme();
  const [artworkVisible, setArtworkVisible] = useState(Platform.OS !== 'ios');
  const handlePress = useCallback(() => onSelectEpisode(id), [id, onSelectEpisode]);
  const handleArtworkAppear = useCallback(() => setArtworkVisible(true), []);
  const handleArtworkDisappear = useCallback(() => setArtworkVisible(false), []);
  const rowLabel = [title, metadata, current ? tr('player.nowPlaying') : null]
    .filter(Boolean)
    .join('，');
  const modifiers =
    Platform.OS === 'ios'
      ? [
          frame({ maxWidth: Infinity, minHeight: 76, alignment: 'leading' }),
          padding({ horizontal: 10, vertical: 8 }),
          backgroundOverlay({ color: current ? theme.colors.surfaceMuted : 'transparent' }),
          clipShape('roundedRectangle', 15),
          createModifier('nekofinAccessibilityCombine', {}),
          accessibilityLabel(rowLabel),
          ...(current
            ? [createModifier('nekofinAccessibilityTraits', { traits: ['isSelected'] })]
            : []),
          onAppear(handleArtworkAppear),
          onDisappear(handleArtworkDisappear),
          ...(supportsNativeEpisodeScroll ? [createModifier('nekofinEpisodeRowID', { id })] : []),
          ...(supportsNativeScrollViewEpisodeStyle
            ? [createModifier('nekofinEpisodeListRow', {})]
            : []),
        ]
      : undefined;
  const supportingText =
    metadata || overview ? (
      <>
        {metadata ? (
          <NativeSettingsText
            color={theme.colors.textSecondary}
            fontSize={12}
            fontWeight="medium"
            lineHeight={15}
            maxLines={1}
          >
            {metadata}
          </NativeSettingsText>
        ) : null}
        {overview ? (
          <NativeSettingsText
            color={theme.colors.textTertiary}
            fontSize={11}
            lineHeight={14}
            maxLines={1}
          >
            {overview}
          </NativeSettingsText>
        ) : null}
      </>
    ) : undefined;
  const thumbnail = (
    <View pointerEvents="none" style={styles.thumbnailFrame}>
      {!imageUrl || artworkVisible ? (
        <ItemImage
          cachePolicy="disk"
          contentFit="cover"
          placeholderBlurhash={blurhash}
          recyclingKey={id}
          style={styles.thumbnail}
          transition={120}
          uri={imageUrl}
        />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons color={theme.colors.textTertiary} name="film-outline" size={28} />
        </View>
      )}
      {current ? (
        <View style={styles.playingBadge}>
          <Ionicons color="#111318" name="play" size={12} />
        </View>
      ) : null}
    </View>
  );

  return (
    <NativeSettingsItem
      leading={
        Platform.OS === 'android' ? (
          <ComposeRNHostView matchContents>{thumbnail}</ComposeRNHostView>
        ) : (
          thumbnail
        )
      }
      title={
        <NativeSettingsText
          color={theme.colors.text}
          fontSize={14}
          fontWeight="semibold"
          lineHeight={18}
          maxLines={2}
        >
          {title}
        </NativeSettingsText>
      }
      subtitle={supportingText}
      trailing={current ? <SettingsSymbol name="speaker.wave.2.fill" tone="muted" /> : undefined}
      disclosure={!current}
      onPress={current ? undefined : handlePress}
      modifiers={modifiers}
      testID={`player-episode-${id}`}
    />
  );
});

function EpisodeEmptyState() {
  const { t: tr } = useTranslation();
  if (supportsContentUnavailableView) {
    return (
      <ContentUnavailableView
        description={tr('media.seasonEpisodesUnavailable')}
        modifiers={[frame({ maxHeight: Infinity, maxWidth: Infinity })]}
        systemImage="rectangle.stack"
        title={tr('media.noEpisodes')}
      />
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <SwiftList
        modifiers={[createModifier('nekofinEpisodeListStyle', {})]}
        testID="player-episode-panel"
      >
        <SwiftSection title={tr('media.series')}>
          <NativeSettingsItem
            title={<SettingsTitle>{tr('media.noEpisodes')}</SettingsTitle>}
            subtitle={<SettingsSubtitle primary={tr('media.seasonEpisodesUnavailable')} />}
          />
        </SwiftSection>
      </SwiftList>
    );
  }

  return (
    <LazyColumn modifiers={[composeTestID('player-episode-panel')]}>
      <NativeSettingsItem
        title={<SettingsTitle>{tr('media.noEpisodes')}</SettingsTitle>}
        subtitle={<SettingsSubtitle primary={tr('media.seasonEpisodesUnavailable')} />}
      />
    </LazyColumn>
  );
}

export function EpisodePanel({ episodes, currentItemId, onSelectEpisode }: EpisodePanelProps) {
  const { t: tr } = useTranslation();
  const mediaAdapter = useMediaAdapter();
  const rows = useMemo<EpisodeRowModel[]>(
    () =>
      episodes.map((episode) => {
        const seasonEpisode = [
          episode.parentIndexNumber != null ? `S${episode.parentIndexNumber}` : null,
          episode.indexNumber != null ? `E${episode.indexNumber}` : null,
        ]
          .filter(Boolean)
          .join(' ');
        const duration = episode.runTimeTicks
          ? formatDurationFromTicks(episode.runTimeTicks)
          : null;
        const imageInfo = mediaAdapter.getImageInfo({ item: episode, opts: imageOptions });

        return {
          id: episode.id,
          title: episode.name,
          metadata: [seasonEpisode, duration].filter(Boolean).join(' · '),
          overview: episode.overview?.trim() || undefined,
          imageUrl: imageInfo.url,
          blurhash: imageInfo.blurhash,
        };
      }),
    [episodes, mediaAdapter],
  );
  if (rows.length === 0) return <EpisodeEmptyState />;

  const rowNodes = rows.map((row) => (
    <EpisodeNativeRow
      key={row.id}
      blurhash={row.blurhash}
      current={row.id === currentItemId}
      id={row.id}
      imageUrl={row.imageUrl}
      metadata={row.metadata}
      onSelectEpisode={onSelectEpisode}
      overview={row.overview}
      title={row.title}
    />
  ));

  if (Platform.OS === 'ios') {
    // Preserve the upstream chronological episode order and centered current
    // item on iOS 16.4+. ScrollViewReader is available before the SDK 57-only
    // scrollPosition/useNativeState bridge introduced in iOS 17.
    if (supportsNativeEpisodeScroll) {
      return (
        <SwiftList
          modifiers={[
            createModifier('nekofinEpisodeListStyle', {}),
            createModifier('nekofinEpisodeScrollTo', { targetID: currentItemId ?? '' }),
          ]}
          testID="player-episode-panel"
        >
          <SwiftSection>{rowNodes}</SwiftSection>
        </SwiftList>
      );
    }

    const currentIndex = rows.findIndex((row) => row.id === currentItemId);
    const currentRowNode = currentIndex >= 0 ? rowNodes[currentIndex] : null;
    const remainingRowNodes = rowNodes.filter((_, index) => index !== currentIndex);

    return (
      <SwiftList testID="player-episode-panel">
        {currentRowNode ? (
          <SwiftSection title={tr('player.nowPlaying')}>{currentRowNode}</SwiftSection>
        ) : null}
        <SwiftSection title={currentRowNode ? tr('media.allEpisodes') : undefined}>
          {remainingRowNodes}
        </SwiftSection>
      </SwiftList>
    );
  }

  return <LazyColumn modifiers={[composeTestID('player-episode-panel')]}>{rowNodes}</LazyColumn>;
}

const styles = StyleSheet.create({
  thumbnailFrame: {
    backgroundColor: 'rgba(127,127,127,0.12)',
    borderCurve: 'continuous',
    borderRadius: 10,
    height: 63,
    overflow: 'hidden',
    width: 112,
  },
  thumbnail: {
    height: '100%',
    width: '100%',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  playingBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    bottom: 6,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    width: 24,
  },
});
