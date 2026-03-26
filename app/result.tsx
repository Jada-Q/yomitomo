import { useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

import A11yScreen from '@/components/a11y/A11yScreen';
import A11yText from '@/components/a11y/A11yText';
import A11yButton from '@/components/a11y/A11yButton';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';
import { speak, stop } from '@/lib/speech/tts';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function ResultScreen() {
  const router = useRouter();
  const { ocrText, detectedLanguage, summary, isSummarizing } = useDocumentStore();
  const { speechRate } = useSettingsStore();

  // Auto-read OCR text on mount
  useEffect(() => {
    if (ocrText) {
      stop();
      speak(ocrText, { rate: speechRate });
    }
  }, []);

  // Debug: log summary state
  useEffect(() => {
    console.log('[Result] summary updated:', summary ? JSON.stringify(summary).slice(0, 200) : 'null');
  }, [summary]);

  // Auto-read summary when it arrives + announce for VoiceOver
  useEffect(() => {
    if (summary) {
      const summaryText = buildSummaryText(summary);
      stop();
      speak(summaryText, { rate: speechRate });
      AccessibilityInfo.announceForAccessibility(
        'AI解説が完了しました。' + summaryText,
      );
    }
  }, [summary]);

  const handleReadOcr = () => {
    try {
      console.log('[Result] handleReadOcr pressed, ocrText length:', ocrText?.length);
      stop();
      console.log('[Result] stop() ok, calling speak()');
      speak(ocrText, { rate: speechRate });
      console.log('[Result] speak() called ok');
    } catch (e) {
      console.error('[Result] handleReadOcr ERROR:', e);
    }
  };

  const handleReadSummary = () => {
    try {
      console.log('[Result] handleReadSummary pressed, summary:', !!summary);
      if (!summary) return;
      const text = buildSummaryText(summary);
      console.log('[Result] buildSummaryText ok, length:', text.length);
      stop();
      console.log('[Result] stop() ok, calling speak()');
      speak(text, { rate: speechRate });
      console.log('[Result] speak() called ok');
    } catch (e) {
      console.error('[Result] handleReadSummary ERROR:', e);
    }
  };

  const languageLabel =
    detectedLanguage === 'ja'
      ? '日本語'
      : detectedLanguage === 'zh'
        ? '中国語'
        : detectedLanguage === 'en'
          ? '英語'
          : '不明';

  return (
    <A11yScreen
      title="読み取り結果"
      announceOnMount="読み取り結果です。テキストを読み上げています。"
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Language badge */}
        <View
          style={styles.langBadge}
          accessible={true}
          accessibilityLabel={`検出言語：${languageLabel}`}
          accessibilityRole="text"
        >
          <A11yText variant="caption">検出言語：{languageLabel}</A11yText>
        </View>

        {/* AI Summary (if available) */}
        {summary && (
          <View
            style={styles.summaryCard}
            accessible={true}
            accessibilityLabel={`AI解説：${buildSummaryText(summary)}`}
            accessibilityRole="summary"
            {...(Platform.OS === 'android' && { accessibilityLiveRegion: 'polite' as const })}
          >
            <A11yText variant="body" style={styles.cardLabel}>
              AI 解説
            </A11yText>
            <A11yText variant="title" style={styles.docType}>
              {summary.documentType}
            </A11yText>
            {summary.sender !== '不明' && (
              <A11yText variant="body" style={styles.sender}>
                差出人：{summary.sender}
              </A11yText>
            )}
            <A11yText variant="body" style={styles.summaryText}>
              {summary.summary}
            </A11yText>

            {summary.keyInfo.length > 0 && (
              <View style={styles.keyInfoSection}>
                <A11yText variant="body" style={styles.keyInfoTitle}>
                  重要ポイント
                </A11yText>
                {summary.keyInfo.map((info, i) => (
                  <View key={i} style={styles.keyInfoItem}>
                    <A11yText variant="body" style={styles.bullet}>
                      •
                    </A11yText>
                    <A11yText variant="body" style={styles.keyInfoText}>
                      {info}
                    </A11yText>
                  </View>
                ))}
              </View>
            )}

            {summary.deadline && (
              <View style={styles.deadlineRow}>
                <A11yText variant="body" style={styles.deadlineLabel}>
                  期限
                </A11yText>
                <A11yText variant="body" style={styles.deadlineValue}>
                  {summary.deadline}
                </A11yText>
              </View>
            )}

            {summary.actionNeeded && (
              <View
                style={styles.actionCard}
                accessible={true}
                accessibilityLabel={`必要なアクション：${summary.actionNeeded}`}
                accessibilityRole="alert"
              >
                <A11yText variant="body" style={styles.actionLabel}>
                  必要なアクション
                </A11yText>
                <A11yText variant="body" style={styles.actionText}>
                  {summary.actionNeeded}
                </A11yText>
              </View>
            )}

            {summary.translation && (
              <View style={styles.translationCard}>
                <A11yText variant="body" style={styles.translationLabel}>
                  English / 中文
                </A11yText>
                <A11yText variant="body" style={styles.translationText}>
                  {summary.translation}
                </A11yText>
              </View>
            )}
          </View>
        )}

        {/* Summarizing indicator */}
        {isSummarizing && (
          <View
            style={styles.summarizingCard}
            accessible={true}
            accessibilityLabel="AI が書類を解析中です。しばらくお待ちください。"
            accessibilityRole="progressbar"
            {...(Platform.OS === 'android' && { accessibilityLiveRegion: 'polite' as const })}
          >
            <A11yText variant="body" style={styles.summarizingText}>
              AI が書類を解析中...
            </A11yText>
          </View>
        )}

        {/* OCR Raw Text */}
        <View
          style={styles.ocrCard}
          accessible={true}
          accessibilityLabel={`読み取ったテキスト：${ocrText || 'テキストが検出されませんでした。'}`}
          accessibilityRole="text"
        >
          <A11yText variant="body" style={styles.cardLabel}>
            読み取ったテキスト
          </A11yText>
          <A11yText variant="body" style={styles.ocrText}>
            {ocrText || 'テキストが検出されませんでした。'}
          </A11yText>
        </View>

        {/* Action buttons */}
        <View style={styles.buttons}>
          <A11yButton
            label="原文を読み上げる"
            hint="OCRで読み取った原文を読み上げます"
            variant="secondary"
            onPress={handleReadOcr}
          />
          {summary && (
            <A11yButton
              label="解説を読み上げる"
              hint="AIの解説を読み上げます"
              onPress={handleReadSummary}
            />
          )}
          <A11yButton
            label="新しい書類を撮影"
            hint="カメラに戻って新しい書類を撮影します"
            variant="primary"
            onPress={() => {
              stop();
              router.back();
            }}
            icon="📷"
          />
        </View>
      </ScrollView>
    </A11yScreen>
  );
}

