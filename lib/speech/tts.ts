import { Platform } from 'react-native';

let isSpeaking = false;

/**
 * Speak text aloud.
 * - Web: uses window.speechSynthesis directly (no expo-speech dependency)
 * - Native: uses expo-speech
 */
export function speak(
  text: string,
  options?: { rate?: number; onDone?: () => void },
) {
  if (!text) return;

  stop();
  isSpeaking = true;

  if (Platform.OS === 'web') {
    // ── Web: use window.speechSynthesis directly ──
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      isSpeaking = false;
      return;
    }

    const synth = window.speechSynthesis;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = options?.rate ?? 0.9;

    const voices = synth.getVoices();
    const jaVoice = voices.find((v) => v.lang.startsWith('ja'));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    utterance.onstart = () => {
      console.log('[TTS] Web speech started');
    };
    utterance.onend = () => {
      console.log('[TTS] Web speech ended');
      isSpeaking = false;
      options?.onDone?.();
    };
    utterance.onerror = (e) => {
      // "interrupted" and "canceled" are expected when cancel() is called
      // before starting a new utterance. Not real errors.
      if (e.error === 'interrupted' || e.error === 'canceled') {
        console.debug('[TTS] Speech replaced (normal):', e.error);
        return;
      }
      console.debug('[TTS] Web speech error:', e.error);
      isSpeaking = false;
    };

    // Chrome ignores speak() called immediately after cancel().
    // A short delay ensures the cancel is fully processed first.
    setTimeout(() => {
      synth.speak(utterance);
    }, 100);
  } else {
    // ── Native: use expo-speech ──
    try {
      const Speech = require('expo-speech');
      const { AccessibilityInfo } = require('react-native');

      AccessibilityInfo.isScreenReaderEnabled().then((enabled: boolean) => {
        if (enabled) {
          AccessibilityInfo.announceForAccessibility(text);
          isSpeaking = false;
          options?.onDone?.();
          return;
        }

        Speech.speak(text, {
          language: 'ja-JP',
          rate: options?.rate ?? 0.9,
          onDone: () => {
            isSpeaking = false;
            options?.onDone?.();
          },
          onError: (err: unknown) => {
            console.error('[TTS] Native speech error:', err);
            isSpeaking = false;
          },
        });
      });
    } catch (e) {
      console.error('[TTS] Native speak error:', e);
      isSpeaking = false;
    }
  }
}

export function stop() {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } else {
      const Speech = require('expo-speech');
      Speech.stop();
    }
  } catch (e) {
    // ignore — stop is best-effort
  }
  isSpeaking = false;
}

export function getIsSpeaking() {
  return isSpeaking;
}
