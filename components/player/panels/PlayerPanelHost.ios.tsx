import { isBelowUpstreamIOSMinimum } from '@/lib/compat/ios15';
import { useTranslation } from '@/lib/i18n';
import { useAppTheme } from '@/lib/theme';
import { BottomSheet, Button, Host, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonStyle,
  createModifier,
  createModifierWithEventListener,
  foregroundStyle,
  frame,
  labelStyle,
  padding,
  presentationDetents,
  presentationDragIndicator,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { Platform, StyleSheet, View } from 'react-native';

import { usePlayerPanelPresentation, type PlayerPanelHostProps } from './playerPanelPresentation';

export function PlayerPanelHost(props: PlayerPanelHostProps) {
  const { t: tr } = useTranslation();
  const { visible, onDismiss, testID = 'player-panel-host' } = props;
  const theme = useAppTheme();
  const panel = usePlayerPanelPresentation(props);
  const legacyHeader = isBelowUpstreamIOSMinimum(Platform.OS, Platform.Version);
  const nativeNavigation = createModifierWithEventListener(
    'nekofinPlayerNavigation',
    (event) => {
      if (event.action === 'back') panel.onBack?.();
      if (event.action === 'close') onDismiss();
    },
    {
      title: panel.title,
      showsBack: !!panel.onBack,
      backLabel: tr('common.back'),
      backAccessibilityLabel: tr('common.goBack'),
      closeAccessibilityLabel: tr('common.closeTitle', { title: panel.title }),
      backgroundColor: theme.colors.backgroundGrouped,
      tintColor: theme.colors.tint,
    },
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Host style={StyleSheet.absoluteFill} colorScheme={theme.colorScheme}>
        <BottomSheet
          isPresented={visible}
          onIsPresentedChange={(presented) => {
            if (!presented) onDismiss();
          }}
          testID={testID}
        >
          <VStack
            modifiers={[
              ...(legacyHeader
                ? [
                    presentationDetents(['large']),
                    presentationDragIndicator('visible'),
                    createModifier('nekofinPresentationBackground', {
                      color: theme.colors.backgroundGrouped,
                    }),
                    createModifier('nekofinScrollEdgeEffectStyle', {}),
                    tint(theme.colors.tint),
                  ]
                : [nativeNavigation]),
              frame({ maxWidth: Infinity, maxHeight: Infinity }),
            ]}
          >
            {legacyHeader ? (
              <HStack
                spacing={12}
                modifiers={[
                  padding({ horizontal: 16, vertical: 10 }),
                  frame({ maxWidth: Infinity }),
                ]}
              >
                {panel.onBack ? (
                  <Button
                    label={tr('common.back')}
                    systemImage="chevron.backward"
                    onPress={panel.onBack}
                    modifiers={[buttonStyle('borderless'), accessibilityLabel(tr('common.goBack'))]}
                  />
                ) : (
                  <Spacer />
                )}
                <Spacer />
                <Text
                  modifiers={[
                    createModifier('nekofinFontTextStyle', {
                      textStyle: 'headline',
                      weight: 'semibold',
                    }),
                    foregroundStyle(theme.colors.text),
                  ]}
                >
                  {panel.title}
                </Text>
                <Spacer />
                <Button
                  role="cancel"
                  label={tr('common.close')}
                  systemImage="xmark"
                  onPress={onDismiss}
                  modifiers={[
                    labelStyle('iconOnly'),
                    buttonStyle('borderless'),
                    accessibilityLabel(tr('common.closeTitle', { title: panel.title })),
                  ]}
                />
              </HStack>
            ) : null}
            {panel.children}
          </VStack>
        </BottomSheet>
      </Host>
    </View>
  );
}
