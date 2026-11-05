import {
  NativeSettingsForm,
  NativeSettingsItem,
  NativeSettingsSection,
} from '@/components/ui/NativeSettings';
import { useTranslation } from '@/lib/i18n';
import { MEDIA_SERVER_TYPE_OPTIONS } from '@/lib/mediaServerTypes';
import type { MediaServerType } from '@/services/media/types';

import { ServerTypeIcon } from './ServerTypeIcon';

export function ServerTypePicker({ onSelect }: { onSelect: (type: MediaServerType) => void }) {
  const { t: tr } = useTranslation();
  return (
    <NativeSettingsForm testID="server-type-picker">
      <NativeSettingsSection title={tr('server.addFirstServer')}>
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
      </NativeSettingsSection>
    </NativeSettingsForm>
  );
}
