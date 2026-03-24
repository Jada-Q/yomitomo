import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import A11yScreen from '@/components/a11y/A11yScreen';
import A11yText from '@/components/a11y/A11yText';
import A11yButton from '@/components/a11y/A11yButton';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { speak } from '@/lib/speech/tts';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

export default function HistoryScreen() {
  const router = useRouter();
  const { documents, setCurrentResult } = useDocumentStore();

  const handleSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const doc = documents[index];
    setCurrentResult(doc.result);
    speak(doc.result.summary);
    router.push('/read/result');
  };

  if (documents.length === 0) {
    return (
      <A11yScreen
        title="読み取り履歴"
        announceOnMount="履歴はまだありません。書類を読み取ると、ここに保存されます。"
      >
        <View style={styles.emptyContainer}>
          <A11yText variant="title" style={styles.emptyIcon}>
            📋
          </A11yText>
          <A11yText variant="body" style={styles.emptyText}>
            まだ履歴がありません
          </A11yText>
          <A11yText variant="caption" style={styles.emptySubtext}>
            書類を読み取ると、ここに保存されます
          </A11yText>
          <A11yButton
            label="書類を読み取る"
            onPress={() => router.push('/read/camera')}
            style={styles.emptyButton}
          />
        </View>
      </A11yScreen>
    );
  }

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <A11yScreen
      title="読み取り履歴"
      announceOnMount={`${documents.length}件の履歴があります`}
    >
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <Pressable
            accessible={true}
            accessibilityLabel={`${item.result.documentType}。${item.result.summary}`}
            accessibilityHint="タップすると詳細を表示します"
            accessibilityRole="button"
            onPress={() => handleSelect(index)}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardHeader}>
              <A11yText variant="body" style={styles.cardType}>
                {item.result.documentType}
              </A11yText>
              <A11yText variant="caption">
                {formatDate(item.createdAt)}
              </A11yText>
            </View>
            <A11yText variant="caption" style={styles.cardSummary}>
              {item.result.summary.slice(0, 80)}
              {item.result.summary.length > 80 ? '...' : ''}
            </A11yText>
            {item.result.sender && (
              <A11yText variant="caption" style={styles.cardSender}>
                {item.result.sender}
              </A11yText>
            )}
          </Pressable>
        )}
      />
    </A11yScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: A11Y.SPACING.sm,
    paddingBottom: A11Y.SPACING.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.md,
    padding: A11Y.SPACING.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: A11Y.SPACING.xs,
  },
  cardPressed: {
    opacity: 0.7,
    borderColor: Colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    color: Colors.primary,
    fontWeight: '700',
  },
  cardSummary: {
    lineHeight: 20,
  },
  cardSender: {
    color: Colors.textSecondary,
    marginTop: A11Y.SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: A11Y.SPACING.md,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyText: {
    color: Colors.textSecondary,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: A11Y.SPACING.lg,
  },
});
