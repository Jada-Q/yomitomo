import { create } from 'zustand';

interface SettingsState {
  speechRate: number;
  setSpeechRate: (rate: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  speechRate: 0.9,
  setSpeechRate: (rate) => set({ speechRate: rate }),
}));
