import { create } from 'zustand';
import { SceneDescription } from '@/lib/ai/sceneDescriber';

interface SceneState {
  currentScene: SceneDescription | null;
  isLoading: boolean;
  setCurrentScene: (scene: SceneDescription | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  currentScene: null,
  isLoading: false,
  setCurrentScene: (scene) => set({ currentScene: scene }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
