import { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';

import A11yScreen from '@/components/a11y/A11yScreen';
import A11yText from '@/components/a11y/A11yText';
import A11yButton from '@/components/a11y/A11yButton';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';
import { speak } from '@/lib/speech/tts';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useModelStore } from '@/stores/useModelStore';
import {
  getModelStatus,
  downloadModel,
  deleteModel,
  getModelSizeLabel,
} from '@/lib/llm/modelManager';
import { initLlm, releaseLlm } from '@/lib/llm/localLlm';

const SPEED_OPTIONS = [
  { label: 'ゆっくり', value: 0.6 },
  { label: 'ふつう', value: 0.9 },
  { label: '速い', value: 1.2 },
];

export default function SettingsScreen() {
  const { speechRate, setSpeechRate } = useSettingsStore();
  const {
    status,
    downloadProgress,
    isLoaded,
    variant,
    setStatus,
    setDownloadProgress,
    setIsLoaded,
  } = useModelStore();

  // Check model status on mount
  useEffect(() => {
    if (Platform.OS !== 'web') {
      getModelStatus(variant).then(setStatus);
    }
  }, [variant]);

  const handleSpeedChange = (value: number, label: string) => {
    setSpeechRate(value);
    speak(`読み上げ速度を${label}に変更しました。`, { rate: value });
  };

  const handleDownloadModel = async () => {
    setStatus('downloading');
    setDownloadProgress(0);
    speak('モデルのダウンロードを開始します。しばらくお待ちください。');

    const result = await downloadModel(variant, (progress) => {
      setDownloadProgress(progress);
    });

    if (result.success) {
      setStatus('ready');
      speak('ダウンロードが完了しました。AI要約機能が使えるようになりました。');

      // Auto-load model
      const loaded = await initLlm(variant);
      setIsLoaded(loaded);
    } else {
      setStatus('not_downloaded');
      speak(`ダウンロードに失敗しました。${result.error || ''}`);
    }
  };

  const handleDeleteModel = async () => {
    await releaseLlm();
    await deleteModel(variant);
    setIsLoaded(false);
    setStatus('not_downloaded');
    speak('モデルを削除しました。');
  };

  const handleLoadModel = async () => {
    speak('モデルを読み込んでいます。');
    const loaded = await initLlm(variant);
    setIsLoaded(loaded);
    if (loaded) {
      speak('モデルの読み込みが完了しました。');
    } else {
      speak('モデルの読み込みに失敗しました。');
    }
  };

  const currentSpeedLabel =
    SPEED_OPTIONS.find((o) => o.value === speechRate)?.label ?? 'ふつう';

  return (
    <A11yScreen
      title="設定"
      announceOnMount={`設定画面です。現在の読み上げ速度は${currentSpeedLabel}です。`}
    >
      <View style={styles.content}>
        {/* Speech Rate */}
        <View style={styles.section}>
          <A11yText variant="body" style={styles.sectionTitle}>
            読み上げ速度
          </A11yText>
          <A11yText variant="caption" style={styles.sectionDesc}>
            現在：{currentSpeedLabel}
          </A11yText>
          <View style={styles.speedButtons}>
            {SPEED_OPTIONS.map((option) => (
              <A11yButton
                key={option.value}
                label={option.label}
                hint={`読み上げ速度を${option.label}に変更します`}
                variant={speechRate === option.value ? 'primary' : 'secondary'}
                onPress={() => handleSpeedChange(option.value, option.label)}
                style={styles.speedButton}
              />
            ))}
          </View>
        </View>

        {/* AI Model */}
        {Platform.OS !== 'web' && (
          <View style={styles.section}>
            <A11yText variant="body" style={styles.sectionTitle}>
              AI 要約モデル
            </A11yText>
            <A11yText variant="caption" style={styles.sectionDesc}>
              書類の内容をAIが要約します（オプション）
            </A11yText>

            <View style={styles.modelCard}>
              <A11yText variant="body" style={styles.modelName}>
                Qwen 2.5 — {getModelSizeLabel(variant)}
              </A11yText>

              {status === 'not_downloaded' && (
                <>
                  <A11yText variant="caption">
                    Wi-Fi環境でのダウンロードをおすすめします
                  </A11yText>
                  <A11yButton
                    label={`モデルをダウンロード（${getModelSizeLabel(variant)}）`}
                    hint="AI要約モデルをダウンロードします"
                    onPress={handleDownloadModel}
                  />
                </>
              )}

              {status === 'downloading' && (
                <>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.round(downloadProgress * 100)}%` },
                      ]}
                    />
                  </View>
                  <A11yText variant="caption">
                    ダウンロード中：{Math.round(downloadProgress * 100)}%
                  </A11yText>
                </>
              )}

              {status === 'ready' && (
                <>
                  <A11yText variant="caption" style={styles.readyText}>
                    {isLoaded ? '✅ 読み込み済み・使用可能' : '📦 ダウンロード済み'}
                  </A11yText>
                  {!isLoaded && (
                    <A11yButton
                      label="モデルを読み込む"
                      hint="AI要約モデルをメモリに読み込みます"
                      onPress={handleLoadModel}
                    />
                  )}
                  <A11yButton
                    label="モデルを削除"
                    hint="ダウンロードしたモデルを削除してストレージを解放します"
                    variant="danger"
                    onPress={handleDeleteModel}
                  />
                </>
              )}
            </View>
          </View>
        )}

        {/* Test Speech */}
        <A11yButton
          label="読み上げテスト"
          hint="現在の設定で読み上げをテストします"
          variant="secondary"
          onPress={() =>
            speak(
              'これは読み上げのテストです。読み友をご利用いただきありがとうございます。',
              { rate: speechRate },
            )
          }
        />

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <A11yText variant="body" style={styles.appName}>
              読み友 Yomitomo
            </A11yText>
            <A11yText variant="caption">Version 2.0.0</A11yText>
            <A11yText variant="caption" style={styles.appDesc}>
              視覚障害者のための無料オフライン文書リーダー。{'\n'}
              日本語・中国語・英語に対応。
            </A11yText>
          </View>
        </View>
      </View>
    </A11yScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: A11Y.SPACING.xl,
  },
  section: {
    gap: A11Y.SPACING.sm,
  },
  sectionTitle: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 20,
  },
  sectionDesc: {
    marginBottom: A11Y.SPACING.xs,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: A11Y.SPACING.sm,
  },
  speedButton: {
    flex: 1,
  },
  modelCard: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.md,
    padding: A11Y.SPACING.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: A11Y.SPACING.md,
  },
  modelName: {
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  readyText: {
    color: Colors.success,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.md,
    padding: A11Y.SPACING.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: A11Y.SPACING.xs,
  },
  appName: {
    fontWeight: '700',
    fontSize: 20,
  },
  appDesc: {
    marginTop: A11Y.SPACING.sm,
    lineHeight: 22,
  },
});
