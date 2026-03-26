import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';

import A11yScreen from '@/components/a11y/A11yScreen';
import A11yText from '@/components/a11y/A11yText';
import A11yButton from '@/components/a11y/A11yButton';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';
import { speak } from '@/lib/speech/tts';
import { getHistory, clearHistory, type HistoryEntry } from '@/lib/storage/localHistory';

export default function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const loadHistory = useCallback(async () => {
    const data = await getHistory();
    setEntries(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const handleClearAll = async () => {
    await clearHistory();
    setEntries([]);
    speak('履歴を削除しました。');
  };

  const handleReadEntry = (entry: HistoryEntry) => {
    const text = entry.summary
      ? `${entry.documentType}。${entry.summary}`
      : entry.ocrText.slice(0, 500);
    speak(text);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <View style={styles.card}>
      <View
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`${item.documentType || '書類'}、${formatTime(item.createdAt)}。${item.summary || item.ocrText.slice(0, 100)}`}
      >
        <View style={styles.cardHeader}>
          <A11yText variant="body" style={styles.docType}>
            {item.documentType || '書類'}
          </A11yText>
          <A11yText variant="caption">{formatTime(item.createdAt)}</A11yText>
        </View>
        <A11yText variant="body" style={styles.preview}>
          {item.summary || item.ocrText.slice(0, 100)}
        </A11yText>
      </View>
      <A11yButton
        label="読み上げる"
        hint="この書類の内容を読み上げます"
        variant="secondary"
        onPress={() => handleReadEntry(item)}
      />
    </View>
  );

  return (
    <A11yScreen
      title="読み取り履歴"
      announceOnMount={`読み取り履歴です。${entries.length}件の記録があります。`}
    >
      {entries.length === 0 ? (
        <View style={styles.empty}>
          <A11yText variant="heading" style={styles.emptyIcon}>
            📚
          </A11yText>
          <A11yText variant="title" style={styles.emptyTitle}>
            まだ履歴がありません
          </A11yText>
          <A11yText variant="body" style={styles.emptyDesc}>
            書類を撮影すると、ここに記録が残ります。
          </A11yText>
        </View>
      ) : (
        <>
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
          <A11yButton
            label="すべて削除"
            hint="読み取り履歴をすべて削除します"
            variant="danger"
            onPress={handleClearAll}
          />
        </>
      )}
    </A11yScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: A11Y.SPACING.md,
    paddingBottom: A11Y.SPACING.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.md,
    padding: A11Y.SPACING.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: A11Y.SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docType: {
    color: Colors.primary,
    fontWeight: '700',
  },
  preview: {
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: A11Y.SPACING.md,
  },
  emptyIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyDesc: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});
