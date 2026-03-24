/**
 * Accessibility constants for Yomitomo
 * Following Apple HIG + enhanced for visually impaired users
 */

export const A11Y = {
  // Minimum touch target (Apple HIG: 44pt, we use 48pt)
  MIN_TOUCH_SIZE: 48,

  // Large button size for main actions
  BIG_BUTTON_SIZE: 120,

  // Font sizes (larger than standard)
  FONT_SIZE: {
    body: 18,
    title: 28,
    heading: 36,
    big: 48,
  },

  // Spacing
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border radius
  RADIUS: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },

  // Border width (thicker for visibility)
  BORDER_WIDTH: 2,
};

export default A11Y;
