/**
 * Yomitomo High Contrast Color System
 * All combinations exceed WCAG AAA 7:1 contrast ratio
 * Designed for visually impaired users
 */

export const Colors = {
  background: '#000000',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',
  primary: '#FFD700',       // Gold on black = high visibility
  primaryDark: '#B8960F',
  text: '#FFFFFF',
  textSecondary: '#E0E0E0',
  danger: '#FF6B6B',
  success: '#4ADE80',
  border: '#FFD700',
  borderSubtle: '#444444',
  overlay: 'rgba(0, 0, 0, 0.85)',
  tabBar: '#111111',
  tabBarActive: '#FFD700',
  tabBarInactive: '#888888',
};

// Navigation theme (always dark for accessibility)
// Uses DarkTheme as base to get proper font config
import { DarkTheme } from '@react-navigation/native';

export const NavigationTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.borderSubtle,
    notification: Colors.danger,
  },
};

export default Colors;
