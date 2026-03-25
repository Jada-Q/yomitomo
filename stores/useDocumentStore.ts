import { create } from 'zustand';
import type { DocumentSummary } from '@/lib/llm/localLlm';

interface DocumentState {
  // OCR result (Layer 1 — instant)
  ocrText: string;
  detectedLanguage: 'ja' | 'zh' | 'en' | 'unknown';

  // LLM summary (Layer 2 — async)
  summary: DocumentSummary | null;
  isSummarizing: boolean;

  // UI state
  isCapturing: boolean;

  setOcrResult: (text: string, language: 'ja' | 'zh' | 'en' | 'unknown') => void;
  setSummary: (summary: DocumentSummary | null) => void;
  setIsSummarizing: (v: boolean) => void;
  setIsCapturing: (v: boolean) => void;
  clear: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  ocrText: '',
  detectedLanguage: 'unknown',
  summary: null,
  isSummarizing: false,
  isCapturing: false,

  setOcrResult: (text, language) => set({ ocrText: text, detectedLanguage: language }),
  setSummary: (summary) => set({ summary, isSummarizing: false }),
  setIsSummarizing: (v) => set({ isSummarizing: v }),
  setIsCapturing: (v) => set({ isCapturing: v }),
  clear: () =>
    set({
      ocrText: '',
      detectedLanguage: 'unknown',
      summary: null,
      isSummarizing: false,
      isCapturing: false,
    }),
}));
