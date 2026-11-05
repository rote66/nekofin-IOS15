import { isBelowUpstreamIOSMinimum } from '@/lib/compat/ios15';
import { useTranslation } from '@/lib/i18n';
import { spacing, useAppTheme } from '@/lib/theme';
import {
  BottomSheet,
  Host,
  HStack,
  ScrollView,
  Spacer,
  Button as SwiftButton,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  createModifier,
  fixedSize,
  foregroundStyle,
  frame,
  padding,
  presentationDetents,
  presentationDragIndicator,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

type OverviewSheetTheme = ReturnType<typeof useAppTheme>;

function LegacyOverviewSheet({
  overview,
  isPresented,
  onDismiss,
  theme,
  overviewTitle,
  doneTitle,
}: {
  overview: string;
  isPresented: boolean;
  onDismiss: () => void;
  theme: OverviewSheetTheme;
  overviewTitle: string;
  doneTitle: string;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const maxHeight = windowHeight * 0.7;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Host style={StyleSheet.absoluteFill} colorScheme={theme.colorScheme}>
        <BottomSheet
          isPresented={isPresented}
          onIsPresentedChange={(presented) => {
            if (!presented) onDismiss();
          }}
          fitToContents
          testID="item-overview-sheet"
        >
          <VStack
            spacing={spacing.lg}
            modifiers={[
              frame({ maxWidth: Infinity, alignment: 'topLeading' }),
              padding({
                top: spacing.xl,
                leading: spacing.page,
                trailing: spacing.page,
                bottom: spacing.page,
              }),
              presentationDragIndicator('visible'),
            ]}
          >
            <HStack alignment="center">
              <Text
                modifiers={[
                  createModifier('nekofinFontTextStyle', {
                    textStyle: 'title3',
                    weight: 'semibold',
                  }),
                  foregroundStyle(theme.colors.text),
                  createModifier('nekofinAccessibilityTraits', { traits: ['isHeader'] }),
                ]}
              >
                {overviewTitle}
              </Text>
              <Spacer />
              <SwiftButton
                label={doneTitle}
                onPress={onDismiss}
                modifiers={[buttonStyle('borderless'), tint(theme.colors.tint)]}
              />
            </HStack>
            <ScrollView modifiers={[frame({ maxHeight })]}>
              <Text
                modifiers={[
                  createModifier('nekofinFontTextStyle', { textStyle: 'body' }),
                  foregroundStyle(theme.colors.text),
                  fixedSize({ horizontal: false, vertical: true }),
                  frame({ maxWidth: Infinity, alignment: 'leading' }),
                ]}
              >
                {overview}
              </Text>
            </ScrollView>
          </VStack>
        </BottomSheet>
      </Host>
    </View>
  );
}

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
  const overviewTitle = tr('media.overview') as string;
  const doneTitle = tr('common.done') as string;

  // Keep the original medium/large sheet on iPad and supported iPhones.
  // Only older iPhones need the fit-to-content compatibility presentation.
  const isPad = Platform.OS === 'ios' && Platform.isPad;
  if (isPad || !isBelowUpstreamIOSMinimum(Platform.OS, Platform.Version)) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Host style={{ position: 'absolute' }} colorScheme={theme.colorScheme}>
          <BottomSheet
            isPresented={isPresented}
            onIsPresentedChange={(presented) => {
              if (!presented) onDismiss();
            }}
            testID="item-overview-sheet"
          >
            <VStack
              alignment="leading"
              spacing={spacing.md}
              modifiers={[
                frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
                padding({
                  top: spacing.lg,
                  leading: spacing.page,
                  trailing: spacing.page,
                  bottom: spacing.page,
                }),
                presentationDetents(['medium', 'large']),
                presentationDragIndicator('visible'),
              ]}
            >
              <Text
                modifiers={[
                  createModifier('nekofinFontTextStyle', {
                    textStyle: 'title3',
                    weight: 'semibold',
                  }),
                  foregroundStyle(theme.colors.text),
                  createModifier('nekofinAccessibilityTraits', { traits: ['isHeader'] }),
                ]}
              >
                {tr('media.overview')}
              </Text>
              <ScrollView>
                <Text
                  modifiers={[
                    createModifier('nekofinFontTextStyle', { textStyle: 'body' }),
                    foregroundStyle(theme.colors.text),
                    fixedSize({ horizontal: false, vertical: true }),
                    frame({ maxWidth: Infinity, alignment: 'leading' }),
                  ]}
                >
                  {overview}
                </Text>
              </ScrollView>
            </VStack>
          </BottomSheet>
        </Host>
      </View>
    );
  }

  return (
    <LegacyOverviewSheet
      overview={overview}
      isPresented={isPresented}
      onDismiss={onDismiss}
      theme={theme}
      overviewTitle={overviewTitle}
      doneTitle={doneTitle}
    />
  );
}
