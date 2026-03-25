import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import A11yButton from '@/components/a11y/A11yButton';
import A11yText from '@/components/a11y/A11yText';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';
import { speak, stop } from '@/lib/speech/tts';
import { recognizeText } from '@/lib/ocr/mlkitOcr';
import { summarizeDocument, isLlmReady } from '@/lib/llm/localLlm';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { useModelStore } from '@/stores/useModelStore';
import { addToHistory } from '@/lib/storage/localHistory';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const {
    isCapturing,
    setIsCapturing,
    setOcrResult,
    setSummary,
    setIsSummarizing,
    clear,
  } = useDocumentStore();
  const { isLoaded: isModelLoaded } = useModelStore();

  // Announce on first mount
  useEffect(() => {
    clear();
    const timer = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(
        'カメラ画面です。書類を撮影するには、画面下の撮影ボタンを押してください。',
      );
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    stop();

    try {
      let imageUri: string;

      if (Platform.OS === 'web') {
        // Web demo: use mock OCR
        speak('デモモードです。サンプルテキストを読み上げます。');
        setOcrResult(
          '東京電力エナジーパートナー ご請求書\nご請求金額 4,320円\nお支払期限 2026年3月30日',
          'ja',
        );
        setIsCapturing(false);
        router.push('/result');
        return;
      }

      // Capture photo
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      speak('撮影しました。読み取り中です。');

      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) {
        speak('撮影に失敗しました。もう一度お試しください。');
        setIsCapturing(false);
        return;
      }

      imageUri = photo.uri;

      // Layer 1: OCR (instant)
      const ocrResult = await recognizeText(imageUri);

      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
        speak('テキストが検出されませんでした。書類をもう少し近づけて、もう一度お試しください。');
        setIsCapturing(false);
        return;
      }

      setOcrResult(ocrResult.text, ocrResult.detectedLanguage);
      setIsCapturing(false);
      router.push('/result');

      // Layer 2: LLM summary (background, if model loaded)
      if (isLlmReady()) {
        setIsSummarizing(true);
        const lang = ocrResult.detectedLanguage === 'unknown' ? 'ja' : ocrResult.detectedLanguage;
        const summary = await summarizeDocument(ocrResult.text, lang);
        setSummary(summary);

        // Save to history
        if (summary) {
          addToHistory({
            id: Date.now().toString(),
            ocrText: ocrResult.text,
            summary: summary.summary,
            documentType: summary.documentType,
            detectedLanguage: ocrResult.detectedLanguage,
            createdAt: Date.now(),
          });
        }
      } else {
        // Save OCR-only to history
        addToHistory({
          id: Date.now().toString(),
          ocrText: ocrResult.text,
          summary: null,
          documentType: null,
          detectedLanguage: ocrResult.detectedLanguage,
          createdAt: Date.now(),
        });
      }
    } catch (e) {
      console.error('Capture error:', e);
      speak('エラーが発生しました。もう一度お試しください。');
      setIsCapturing(false);
    }
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <A11yText variant="body">カメラの権限を確認中...</A11yText>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <A11yText variant="title" style={styles.permissionTitle}>
            カメラの許可が必要です
          </A11yText>
          <A11yText variant="body" style={styles.permissionDesc}>
            書類を撮影してテキストを読み上げるために、カメラへのアクセスを許可してください。
          </A11yText>
          <A11yButton
            label="カメラを許可する"
            hint="カメラの使用許可を求めます"
            onPress={requestPermission}
            size="big"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Web fallback (no real camera)
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <A11yText variant="title" style={styles.title}>
            読み友
          </A11yText>
        </View>
        <View style={styles.demoContainer}>
          <A11yText variant="heading" style={styles.demoIcon}>
            📄
          </A11yText>
          <A11yText variant="body" style={styles.demoText}>
            デモモード
          </A11yText>
          <A11yText variant="caption" style={styles.demoSub}>
            実機ではカメラで書類を撮影できます
          </A11yText>
        </View>
        <View style={styles.controls}>
          <A11yButton
            label="サンプル書類を読み取る"
            hint="デモ用のサンプル書類を読み取ります"
            onPress={handleCapture}
            size="big"
            icon="📷"
          />
          <View style={styles.secondaryButtons}>
            <A11yButton
              label="履歴"
              hint="過去の読み取り結果を表示します"
              variant="secondary"
              onPress={() => router.push('/history')}
              style={styles.halfButton}
            />
            <A11yButton
              label="設定"
              hint="アプリの設定を変更します"
              variant="secondary"
              onPress={() => router.push('/settings')}
              style={styles.halfButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Native camera view
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mode="picture"
      />

      {/* Overlay controls */}
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <A11yText variant="title" style={styles.title}>
            読み友
          </A11yText>
          {!isModelLoaded && (
            <A11yText variant="caption" style={styles.modelBanner}>
              設定からAI要約モデルをダウンロードできます
            </A11yText>
          )}
        </View>

        <View style={styles.instruction}>
          <A11yText variant="body" style={styles.instructionText}>
            書類をカメラに向けてください
          </A11yText>
        </View>

        <View style={styles.controls}>
          <A11yButton
            label={isCapturing ? '読み取り中...' : '撮影する'}
            hint="書類を撮影してテキストを読み取ります"
            onPress={handleCapture}
            size="big"
            icon="📷"
          />
          <View style={styles.secondaryButtons}>
            <A11yButton
              label="履歴"
              hint="過去の読み取り結果を表示します"
              variant="secondary"
              onPress={() => router.push('/history')}
              style={styles.halfButton}
            />
            <A11yButton
              label="設定"
              hint="アプリの設定を変更します"
              variant="secondary"
              onPress={() => router.push('/settings')}
              style={styles.halfButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: A11Y.SPACING.lg,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: A11Y.SPACING.lg,
  },
  header: {
    alignItems: 'center',
    gap: A11Y.SPACING.xs,
    paddingTop: A11Y.SPACING.md,
  },
  title: {
    color: Colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  modelBanner: {
    backgroundColor: Colors.surface,
    paddingHorizontal: A11Y.SPACING.md,
    paddingVertical: A11Y.SPACING.xs,
    borderRadius: A11Y.RADIUS.sm,
    overflow: 'hidden',
  },
  instruction: {
    alignItems: 'center',
  },
  instructionText: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: A11Y.SPACING.lg,
    paddingVertical: A11Y.SPACING.sm,
    borderRadius: A11Y.RADIUS.md,
    textAlign: 'center',
    overflow: 'hidden',
  },
  controls: {
    gap: A11Y.SPACING.md,
    paddingBottom: A11Y.SPACING.md,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: A11Y.SPACING.sm,
  },
  halfButton: {
    flex: 1,
  },
  // Permission screen
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: A11Y.SPACING.xl,
  },
  permissionTitle: {
    textAlign: 'center',
    color: Colors.primary,
  },
  permissionDesc: {
    textAlign: 'center',
    lineHeight: 28,
  },
  // Demo
  demoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: A11Y.SPACING.md,
  },
  demoIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  demoText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 24,
  },
  demoSub: {
    textAlign: 'center',
  },
});
