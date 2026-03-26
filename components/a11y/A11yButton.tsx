import { Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

interface A11yButtonProps {
  label: string;
  hint?: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'normal' | 'big';
  disabled?: boolean;
  selected?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function A11yButton({
  label,
  hint,
  onPress,
  icon,
  variant = 'primary',
  size = 'normal',
  disabled = false,
  selected,
  style,
  textStyle,
}: A11yButtonProps) {
  const handlePress = () => {
    console.log('[A11yButton] pressed:', label, 'disabled:', disabled);
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.warn('[A11yButton] Haptics failed:', e);
    }
    onPress();
  };

  const isBig = size === 'big';
  const bgColor =
    variant === 'danger'
      ? Colors.danger
      : variant === 'secondary'
        ? Colors.surface
        : Colors.primary;
  const txtColor =
    variant === 'primary' ? Colors.background : Colors.text;

  const state: { disabled: boolean; selected?: boolean } = { disabled };
  if (selected !== undefined) state.selected = selected;

  return (
    <Pressable
      accessible={true}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityRole="button"
      accessibilityState={state}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        isBig && styles.big,
        {
          backgroundColor: bgColor,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          borderColor: variant === 'secondary' ? Colors.border : 'transparent',
          borderWidth: variant === 'secondary' ? A11Y.BORDER_WIDTH : 0,
        },
        style,
      ]}
    >
      {icon && (
        <Text
          style={[styles.icon, isBig && styles.iconBig]}
          importantForAccessibility="no"
          accessible={false}
        >
          {icon}
        </Text>
      )}
      <Text
        style={[
          styles.text,
          isBig && styles.textBig,
          { color: txtColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: A11Y.MIN_TOUCH_SIZE,
    minHeight: A11Y.MIN_TOUCH_SIZE,
    paddingHorizontal: A11Y.SPACING.lg,
    paddingVertical: A11Y.SPACING.md,
    borderRadius: A11Y.RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  big: {
    width: '100%',
    minHeight: A11Y.BIG_BUTTON_SIZE,
    borderRadius: A11Y.RADIUS.xl,
    paddingVertical: A11Y.SPACING.xl,
  },
  icon: {
    fontSize: 32,
    marginBottom: A11Y.SPACING.xs,
  },
  iconBig: {
    fontSize: 48,
    marginBottom: A11Y.SPACING.sm,
  },
  text: {
    fontSize: A11Y.FONT_SIZE.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  textBig: {
    fontSize: A11Y.FONT_SIZE.title,
  },
});
