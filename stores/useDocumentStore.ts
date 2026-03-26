import { create } from 'zustand';

export interface DocumentSummary {
  documentType: string;
  sender: string;
  summary: string;
  keyInfo: string[];
  actionNeeded: string | null;
}

interface DocumentState {
  // OCR result (Layer 1 — instant, on-device)
  ocrText: string;
  detectedLanguage: 'ja' | 'zh' | 'en' | 'unknown';

  // AI explanation (Layer 2 — Gemini API)
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
