import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import A11yScreen from '@/components/a11y/A11yScreen';
import A11yButton from '@/components/a11y/A11yButton';
import A11yText from '@/components/a11y/A11yText';
import A11Y from '@/constants/accessibility';
import Colors from '@/constants/Colors';

export default function ReadTab() {
  const router = useRouter();

  return (
    <A11yScreen
      title="読み友"
      announceOnMount="読み友へようこそ。書類を撮影すると、AIが内容を読み上げます。"
    >
      <View style={styles.content}>
        <A11yText variant="body" style={styles.description}>
          書類を撮影すると、AIが内容を読み取って音声で伝えます。
        </A11yText>

        <View style={styles.buttonGroup}>
          <A11yButton
            label="書類を読み取る"
            hint="カメラが開きます。書類を撮影してAIが読み上げます"
            icon="📄"
            size="big"
            onPress={() => router.push('/read/camera')}
          />

          <A11yButton
            label="読み取り履歴"
            hint="過去に読み取った書類の一覧を表示します"
            variant="secondary"
            onPress={() => router.push('/read/history')}
            style={styles.secondaryButton}
          />

          <A11yButton
            label="設定"
            hint="読み上げ速度などの設定を変更します"
            variant="secondary"
            onPress={() => router.push('/settings')}
          />
        </View>
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
  buttonGroup: {
    gap: A11Y.SPACING.md,
  },
  secondaryButton: {
    marginTop: A11Y.SPACING.sm,
  },
});
