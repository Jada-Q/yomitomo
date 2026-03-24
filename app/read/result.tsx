import { useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import A11yScreen from '@/components/a11y/A11yScreen';
import A11yButton from '@/components/a11y/A11yButton';
import A11yText from '@/components/a11y/A11yText';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { speak, stop } from '@/lib/speech/tts';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

export default function DocumentResultScreen() {
  const router = useRouter();
  const { currentResult, isLoading } = useDocumentStore();
  const { speechRate } = useSettingsStore();

  useEffect(() => {
    if (currentResult && !currentResult.error) {
      speak(currentResult.summary, { rate: speechRate });
    }
    return () => stop();
  }, [currentResult, speechRate]);

  if (isLoading) {
    return (
      <A11yScreen title="読み取り中...">
        <LoadingOverlay visible={true} message="書類を読み取り中..." />
      </A11yScreen>
    );
  }

  if (!currentResult) {
    return (
      <A11yScreen title="エラー">
        <A11yText>読み取り結果がありません。</A11yText>
        <A11yButton
          label="戻る"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </A11yScreen>
    );
  }

  return (
    <A11yScreen title="読み取り結果">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        accessible={true}
        accessibilityLabel="読み取り結果の詳細"
      >
        {/* Document Type */}
        <View style={styles.card}>
          <A11yText variant="caption">書類の種類</A11yText>
          <A11yText variant="title">{currentResult.documentType}</A11yText>
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <A11yText variant="caption">要約</A11yText>
          <A11yText variant="body" announce={true}>
            {currentResult.summary}
          </A11yText>
        </View>

        {/* Key Info */}
        {currentResult.keyInfo.length > 0 && (
          <View style={styles.card}>
            <A11yText variant="caption">重要な情報</A11yText>
            {currentResult.keyInfo.map((info, index) => (
              <A11yText key={index} variant="body" style={styles.keyInfoItem}>
                • {info}
              </A11yText>
            ))}
          </View>
        )}

        {/* Action Needed */}
        {currentResult.actionNeeded && (
          <View style={[styles.card, styles.actionCard]}>
            <A11yText variant="caption" style={styles.actionLabel}>
              必要なアクション
            </A11yText>
            <A11yText variant="body" style={styles.actionText}>
              {currentResult.actionNeeded}
            </A11yText>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <A11yButton
          label="もう一度読み上げる"
          hint="読み取り結果をもう一度音声で読み上げます"
          variant="secondary"
          onPress={() => speak(currentResult.summary)}
        />
        <A11yButton
          label="新しい書類を読む"
          hint="カメラに戻って別の書類を撮影します"
          onPress={() => router.replace('/read/camera')}
          style={styles.newButton}
        />
      </View>
    </A11yScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: A11Y.SPACING.md,
    paddingBottom: A11Y.SPACING.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.md,
    padding: A11Y.SPACING.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: A11Y.SPACING.xs,
  },
  actionCard: {
    borderColor: Colors.primary,
    borderWidth: A11Y.BORDER_WIDTH,
  },
  actionLabel: {
    color: Colors.primary,
  },
  actionText: {
    fontWeight: '600',
  },
  keyInfoItem: {
    marginTop: A11Y.SPACING.xs,
  },
  actions: {
    gap: A11Y.SPACING.sm,
    paddingVertical: A11Y.SPACING.lg,
  },
  newButton: {
    marginTop: A11Y.SPACING.xs,
  },
  backButton: {
    marginTop: A11Y.SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: A11Y.SPACING.md,
  },
  loadingText: {
    textAlign: 'center',
  },
  loadingSubtext: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});
