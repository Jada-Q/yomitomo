import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  Platform,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

interface A11yScreenProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
  announceOnMount?: string;
}

export default function A11yScreen({
  title,
  children,
  style,
  announceOnMount,
}: A11yScreenProps) {
  const titleRef = useRef<Text>(null);

  useEffect(() => {
    // Focus the title for VoiceOver when screen mounts (native only)
    const timer = setTimeout(() => {
      if (Platform.OS !== 'web' && titleRef.current) {
        const { findNodeHandle } = require('react-native');
        const handle = findNodeHandle(titleRef.current);
        if (handle) {
          AccessibilityInfo.setAccessibilityFocus(handle);
        }
      }
      if (announceOnMount) {
        AccessibilityInfo.announceForAccessibility(announceOnMount);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [announceOnMount]);

  return (
    <SafeAreaView style={[styles.container, style]}>
      <Text
        ref={titleRef}
        style={styles.title}
        accessible={true}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: A11Y.SPACING.lg,
  },
  title: {
    fontSize: A11Y.FONT_SIZE.heading,
    fontWeight: '700',
    color: Colors.text,
    marginTop: A11Y.SPACING.md,
    marginBottom: A11Y.SPACING.lg,
  },
  content: {
    flex: 1,
  },
});
