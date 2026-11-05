import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react';

import type { NativeSettingsTextFieldRef } from './NativeSettings';

/**
 * SDK 55 SwiftUI/Compose TextField only accepts defaultValue. Mirror external
 * resets with setText, but never setText again for the user's own keystrokes:
 * that would reset selection and disrupt keyboard composition.
 */
export function useNativeTextFieldBridge({
  value,
  defaultValue,
  onChangeText,
  forwardedRef,
}: {
  value?: string;
  defaultValue?: string;
  onChangeText?: (next: string) => void;
  forwardedRef?: Ref<NativeSettingsTextFieldRef>;
}) {
  const nativeRef = useRef<NativeSettingsTextFieldRef>(null);
  const initialValue = useRef(value ?? defaultValue ?? '').current;
  const lastNativeValue = useRef(initialValue);

  useEffect(() => {
    if (value === undefined || value === lastNativeValue.current) return;
    lastNativeValue.current = value;
    void nativeRef.current?.setText(value).catch(() => {
      // A field can unmount during a navigation transition.
    });
  }, [value]);

  const onNativeValueChange = useCallback(
    (next: string) => {
      lastNativeValue.current = next;
      onChangeText?.(next);
    },
    [onChangeText],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      async setText(next: string) {
        lastNativeValue.current = next;
        await nativeRef.current?.setText(next);
      },
      async focus() {
        await nativeRef.current?.focus();
      },
      async blur() {
        await nativeRef.current?.blur();
      },
    }),
    [],
  );

  return { initialValue, nativeRef, onNativeValueChange };
}
