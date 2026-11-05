import { useTranslation } from '@/lib/i18n';
import { useAppTheme } from '@/lib/theme';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePlayerPanelPresentation, type PlayerPanelHostProps } from './playerPanelPresentation';

export type { PlayerPanelHostProps } from './playerPanelPresentation';

/** Web fallback; iOS and Android use their native sheet implementations. */
export function PlayerPanelHost(props: PlayerPanelHostProps) {
  const { t: tr } = useTranslation();
  const { visible, onDismiss, testID = 'player-panel-host' } = props;
  const theme = useAppTheme();
  const panel = usePlayerPanelPresentation(props);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View testID={testID} style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onDismiss} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.backgroundGrouped }]}>
          <View style={styles.header}>
            {panel.onBack ? (
              <Pressable onPress={panel.onBack} hitSlop={8}>
                <Text style={{ color: theme.colors.tint }}>{tr('common.back')}</Text>
              </Pressable>
            ) : null}
            <Text style={[styles.title, { color: theme.colors.text }]}>{panel.title}</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={onDismiss} hitSlop={8}>
              <Text style={{ color: theme.colors.tint }}>{tr('common.close')}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>{panel.children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  sheet: { height: '92%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  header: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingBottom: 28 },
});
