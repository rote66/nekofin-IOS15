import { NativeBottomSheet } from '@/components/ui/NativeBottomSheet.android';
import { useTranslation } from '@/lib/i18n';
import { spacing, useAppTheme } from '@/lib/theme';
import { Column, LazyColumn, Text } from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, padding, weight } from '@expo/ui/jetpack-compose/modifiers';

export function OverviewSheet({
  overview,
  isPresented,
  onDismiss,
}: {
  overview: string;
  isPresented: boolean;
  onDismiss: () => void;
}) {
  const { t: tr } = useTranslation();
  const theme = useAppTheme();
  return (
    <NativeBottomSheet isPresented={isPresented} onDismiss={onDismiss} testID="item-overview-sheet">
      <Column
        verticalArrangement={{ spacedBy: spacing.md }}
        modifiers={[fillMaxSize(), padding(spacing.page, 0, spacing.page, spacing.page)]}
      >
        <Text color={theme.colors.text} style={{ typography: 'titleLarge', fontWeight: '600' }}>
          {tr('media.overview')}
        </Text>
        <LazyColumn modifiers={[weight(1), fillMaxWidth()]}>
          <Text color={theme.colors.text} style={{ fontSize: 17, lineHeight: 24 }}>
            {overview}
          </Text>
        </LazyColumn>
      </Column>
    </NativeBottomSheet>
  );
}