function buildSummaryText(summary: {
  documentType: string;
  sender: string;
  summary: string;
  keyInfo: string[];
  actionNeeded: string | null;
  deadline: string | null;
  translation: string | null;
}): string {
  let text = `${summary.documentType}。${summary.summary}`;
  if (summary.keyInfo.length > 0) {
    text += `。重要ポイント：${summary.keyInfo.join('。')}`;
  }
  if (summary.deadline) {
    text += `。期限：${summary.deadline}`;
  }
  if (summary.actionNeeded) {
    text += `。必要なアクション：${summary.actionNeeded}`;
  }
  return text;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  langBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    paddingHorizontal: A11Y.SPACING.md,
    paddingVertical: A11Y.SPACING.xs,
    borderRadius: A11Y.RADIUS.sm,
    marginBottom: A11Y.SPACING.md,
  },
  // Summary card
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.md,
    padding: A11Y.SPACING.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: A11Y.SPACING.md,
    gap: A11Y.SPACING.sm,
  },
  cardLabel: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  docType: {
    color: Colors.text,
  },
  sender: {
    color: Colors.textSecondary,
  },
  summaryText: {
    lineHeight: 28,
  },
  keyInfoSection: {
    marginTop: A11Y.SPACING.sm,
    gap: A11Y.SPACING.xs,
  },
  keyInfoTitle: {
    color: Colors.primary,
    fontWeight: '700',
  },
  keyInfoItem: {
    flexDirection: 'row',
    gap: A11Y.SPACING.sm,
  },
  bullet: {
    color: Colors.primary,
  },
  keyInfoText: {
    flex: 1,
    lineHeight: 26,
  },
  actionCard: {
    backgroundColor: Colors.background,
    borderRadius: A11Y.RADIUS.sm,
    padding: A11Y.SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    gap: A11Y.SPACING.xs,
  },
  actionLabel: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  actionText: {
    lineHeight: 26,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: A11Y.SPACING.sm,
    backgroundColor: Colors.background,
    borderRadius: A11Y.RADIUS.sm,
    padding: A11Y.SPACING.md,
  },
  deadlineLabel: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  deadlineValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  translationCard: {
    backgroundColor: Colors.background,
    borderRadius: A11Y.RADIUS.sm,
    padding: A11Y.SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    gap: A11Y.SPACING.xs,
  },
  translationLabel: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  translationText: {
    lineHeight: 26,
    color: Colors.textSecondary,
  },
  // Summarizing
  summarizingCard: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.md,
    padding: A11Y.SPACING.lg,
    marginBottom: A11Y.SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  summarizingText: {
    color: Colors.textSecondary,
  },
  // OCR card
  ocrCard: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.md,
    padding: A11Y.SPACING.lg,
    marginBottom: A11Y.SPACING.xl,
    gap: A11Y.SPACING.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  ocrText: {
    lineHeight: 28,
    color: Colors.textSecondary,
  },
  // Buttons
  buttons: {
    gap: A11Y.SPACING.md,
    paddingBottom: A11Y.SPACING.xxl,
  },
});
