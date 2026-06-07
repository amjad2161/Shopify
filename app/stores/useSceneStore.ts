import {create} from 'zustand';

export type SceneProductFocus = {
  id: string;
  handle: string;
  title: string;
} | null;

type SceneState = {
  scrollProgress: number;
  activeIndex: number;
  focus: SceneProductFocus;
  reducedMotion: boolean;
  isMobile: boolean;
  setScrollProgress: (value: number) => void;
  setActiveIndex: (index: number) => void;
  setFocus: (focus: SceneProductFocus) => void;
  setReducedMotion: (value: boolean) => void;
  setIsMobile: (value: boolean) => void;
};

export const useSceneStore = create<SceneState>((set) => ({
  scrollProgress: 0,
  activeIndex: 0,
  focus: null,
  reducedMotion: false,
  isMobile: false,
  setScrollProgress: (scrollProgress) => set({scrollProgress}),
  setActiveIndex: (activeIndex) => set({activeIndex}),
  setFocus: (focus) => set({focus}),
  setReducedMotion: (reducedMotion) => set({reducedMotion}),
  setIsMobile: (isMobile) => set({isMobile}),
}));
