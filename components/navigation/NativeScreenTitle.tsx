import {
  TabletChromeContext,
  TabletHeaderTitle,
} from '@/components/navigation/TabletChromeContext';
import { useAppTheme } from '@/lib/theme';
import { Stack } from 'expo-router';
import { useContext } from 'react';
import { Platform } from 'react-native';

export const nativeScreenTitleOptions = {
  headerLargeTitle: Platform.OS === 'ios' && !Platform.isPad,
} as const;

/** One native title policy for pages, including loading and empty list states. */
export function NativeScreenTitle({
  children,
  large = true,
}: {
  children: string;
  large?: boolean;
}) {
  const theme = useAppTheme();
  const chrome = useContext(TabletChromeContext);
  if (Platform.OS === 'android' && chrome) {
    return (
      <Stack.Screen
        options={{
          title: children,
          headerTitle: () => (
            <TabletHeaderTitle tintColor={theme.colors.text}>{children}</TabletHeaderTitle>
          ),
        }}
      />
    );
  }
  return (
    <Stack.Screen.Title
      large={large && nativeScreenTitleOptions.headerLargeTitle}
      style={{ color: theme.colors.text }}
      largeStyle={{ color: theme.colors.text }}
    >
      {children}
    </Stack.Screen.Title>
  );
}
