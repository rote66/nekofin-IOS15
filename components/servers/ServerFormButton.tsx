import { useAppTheme } from '@/lib/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export type ServerFormButtonProps = {
  title: string;
  disabled?: boolean;
  busy?: boolean;
  color?: string;
  variant?: 'filled' | 'text';
  onPress: () => void;
};
export function ServerFormButton({
  title,
  disabled,
  busy = false,
  color,
  variant = 'filled',
  onPress,
}: ServerFormButtonProps) {
  const theme = useAppTheme();
  const contentColor =
    disabled || busy
      ? theme.colors.textSecondary
      : variant === 'text'
        ? (color ?? theme.colors.tint)
        : theme.colors.inverseText;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variant === 'filled' ? (color ?? theme.colors.tint) : 'transparent',
          opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {busy ? <ActivityIndicator size="small" color={contentColor} /> : null}
        <Text style={{ color: contentColor, fontSize: 16, fontWeight: '600' }}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
