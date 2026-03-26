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
  console.log('[TTS] Speaking:', text.slice(0, 80));

  if (Platform.OS === 'web') {
    speakWeb(text, options);
  } else {
    speakNative(text, options);
  }
}

export function stop() {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } else {
      // Dynamic import to avoid loading expo-speech on web
      const Speech = require('expo-speech');
      Speech.stop();
    }
  } catch (e) {
    console.warn('[TTS] stop() error (ignored):', e);
  }
  isSpeaking = false;
}

export function getIsSpeaking() {
  return isSpeaking;
}

// ── Web implementation ──────────────────────────────────

function speakWeb(text: string, options?: { rate?: number; onDone?: () => void }) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.error('[TTS] window.speechSynthesis not available');
    isSpeaking = false;
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = options?.rate ?? 0.9;

  // Try to assign a Japanese voice
  const voices = synth.getVoices();
  const jaVoice = voices.find(v => v.lang.startsWith('ja'));
  if (jaVoice) {
    utterance.voice = jaVoice;
    console.log('[TTS] Using voice:', jaVoice.name);
  } else {
    console.log('[TTS] No Japanese voice found, using default. Voices loaded:', voices.length);
  }

  utterance.onstart = () => console.log('[TTS] Web speech started');
  utterance.onend = () => {
    console.log('[TTS] Web speech ended');
    isSpeaking = false;
    options?.onDone?.();
  };
  utterance.onerror = (e) => {
    console.error('[TTS] Web speech error:', e.error);
    isSpeaking = false;
  };

  synth.speak(utterance);
  console.log('[TTS] synth.speak() called, speaking:', synth.speaking);
}

// ── Native implementation ───────────────────────────────

function speakNative(text: string, options?: { rate?: number; onDone?: () => void }) {
  try {
    const Speech = require('expo-speech');
    const { AccessibilityInfo } = require('react-native');

    // Check VoiceOver — use cached sync check
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
