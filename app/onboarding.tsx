import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import A11yText from '@/components/a11y/A11yText';
import A11yButton from '@/components/a11y/A11yButton';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { speak } from '@/lib/speech/tts';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGES = [
  {
    icon: '📄',
    title: '書類を読み取る',
    description:
      'カメラで書類を撮影するだけで、AIが内容を理解して音声で伝えます。請求書、薬の説明書、メニューなど、あらゆる書類に対応。',
    announce:
      '読み友へようこそ。最初の機能は書類の読み取りです。カメラで撮影するだけで、AIが書類の内容を音声で伝えます。',
  },
  {
    icon: '👁',
    title: '周囲を見る',
    description:
      'カメラを周囲に向けると、AIが場所の種類、障害物、読める文字などを音声で説明します。安全情報を最優先でお伝えします。',
    announce:
      '2つ目の機能は、周囲の説明です。カメラを向けるだけで、AIが安全情報を優先して周囲の状況を説明します。',
  },
  {
    icon: '🗺',
    title: '盲道マップ',
    description:
      '日本初の点字ブロック・デジタルマップ。みんなで盲道の位置を記録して、より安全な歩行ルートを作りましょう。',
    announce:
      '3つ目の機能は、盲道マップです。点字ブロックの場所をみんなで記録し、安全な歩行を支援します。',
  },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();
  const { completeOnboarding } = useOnboardingStore();
  const page = PAGES[currentPage];
  const isLast = currentPage === PAGES.length - 1;

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      completeOnboarding();
      router.replace('/');
    } else {
      const next = currentPage + 1;
      setCurrentPage(next);
      speak(PAGES[next].announce);
    }
  };

  const skip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      {!isLast && (
        <Pressable
          accessible={true}
          accessibilityLabel="スキップ"
          accessibilityHint="オンボーディングをスキップしてアプリを始めます"
          accessibilityRole="button"
          onPress={skip}
          style={styles.skipButton}
        >
          <A11yText variant="body" style={styles.skipText}>
            スキップ
          </A11yText>
        </Pressable>
      )}

      {/* Page Content */}
      <View style={styles.content}>
        <A11yText variant="heading" style={styles.icon}>
          {page.icon}
        </A11yText>
        <A11yText variant="title" style={styles.title} announce={true}>
          {page.title}
        </A11yText>
        <A11yText variant="body" style={styles.description}>
          {page.description}
        </A11yText>
      </View>

      {/* Page Indicators */}
      <View
        style={styles.indicators}
        accessible={true}
        accessibilityLabel={`ページ${currentPage + 1}/${PAGES.length}`}
      >
        {PAGES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentPage && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Action Button */}
      <View style={styles.actions}>
        <A11yButton
          label={isLast ? '始める' : '次へ'}
          hint={
            isLast
              ? 'オンボーディングを終了してアプリを始めます'
              : '次の機能紹介に進みます'
          }
          size="big"
          onPress={goNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: A11Y.SPACING.lg,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: A11Y.SPACING.md,
    minWidth: A11Y.MIN_TOUCH_SIZE,
    minHeight: A11Y.MIN_TOUCH_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: A11Y.SPACING.lg,
    paddingHorizontal: A11Y.SPACING.lg,
  },
  icon: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: A11Y.SPACING.md,
  },
  title: {
    textAlign: 'center',
    color: Colors.primary,
  },
  description: {
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 28,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: A11Y.SPACING.sm,
    marginBottom: A11Y.SPACING.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.borderSubtle,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 28,
  },
  actions: {
    paddingBottom: A11Y.SPACING.xl,
  },
});
