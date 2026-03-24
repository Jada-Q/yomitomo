import { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import A11yText from '@/components/a11y/A11yText';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
}

export default function LoadingOverlay({
  message = '読み取り中...',
  visible,
}: LoadingOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility(message);

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible, message, pulseAnim]);

  if (!visible) return null;

  return (
    <View
      style={styles.overlay}
      accessible={true}
      accessibilityLabel={message}
      accessibilityRole="progressbar"
    >
      <Animated.View
        style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}
      >
        <A11yText variant="heading" style={styles.icon}>
          📖
        </A11yText>
      </Animated.View>
      <A11yText variant="title" style={styles.message}>
        {message}
      </A11yText>
      <A11yText variant="caption" style={styles.submessage}>
        AIが内容を分析しています
      </A11yText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    gap: A11Y.SPACING.lg,
    zIndex: 100,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
  },
  message: {
    color: Colors.text,
    textAlign: 'center',
  },
  submessage: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
