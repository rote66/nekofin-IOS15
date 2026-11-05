import { NativeSettingsForm, NativeSettingsItem } from '@/components/ui/NativeSettings';
import { isBelowUpstreamIOSMinimum } from '@/lib/compat/ios15';
import { useTranslation } from '@/lib/i18n';
import { MEDIA_SERVER_TYPE_OPTIONS } from '@/lib/mediaServerTypes';
import { useAppTheme } from '@/lib/theme';
import type { MediaServerType } from '@/services/media/types';
import {
  Section as SwiftSection,
  Text as SwiftText,
  VStack as SwiftVStack,
} from '@expo/ui/swift-ui';
import { createModifier, font, foregroundStyle, frame, padding } from '@expo/ui/swift-ui/modifiers';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ServerTypeIcon } from './ServerTypeIcon';

export function ServerTypePicker({ onSelect }: { onSelect: (type: MediaServerType) => void }) {
  const { t: tr } = useTranslation();
  const theme = useAppTheme();

  // Use the original native Form / Section / button presentation on supported
  // iPhones. Keep the RN picker on iPad until its deferred navigation/form
  // pass can be validated.
  if (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !isBelowUpstreamIOSMinimum('ios', Platform.Version)
  ) {
    return (
      <NativeSettingsForm testID="server-type-picker">
        <SwiftSection
          header={
            <SwiftVStack
              alignment="leading"
              spacing={0}
              modifiers={[frame({ maxWidth: Infinity }), padding({ top: 20, bottom: 20 })]}
            >
              <SwiftText
                modifiers={[
                  font({ size: 28, weight: 'bold' }),
                  foregroundStyle(theme.colors.text),
                  createModifier('nekofinAccessibilityTraits', { traits: ['isHeader'] }),
                ]}
              >
                {tr('server.addFirstServer')}
              </SwiftText>
            </SwiftVStack>
          }
        >
          {MEDIA_SERVER_TYPE_OPTIONS.map(({ type, label }) => (
            <NativeSettingsItem
              key={type}
              title={label}
              leading={<ServerTypeIcon type={type} size={36} />}
              disclosure
              onPress={() => onSelect(type)}
              testID={`connect-${type}`}
            />
          ))}
        </SwiftSection>
      </NativeSettingsForm>
    );
  }

  return (
    <ScrollView
      testID="server-type-picker"
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{
        flexGrow: 1,
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
        paddingHorizontal: theme.spacing.page,
        paddingTop: theme.spacing.lg,
        paddingBottom: 40,
      }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[theme.typography.title3, { color: theme.colors.text }]}>
        {tr('server.addFirstServer')}
      </Text>
      <View
        style={[
          styles.options,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.separator },
        ]}
      >
        {MEDIA_SERVER_TYPE_OPTIONS.map(({ type, label }, index) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityLabel={label}
            testID={'connect-' + type}
            onPress={() => onSelect(type)}
            style={({ pressed }) => [
              styles.option,
              index < MEDIA_SERVER_TYPE_OPTIONS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.separator,
              },
              pressed && { backgroundColor: theme.colors.surfaceMuted },
            ]}
          >
            <ServerTypeIcon type={type} size={36} />
            <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  options: {
    marginTop: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
  },
  option: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
