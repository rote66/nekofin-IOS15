import { composeSemantics } from '@/components/ui/composeCompatModifiers.android';
import { useAppTheme } from '@/lib/theme';
import { CircularProgressIndicator } from '@expo/ui/jetpack-compose';
import { size } from '@expo/ui/jetpack-compose/modifiers';

import { HeaderIconButton } from './HeaderIconButton.android';

export function HeaderActionProgress({ label }: { label: string }) {
  const theme = useAppTheme();
  return (
    <HeaderIconButton enabled={false}>
      <CircularProgressIndicator
        color={theme.colors.tint}
        modifiers={[size(20, 20), composeSemantics(label)]}
      />
    </HeaderIconButton>
  );
}
