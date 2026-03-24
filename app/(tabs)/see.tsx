import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import A11yScreen from '@/components/a11y/A11yScreen';
import A11yButton from '@/components/a11y/A11yButton';
import A11yText from '@/components/a11y/A11yText';
import A11Y from '@/constants/accessibility';
import Colors from '@/constants/Colors';

export default function SeeTab() {
  const router = useRouter();

  return (
    <A11yScreen
      title="周囲を見る"
      announceOnMount="周囲を見る画面です。カメラで撮影すると、AIが周囲の状況を説明します。"
    >
      <View style={styles.content}>
        <A11yText variant="body" style={styles.description}>
          カメラで周囲を撮影すると、AIが場所や障害物を音声で説明します。
        </A11yText>

        <A11yButton
          label="周囲を撮影する"
          hint="カメラが開きます。周囲の状況をAIが説明します"
          icon="👁"
          size="big"
          onPress={() => router.push('/see/camera')}
        />
      </View>
    </A11yScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: A11Y.SPACING.lg,
  },
  description: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: A11Y.SPACING.xl,
  },
});
