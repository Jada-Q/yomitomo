import { Platform } from 'react-native';

// Types matching rn-mlkit-ocr API
export interface OcrBlock {
  text: string;
  frame: { x: number; y: number; width: number; height: number };
  lines: Array<{
    text: string;
    frame: { x: number; y: number; width: number; height: number };
    elements: Array<{
      text: string;
      frame: { x: number; y: number; width: number; height: number };
    }>;
  }>;
}

export interface OcrResult {
  text: string;
  blocks: OcrBlock[];
  detectedLanguage: 'ja' | 'zh' | 'en' | 'unknown';
}

type DetectorType = 'latin' | 'chinese' | 'japanese' | 'korean';

/**
 * Detect primary language from text using Unicode ranges
 */
function detectLanguage(text: string): 'ja' | 'zh' | 'en' | 'unknown' {
  const hiragana = /[\u3040-\u309F]/;
  const katakana = /[\u30A0-\u30FF]/;
  const cjk = /[\u4E00-\u9FFF]/;
  const latin = /[a-zA-Z]/;

  const chars = text.replace(/[\s\d\p{P}]/gu, '');
  if (!chars) return 'unknown';

  let jaCount = 0;
  let cjkCount = 0;
  let latinCount = 0;

  for (const char of chars) {
    if (hiragana.test(char) || katakana.test(char)) jaCount++;
    else if (cjk.test(char)) cjkCount++;
    else if (latin.test(char)) latinCount++;
  }

  // Hiragana/katakana = definitely Japanese
  if (jaCount > 0) return 'ja';
  // CJK without kana = likely Chinese
  if (cjkCount > latinCount) return 'zh';
  // Mostly Latin
  if (latinCount > 0) return 'en';
  return 'unknown';
}

/**
 * Choose the best ML Kit detector for a language
 */
function getDetectorForLanguage(lang: 'ja' | 'zh' | 'en' | 'unknown'): DetectorType {
  switch (lang) {
    case 'ja': return 'japanese';
    case 'zh': return 'chinese';
    case 'en': return 'latin';
    default: return 'japanese'; // Default to Japanese for Japan-based users
  }
}

/**
 * Recognize text from an image using ML Kit OCR
 * On web, returns a mock result for development
 */
export async function recognizeText(
  imageUri: string,
  preferredLanguage?: 'ja' | 'zh' | 'en',
): Promise<OcrResult> {
  if (Platform.OS === 'web') {
    // Web fallback for development
    return {
      text: '[OCR はネイティブデバイスでのみ動作します]',
      blocks: [],
      detectedLanguage: 'ja',
    };
  }

  const MlkitOcr = require('rn-mlkit-ocr').default;

  // First pass: use preferred language detector or Japanese default
  const detector = preferredLanguage
    ? getDetectorForLanguage(preferredLanguage)
    : 'japanese';

  const result = await MlkitOcr.recognizeText(imageUri, detector);

  if (!result.text || result.text.trim().length === 0) {
    // If Japanese detector found nothing, try Latin
    if (detector === 'japanese') {
      const latinResult = await MlkitOcr.recognizeText(imageUri, 'latin');
      if (latinResult.text && latinResult.text.trim().length > 0) {
        return {
          text: latinResult.text,
          blocks: latinResult.blocks,
          detectedLanguage: 'en',
        };
      }
    }
    return { text: '', blocks: [], detectedLanguage: 'unknown' };
  }

  const detectedLanguage = detectLanguage(result.text);

  // If we detected a different language, re-run with the correct detector
  const correctDetector = getDetectorForLanguage(detectedLanguage);
  if (correctDetector !== detector) {
    const reResult = await MlkitOcr.recognizeText(imageUri, correctDetector);
    if (reResult.text && reResult.text.trim().length > result.text.trim().length) {
      return {
        text: reResult.text,
        blocks: reResult.blocks,
        detectedLanguage,
      };
    }
  }

  return {
    text: result.text,
    blocks: result.blocks,
    detectedLanguage,
  };
}
