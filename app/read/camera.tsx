import { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  AccessibilityInfo,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import A11yButton from '@/components/a11y/A11yButton';
import A11yScreen from '@/components/a11y/A11yScreen';
import A11yText from '@/components/a11y/A11yText';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { readDocument } from '@/lib/ai/documentReader';
import { speak } from '@/lib/speech/tts';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

const IS_DEMO = process.env.EXPO_PUBLIC_MODE === 'demo';

export default function DocumentCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { setCurrentResult, setLoading, addDocument } = useDocumentStore();

  const processImage = async (base64: string, uri: string) => {
    setLoading(true);
    const result = await readDocument(base64);
    setCurrentResult(result);

    addDocument({
      id: Date.now().toString(),
      result,
      imageUri: uri,
      createdAt: Date.now(),
    });

    setLoading(false);
    router.replace('/read/result');
  };

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AccessibilityInfo.announceForAccessibility('撮影しました。読み取り中です。');
    speak('撮影しました。読み取り中です。お待ちください。');

    try {
      if (IS_DEMO) {
        // Demo mode — skip real camera, use mock data
        await processImage('demo', 'demo://document');
      } else {
        if (!cameraRef.current) throw new Error('Camera not ready');
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });
        if (!photo?.base64) throw new Error('Failed to capture photo');
        await processImage(photo.base64, photo.uri);
      }
    } catch (error) {
      setIsCapturing(false);
      setLoading(false);
      const message = 'すみません、エラーが発生しました。もう一度お試しください。';
      speak(message);
      Alert.alert('エラー', message);
    }
  };

  // Demo mode — show simplified UI without real camera
  if (IS_DEMO) {
    return (
      <A11yScreen
        title="書類を読み取る"
        announceOnMount="デモモードです。ボタンを押すとサンプルの読み取り結果が表示されます。"
      >
        <View style={styles.demoContainer}>
          <View style={styles.demoPreview}>
            <A11yText variant="title" style={styles.demoIcon}>
              📄
            </A11yText>
            <A11yText variant="body" style={styles.demoText}>
              デモモード
            </A11yText>
            <A11yText variant="caption" style={styles.demoSubtext}>
              サンプルデータで動作を確認できます
            </A11yText>
          </View>

          <A11yButton
            label={isCapturing ? '読み取り中...' : 'サンプル書類を読み取る'}
            hint="サンプルの書類データをAIが読み上げます"
            size="big"
            onPress={handleCapture}
          />
        </View>
      </A11yScreen>
    );
  }

  // Real camera mode
  if (!permission) {
    return (
      <A11yScreen title="カメラ">
        <A11yText>カメラの権限を確認中...</A11yText>
      </A11yScreen>
    );
  }

  if (!permission.granted) {
    return (
      <A11yScreen title="カメラの許可が必要です">
        <View style={styles.permissionContainer}>
          <A11yText variant="body" style={styles.permissionText}>
            書類を読み取るためにカメラの使用許可が必要です。
          </A11yText>
          <A11yButton
            label="カメラを許可する"
            hint="カメラの使用許可を求めるダイアログが表示されます"
            onPress={requestPermission}
          />
        </View>
      </A11yScreen>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <A11yText variant="body" style={styles.instruction}>
            書類をカメラに向けてください
          </A11yText>

          <View style={styles.captureArea}>
            <A11yButton
              label={isCapturing ? '読み取り中...' : '撮影する'}
              hint="書類を撮影してAIが読み取ります"
              size="big"
              onPress={handleCapture}
              style={styles.captureButton}
            />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: A11Y.SPACING.lg,
  },
  instruction: {
    textAlign: 'center',
    color: Colors.text,
    backgroundColor: Colors.overlay,
    padding: A11Y.SPACING.md,
    borderRadius: A11Y.RADIUS.md,
    marginTop: A11Y.SPACING.xl,
  },
  captureArea: {
    alignItems: 'center',
    marginBottom: A11Y.SPACING.xxl,
  },
  captureButton: {
    width: 200,
    backgroundColor: Colors.primary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: A11Y.SPACING.lg,
  },
  permissionText: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  demoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: A11Y.SPACING.xl,
    paddingBottom: A11Y.SPACING.xxl,
  },
  demoPreview: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.xl,
    padding: A11Y.SPACING.xxl,
    alignItems: 'center',
    borderWidth: A11Y.BORDER_WIDTH,
    borderColor: Colors.borderSubtle,
    gap: A11Y.SPACING.sm,
  },
  demoIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  demoText: {
    textAlign: 'center',
    color: Colors.primary,
    fontWeight: '700',
  },
  demoSubtext: {
    textAlign: 'center',
  },
});
