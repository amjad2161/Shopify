import {create} from 'zustand';

type SceneState = {
  scrollProgress: number;
  activeIndex: number;
  reducedMotion: boolean;
  isMobile: boolean;
  setScrollProgress: (value: number) => void;
  setActiveIndex: (index: number) => void;
  setReducedMotion: (value: boolean) => void;
  setIsMobile: (value: boolean) => void;
};

export const useSceneStore = create<SceneState>((set) => ({
  scrollProgress: 0,
  activeIndex: 0,
  reducedMotion: false,
  isMobile: false,
  setScrollProgress: (scrollProgress) => set({scrollProgress}),
  setActiveIndex: (activeIndex) => set({activeIndex}),
  setReducedMotion: (reducedMotion) => set({reducedMotion}),
  setIsMobile: (isMobile) => set({isMobile}),
}));
