import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  isLoaded: boolean;
  completeOnboarding: () => void;
  loadOnboardingState: () => Promise<void>;
}

const STORAGE_KEY = 'yomitomo_onboarding_complete';

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: false,
  isLoaded: false,
  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    set({ hasSeenOnboarding: true });
  },
  loadOnboardingState: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      set({ hasSeenOnboarding: value === 'true', isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
}));
