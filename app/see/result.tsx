import { useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import A11yScreen from '@/components/a11y/A11yScreen';
import A11yButton from '@/components/a11y/A11yButton';
import A11yText from '@/components/a11y/A11yText';
import { useSceneStore } from '@/stores/useSceneStore';
import { speak, stop } from '@/lib/speech/tts';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

export default function SceneResultScreen() {
  const router = useRouter();
  const { currentScene, isLoading } = useSceneStore();

  useEffect(() => {
    if (currentScene && !currentScene.error) {
      speak(currentScene.summary);
    }
    return () => stop();
  }, [currentScene]);

  if (isLoading) {
    return (
      <A11yScreen title="分析中..." announceOnMount="周囲を分析中です。お待ちください。">
        <View style={styles.loadingContainer}>
          <A11yText variant="title" style={styles.loadingText}>
            👁 分析中...
          </A11yText>
          <A11yText variant="body" style={styles.loadingSubtext}>
            AIが周囲の状況を分析しています
          </A11yText>
        </View>
      </A11yScreen>
    );
  }

  if (!currentScene) {
    return (
      <A11yScreen title="エラー">
        <A11yText>分析結果がありません。</A11yText>
        <A11yButton label="戻る" onPress={() => router.back()} style={styles.backButton} />
      </A11yScreen>
    );
  }

  return (
    <A11yScreen title="周囲の説明">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Location Type */}
        <View style={styles.card}>
          <A11yText variant="caption">場所</A11yText>
          <A11yText variant="title">{currentScene.locationType}</A11yText>
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <A11yText variant="caption">状況説明</A11yText>
          <A11yText variant="body" announce={true}>
            {currentScene.summary}
          </A11yText>
        </View>

        {/* Hazards — show prominently */}
        {currentScene.hazards.length > 0 && (
          <View style={[styles.card, styles.hazardCard]}>
            <A11yText variant="caption" style={styles.hazardLabel}>
              ⚠ 注意事項
            </A11yText>
            {currentScene.hazards.map((h, i) => (
              <A11yText key={i} variant="body" style={styles.hazardItem}>
                {h}
              </A11yText>
            ))}
          </View>
        )}

        {/* Objects */}
        {currentScene.objects.length > 0 && (
          <View style={styles.card}>
            <A11yText variant="caption">周囲にあるもの</A11yText>
            {currentScene.objects.map((obj, i) => (
              <A11yText key={i} variant="body" style={styles.listItem}>
                • {obj}
              </A11yText>
            ))}
          </View>
        )}

        {/* Readable Text */}
        {currentScene.readableText.length > 0 && (
          <View style={styles.card}>
            <A11yText variant="caption">読める文字</A11yText>
            {currentScene.readableText.map((txt, i) => (
              <A11yText key={i} variant="body" style={styles.listItem}>
                「{txt}」
              </A11yText>
            ))}
          </View>
        )}

        {/* People Density */}
        <View style={styles.card}>
          <A11yText variant="caption">混雑度</A11yText>
          <A11yText variant="body">{currentScene.peopleDensity}</A11yText>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <A11yButton
          label="もう一度読み上げる"
          hint="周囲の説明をもう一度音声で読み上げます"
          variant="secondary"
          onPress={() => speak(currentScene.summary)}
        />
        <A11yButton
          label="もう一度撮影する"
          hint="カメラに戻って周囲を撮影します"
          onPress={() => router.replace('/see/camera')}
          style={styles.retakeButton}
        />
      </View>
    </A11yScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
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
  hazardCard: {
    borderColor: Colors.danger,
    borderWidth: A11Y.BORDER_WIDTH,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  hazardLabel: {
    color: Colors.danger,
    fontWeight: '700',
  },
  hazardItem: {
    color: Colors.danger,
    marginTop: A11Y.SPACING.xs,
  },
  listItem: {
    marginTop: A11Y.SPACING.xs,
  },
  actions: {
    gap: A11Y.SPACING.sm,
    paddingVertical: A11Y.SPACING.lg,
  },
  retakeButton: {
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
  loadingText: { textAlign: 'center' },
  loadingSubtext: { textAlign: 'center', color: Colors.textSecondary },
});
