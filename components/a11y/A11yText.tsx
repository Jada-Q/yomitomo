import { useEffect } from 'react';
import { Text, StyleSheet, AccessibilityInfo, TextStyle } from 'react-native';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

interface A11yTextProps {
  children: React.ReactNode;
  announce?: boolean;
  variant?: 'body' | 'title' | 'heading' | 'caption';
  style?: TextStyle;
}

export default function A11yText({
  children,
  announce = false,
  variant = 'body',
  style,
}: A11yTextProps) {
  useEffect(() => {
    if (announce && children) {
      const text = typeof children === 'string' ? children : String(children);
      AccessibilityInfo.announceForAccessibility(text);
    }
  }, [announce, children]);

  return (
    <Text
      accessible={true}
      accessibilityRole="text"
      style={[styles.base, styles[variant], style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.text,
  },
  body: {
    fontSize: A11Y.FONT_SIZE.body,
    lineHeight: A11Y.FONT_SIZE.body * 1.6,
  },
  title: {
    fontSize: A11Y.FONT_SIZE.title,
    fontWeight: '700',
    lineHeight: A11Y.FONT_SIZE.title * 1.3,
  },
  heading: {
    fontSize: A11Y.FONT_SIZE.heading,
    fontWeight: '700',
    lineHeight: A11Y.FONT_SIZE.heading * 1.2,
  },
  caption: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 14 * 1.5,
  },
});
