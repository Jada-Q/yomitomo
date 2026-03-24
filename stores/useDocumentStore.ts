import { create } from 'zustand';
import { DocumentReadingResult } from '@/lib/ai/documentReader';

interface DocumentEntry {
  id: string;
  result: DocumentReadingResult;
  imageUri: string;
  createdAt: number;
}

interface DocumentState {
  documents: DocumentEntry[];
  currentResult: DocumentReadingResult | null;
  isLoading: boolean;
  addDocument: (entry: DocumentEntry) => void;
  setCurrentResult: (result: DocumentReadingResult | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentResult: null,
  isLoading: false,
  addDocument: (entry) =>
    set((state) => ({
      documents: [entry, ...state.documents],
    })),
  setCurrentResult: (result) => set({ currentResult: result }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
