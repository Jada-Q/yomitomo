import { Platform } from 'react-native';
import { getModelPath, getModelStatus, type ModelVariant } from './modelManager';
import { buildPrompt } from './prompts';

export interface DocumentSummary {
  documentType: string;
  sender: string;
  summary: string;
  keyInfo: string[];
  actionNeeded: string | null;
}

let llamaContext: any = null;

/**
 * Initialize the local LLM (load model into memory)
 */
export async function initLlm(variant: ModelVariant = 'standard'): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const status = await getModelStatus(variant);
  if (status !== 'ready') return false;

  if (llamaContext) return true; // Already loaded

  try {
    const { initLlama } = require('llama.rn');
    const modelPath = getModelPath(variant);

    llamaContext = await initLlama({
      model: modelPath,
      n_ctx: 2048,
      n_batch: 512,
      n_threads: 4,
      n_gpu_layers: 99, // Use Metal GPU acceleration
      flash_attn_type: 'auto',
      cache_type_k: 'q4_0',
      cache_type_v: 'q4_0',
    });

    return true;
  } catch (e) {
    console.error('Failed to init LLM:', e);
    llamaContext = null;
    return false;
  }
}

/**
 * Check if LLM is loaded and ready
 */
export function isLlmReady(): boolean {
  return llamaContext !== null;
}

/**
 * Summarize OCR text using local LLM
 */
export async function summarizeDocument(
  ocrText: string,
  language: 'ja' | 'zh' | 'en',
): Promise<DocumentSummary | null> {
  if (!llamaContext || !ocrText.trim()) return null;

  try {
    const prompt = buildPrompt(ocrText, language);

    const result = await llamaContext.completion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant that outputs only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      n_predict: 512,
      temperature: 0.3,
      top_p: 0.9,
      stop: ['\n\n\n'],
    });

    const responseText = result.text?.trim() || '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      documentType: parsed.documentType || '不明な書類',
      sender: parsed.sender || '不明',
      summary: parsed.summary || '',
      keyInfo: Array.isArray(parsed.keyInfo) ? parsed.keyInfo : [],
      actionNeeded: parsed.actionNeeded || null,
    };
  } catch (e) {
    console.error('LLM summarization failed:', e);
    return null;
  }
}

/**
 * Release LLM from memory
 */
export async function releaseLlm(): Promise<void> {
  if (llamaContext) {
    try {
      await llamaContext.release();
    } catch (_) {}
    llamaContext = null;
  }
}
