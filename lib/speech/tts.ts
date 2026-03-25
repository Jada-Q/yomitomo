import * as Speech from 'expo-speech';
import { AccessibilityInfo } from 'react-native';

let isSpeaking = false;

/**
 * Speak text in Japanese, with VoiceOver awareness
 * If VoiceOver is active, use announceForAccessibility instead of TTS
 * to avoid conflicts
 */
export async function speak(
  text: string,
  options?: { rate?: number; onDone?: () => void },
) {
  const voiceOverEnabled = await AccessibilityInfo.isScreenReaderEnabled();

  if (voiceOverEnabled) {
    // Let VoiceOver handle it
    AccessibilityInfo.announceForAccessibility(text);
    options?.onDone?.();
    return;
  }

  // Use expo-speech TTS for non-VoiceOver users
  stop();
  isSpeaking = true;

  Speech.speak(text, {
    language: 'ja-JP',
    rate: options?.rate ?? 0.9,
    onDone: () => {
      isSpeaking = false;
      options?.onDone?.();
    },
    onError: () => {
      isSpeaking = false;
    },
  });
}

export function stop() {
  Speech.stop();
  isSpeaking = false;
}

export function getIsSpeaking() {
  return isSpeaking;
}
