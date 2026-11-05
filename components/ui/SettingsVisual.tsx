import { AvatarImage } from '@/components/AvatarImage';
import { NativeSettingsText } from '@/components/ui/NativeSettings';
import { useAppTheme } from '@/lib/theme';
import { Icon as ComposeIcon } from '@expo/ui/jetpack-compose';
import { Image as SwiftImage } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ANDROID_SETTINGS_ICONS, type SettingsSymbolName } from './nativeSettingsIcons';

type ValueTone = 'accent' | 'muted' | 'danger';

export function SettingsSymbol({
  name,
  tone = 'accent',
}: {
  name: SettingsSymbolName;
  tone?: ValueTone;
}) {
  const theme = useAppTheme();
  const color =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'muted'
        ? theme.colors.textSecondary
        : theme.colors.tint;

  if (Platform.OS === 'ios') {
    return (
      <SwiftImage
        systemName={name}
        size={19}
        color={color}
        modifiers={[frame({ width: 28, height: 28 })]}
      />
    );
  }

  if (Platform.OS === 'android') {
    return <ComposeIcon source={ANDROID_SETTINGS_ICONS[name]} size={19} tint={color} />;
  }

  return (
    <NativeSettingsText
      color={color}
      fontSize={17}
      fontWeight="bold"
      lineHeight={20}
      textAlign="center"
    >
      •
    </NativeSettingsText>
  );
}

export function SettingsTitle({ children }: { children: string }) {
  const theme = useAppTheme();

  return (
    <NativeSettingsText
      color={theme.colors.text}
      fontSize={17}
      fontWeight="regular"
      textStyle="body"
      lineHeight={22}
      maxLines={Platform.OS === 'ios' ? undefined : 1}
    >
      {children}
    </NativeSettingsText>
  );
}

export function SettingsActionTitle({
  children,
  tone = 'danger',
}: {
  children: string;
  tone?: ValueTone;
}) {
  const theme = useAppTheme();
  const color =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'muted'
        ? theme.colors.textSecondary
        : theme.colors.tint;

  return (
    <NativeSettingsText
      color={color}
      fontSize={16}
      fontWeight="medium"
      lineHeight={22}
      maxLines={Platform.OS === 'ios' ? undefined : 1}
    >
      {children}
    </NativeSettingsText>
  );
}

export function SettingsSubtitle({
  primary,
  secondary,
  lines = 1,
}: {
  primary: string;
  secondary?: string;
  lines?: number;
}) {
  const theme = useAppTheme();

  return (
    <>
      <NativeSettingsText
        color={theme.colors.textSecondary}
        fontSize={13}
        textStyle="footnote"
        lineHeight={18}
        maxLines={Platform.OS === 'ios' ? undefined : lines}
      >
        {primary}
      </NativeSettingsText>
      {secondary ? (
        <NativeSettingsText
          color={theme.colors.textTertiary}
          fontSize={13}
          textStyle="footnote"
          lineHeight={17}
          maxLines={Platform.OS === 'ios' ? undefined : 2}
        >
          {secondary}
        </NativeSettingsText>
      ) : null}
    </>
  );
}

export function SettingsValue({ label, tone = 'accent' }: { label: string; tone?: ValueTone }) {
  const theme = useAppTheme();
  const color =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'muted'
        ? theme.colors.textSecondary
        : theme.colors.tint;

  return (
    <NativeSettingsText
      color={color}
      fontSize={14}
      fontWeight="semibold"
      lineHeight={18}
      maxLines={Platform.OS === 'ios' ? undefined : 1}
      textAlign="trailing"
    >
      {label}
    </NativeSettingsText>
  );
}

export function SettingsAvatar({
  avatarUri,
  style,
}: {
  avatarUri?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.avatarShell,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.separator,
        },
        style,
      ]}
    >
      <AvatarImage avatarUri={avatarUri} style={styles.avatarImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatarShell: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
});
