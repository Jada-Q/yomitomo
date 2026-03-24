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
import { describeScene } from '@/lib/ai/sceneDescriber';
import { useSceneStore } from '@/stores/useSceneStore';
import { speak } from '@/lib/speech/tts';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

const IS_DEMO = process.env.EXPO_PUBLIC_MODE === 'demo';

export default function SceneCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { setCurrentScene, setLoading } = useSceneStore();

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AccessibilityInfo.announceForAccessibility('撮影しました。周囲を分析中です。');
    speak('撮影しました。周囲を分析中です。');

    try {
      let base64 = 'demo';
      if (!IS_DEMO) {
        if (!cameraRef.current) throw new Error('Camera not ready');
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });
        if (!photo?.base64) throw new Error('Failed to capture');
        base64 = photo.base64;
      }

      setLoading(true);
      const result = await describeScene(base64);
      setCurrentScene(result);
      setLoading(false);
      router.replace('/see/result');
    } catch (error) {
      setIsCapturing(false);
      setLoading(false);
      const msg = 'すみません、分析に失敗しました。もう一度お試しください。';
      speak(msg);
      Alert.alert('エラー', msg);
    }
  };

  // Demo mode
  if (IS_DEMO) {
    return (
      <A11yScreen
        title="周囲を見る"
        announceOnMount="デモモードです。ボタンを押すとサンプルの周囲説明が表示されます。"
      >
        <View style={styles.demoContainer}>
          <View style={styles.demoPreview}>
            <A11yText variant="title" style={styles.demoIcon}>
              👁
            </A11yText>
            <A11yText variant="body" style={styles.demoText}>
              デモモード
            </A11yText>
            <A11yText variant="caption" style={styles.demoSubtext}>
              サンプルの周囲説明を確認できます
            </A11yText>
          </View>

          <A11yButton
            label={isCapturing ? '分析中...' : '周囲を確認する'}
            hint="サンプルの周囲状況をAIが説明します"
            size="big"
            onPress={handleCapture}
          />
        </View>
      </A11yScreen>
    );
  }

  // Real camera mode
  if (!permission?.granted) {
    return (
      <A11yScreen title="カメラの許可が必要です">
        <View style={styles.permissionContainer}>
          <A11yText variant="body" style={styles.permissionText}>
            周囲を説明するためにカメラの使用許可が必要です。
          </A11yText>
          <A11yButton label="カメラを許可する" onPress={requestPermission} />
        </View>
      </A11yScreen>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <A11yText variant="body" style={styles.instruction}>
            周囲にカメラを向けてください
          </A11yText>
          <View style={styles.captureArea}>
            <A11yButton
              label={isCapturing ? '分析中...' : '撮影する'}
              hint="周囲を撮影してAIが状況を説明します"
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
  container: { flex: 1, backgroundColor: Colors.background },
  camera: { flex: 1 },
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
  captureButton: { width: 200 },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: A11Y.SPACING.lg,
  },
  permissionText: { textAlign: 'center', color: Colors.textSecondary },
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
  demoIcon: { fontSize: 64, textAlign: 'center' },
  demoText: { textAlign: 'center', color: Colors.primary, fontWeight: '700' },
  demoSubtext: { textAlign: 'center' },
});
