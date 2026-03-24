import { StyleSheet, View } from 'react-native';
import A11yScreen from '@/components/a11y/A11yScreen';
import A11yText from '@/components/a11y/A11yText';
import A11yButton from '@/components/a11y/A11yButton';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { speak } from '@/lib/speech/tts';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

const SPEED_OPTIONS = [
  { label: 'ゆっくり', value: 0.6 },
  { label: 'ふつう', value: 0.9 },
  { label: '速い', value: 1.2 },
];

export default function SettingsScreen() {
  const { speechRate, setSpeechRate } = useSettingsStore();

  const handleSpeedChange = (value: number, label: string) => {
    setSpeechRate(value);
    speak(`読み上げ速度を${label}に変更しました。`, { rate: value });
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

        {/* App Info */}
        <View style={styles.section}>
          <A11yText variant="body" style={styles.sectionTitle}>
            アプリ情報
          </A11yText>
          <View style={styles.infoCard}>
            <A11yText variant="body" style={styles.appName}>
              読み友 Yomitomo
            </A11yText>
            <A11yText variant="caption">Version 1.0.0</A11yText>
            <A11yText variant="caption" style={styles.appDesc}>
              視覚障害者のためのAI情報アシスタント。{'\n'}
              書類の読み取り、周囲の説明、盲道マップを提供します。
            </A11yText>
          </View>
        </View>

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
