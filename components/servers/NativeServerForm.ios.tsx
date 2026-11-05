import { usesLegacyIOSServerForm } from '@/lib/compat/ios15';
import { Platform } from 'react-native';

import {
  NativeServerForm as ReactNativeServerForm,
  type NativeServerFormProps,
} from './NativeServerFormRN';
import { NativeServerForm as SwiftUIServerForm } from './NativeServerFormSwiftUI';

export type { NativeServerFormProps, ServerFormValues } from './NativeServerFormRN';

export function NativeServerForm(props: NativeServerFormProps) {
  if (usesLegacyIOSServerForm(Platform.OS, Platform.Version)) {
    return <ReactNativeServerForm {...props} />;
  }

  return <SwiftUIServerForm {...props} />;
}
