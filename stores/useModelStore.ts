import { create } from 'zustand';
import type { ModelVariant, ModelStatus } from '@/lib/llm/modelManager';

interface ModelState {
  status: ModelStatus;
  downloadProgress: number;
  isLoaded: boolean;
  variant: ModelVariant;

  setStatus: (status: ModelStatus) => void;
  setDownloadProgress: (progress: number) => void;
  setIsLoaded: (loaded: boolean) => void;
  setVariant: (variant: ModelVariant) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  status: 'not_downloaded',
  downloadProgress: 0,
  isLoaded: false,
  variant: 'standard',

  setStatus: (status) => set({ status }),
  setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  setVariant: (variant) => set({ variant }),
}));
