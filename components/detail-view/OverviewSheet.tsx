import { useTranslation } from '@/lib/i18n';
import { spacing, useAppTheme } from '@/lib/theme';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function OverviewContent({
  overview,
  onDismiss,
  isPresented,
}: {
  overview: string;
  onDismiss: () => void;
  isPresented: boolean;
}) {
  const { t: tr } = useTranslation();
  const theme = useAppTheme();

  return (
    <Modal visible={isPresented} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onDismiss} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.backgroundGrouped }]}>
          <View style={styles.header}>
            <Text style={[styles.heading, { color: theme.colors.text }]}>
              {tr('media.overview')}
            </Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={onDismiss} hitSlop={8}>
              <Text style={{ color: theme.colors.tint }}>{tr('common.done')}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={[styles.overview, { color: theme.colors.text }]}>{overview}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function OverviewSheet({
  overview,
  isPresented,
  onDismiss,
}: {
  overview: string;
  isPresented: boolean;
  onDismiss: () => void;
}) {
  return (
    <OverviewContent
      key={overview}
      overview={overview}
      onDismiss={onDismiss}
      isPresented={isPresented}
    />
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  sheet: {
    maxHeight: '75%',
    minHeight: 260,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    minHeight: 56,
    paddingHorizontal: spacing.page,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heading: { fontSize: 20, fontWeight: '600' },
  body: { paddingHorizontal: spacing.page, paddingBottom: spacing.page },
  overview: { fontSize: 17, lineHeight: 24 },
});
