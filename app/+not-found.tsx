import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import A11yScreen from '@/components/a11y/A11yScreen';
import A11yText from '@/components/a11y/A11yText';
import A11yButton from '@/components/a11y/A11yButton';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';
import { useRouter } from 'expo-router';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'ページが見つかりません' }} />
      <A11yScreen
        title="ページが見つかりません"
        announceOnMount="このページは存在しません。ホームに戻るボタンがあります。"
      >
        <View style={styles.content}>
          <A11yText variant="body" style={styles.desc}>
            お探しのページは存在しません。
          </A11yText>
          <A11yButton
            label="ホームに戻る"
            hint="カメラ画面に戻ります"
            onPress={() => router.replace('/')}
          />
        </View>
      </A11yScreen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: A11Y.SPACING.xl,
  },
  desc: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});
