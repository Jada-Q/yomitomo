import { useEffect, useRef } from 'react';
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
import { explainDocument, isGeminiAvailable } from '@/lib/gemini';
import { matchOfflineTemplate } from '@/lib/offline-templates';
import { useDocumentStore } from '@/stores/useDocumentStore';
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
        // Web demo: use mock OCR + AI explanation
        const demoText = '東京電力エナジーパートナー ご請求書\nご請求金額 4,320円\nお支払期限 2026年3月30日';
        speak('デモモードです。読み取り中です。');
        setOcrResult(demoText, 'ja');
        setIsSummarizing(true);

        // Wait for AI explanation BEFORE navigating
        let summary = null;
        if (isGeminiAvailable()) {
          const result = await explainDocument(demoText);
          summary = result.summary;
          if (result.rateLimited) {
            speak('本日のAI解析回数の上限に達しました。オフライン解析を使用します。');
          }
        }
        if (!summary) {
          summary = matchOfflineTemplate(demoText);
        }
        setSummary(summary);
        setIsCapturing(false);
        router.push('/result');
        return;
      }

      // Capture photo
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      AccessibilityInfo.announceForAccessibility('撮影しました。読み取り中です。');
      speak('撮影しました。読み取り中です。');

      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) {
        AccessibilityInfo.announceForAccessibility('撮影に失敗しました。');
        speak('撮影に失敗しました。もう一度お試しください。');
        setIsCapturing(false);
        return;
      }

      imageUri = photo.uri;

      // Layer 1: OCR (instant, on-device)
      const ocrResult = await recognizeText(imageUri);

      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
        AccessibilityInfo.announceForAccessibility('テキストが検出されませんでした。');
        speak('テキストが検出されませんでした。書類をもう少し近づけて、もう一度お試しください。');
        setIsCapturing(false);
        return;
      }

      setOcrResult(ocrResult.text, ocrResult.detectedLanguage);

      // Layer 2: AI explanation — wait before navigating
      setIsSummarizing(true);
      let summary = null;

      if (isGeminiAvailable()) {
        const result = await explainDocument(ocrResult.text);
        summary = result.summary;
        if (result.rateLimited) {
          AccessibilityInfo.announceForAccessibility('本日のAI解析回数の上限に達しました。オフライン解析を使用します。');
          speak('本日のAI解析回数の上限に達しました。オフライン解析を使用します。');
        }
      }
      if (!summary) {
        summary = matchOfflineTemplate(ocrResult.text);
      }

      setSummary(summary);
      setIsCapturing(false);

      // Save to history
      addToHistory({
        id: Date.now().toString(),
        ocrText: ocrResult.text,
        summary: summary?.summary ?? null,
        documentType: summary?.documentType ?? null,
        detectedLanguage: ocrResult.detectedLanguage,
        createdAt: Date.now(),
      });

      // Navigate AFTER data is ready
      router.push('/result');
    } catch (e) {
      console.error('Capture error:', e);
      AccessibilityInfo.announceForAccessibility('エラーが発生しました。');
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
        <View
          style={styles.permissionContainer}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel="カメラの許可が必要です。書類を撮影してテキストを読み上げるために、カメラへのアクセスを許可してください。"
        >
          <A11yText variant="title" style={styles.permissionTitle}>
            カメラの許可が必要です
          </A11yText>
          <A11yText variant="body" style={styles.permissionDesc}>
            書類を撮影してテキストを読み上げるために、カメラへのアクセスを許可してください。
          </A11yText>
        </View>
        <A11yButton
          label="カメラを許可する"
          hint="カメラの使用許可を求めます"
          onPress={requestPermission}
          size="big"
        />
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
        <View
          style={styles.demoContainer}
          accessible={true}
          accessibilityLabel="デモモード。実機ではカメラで書類を撮影できます。"
        >
          <A11yText variant="heading" style={styles.demoIcon} decorative>
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
          <View
            style={styles.secondaryButtons}
            accessibilityRole="toolbar"
            accessibilityLabel="追加操作"
          >
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
        accessible={false}
      />

      {/* Overlay controls */}
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <A11yText variant="title" style={styles.title} accessibilityLabel="読み友 カメラ画面">
            読み友
          </A11yText>
        </View>

        <View
          style={styles.instruction}
          accessible={true}
          accessibilityLabel="書類をカメラに向けてください"
          accessibilityRole="text"
        >
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
            disabled={isCapturing}
          />
          <View
            style={styles.secondaryButtons}
            accessibilityRole="toolbar"
            accessibilityLabel="追加操作"
          >
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
