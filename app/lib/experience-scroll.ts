export type ScrollProduct = {
  id: string;
  handle: string;
  title: string;
};

export type ScrollSceneSetters = {
  setScrollProgress: (value: number) => void;
  setActiveIndex: (index: number) => void;
  setFocus: (focus: ScrollProduct | null) => void;
};

const BASE_CAMERA: [number, number, number] = [0, 0.4, 7.5];
const SCROLL_CAMERA: [number, number, number] = [0.35, 0.85, 5.8];
const CAMERA_LOOK_AT: [number, number, number] = [0, 0.1, -0.6];

/**
 * Mirrors GSAP ScrollTrigger progress for `start: top top` / `end: bottom bottom`.
 */
export function scrollProgressFromElement(
  element: HTMLElement,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800,
): number {
  const scrollable = element.offsetHeight - viewportHeight;
  if (scrollable <= 0) return 0;

  const scrolled = Math.max(0, -element.getBoundingClientRect().top);
  return Math.min(1, scrolled / scrollable);
}

/** Keep scene store in sync with scroll position (GSAP or native scroll). */
export function syncScrollToScene(
  progress: number,
  products: ScrollProduct[],
  setters: ScrollSceneSetters,
): void {
  const productCount = products.length;
  if (productCount === 0) return;

  const clamped = Math.min(1, Math.max(0, progress));
  setters.setScrollProgress(clamped);

  const index = Math.min(
    productCount - 1,
    Math.floor(clamped * productCount),
  );
  setters.setActiveIndex(index);

  const product = products[index];
  setters.setFocus(product ?? null);
}

export function cameraPositionForScroll(
  scrollProgress: number,
  activeIndex: number,
): {position: [number, number, number]; lookAt: [number, number, number]} {
  const t = scrollProgress;
  const orbit = activeIndex * 0.18;

  return {
    position: [
      BASE_CAMERA[0] +
        (SCROLL_CAMERA[0] - BASE_CAMERA[0]) * t +
        Math.sin(orbit) * 0.25,
      BASE_CAMERA[1] + (SCROLL_CAMERA[1] - BASE_CAMERA[1]) * t,
      BASE_CAMERA[2] + (SCROLL_CAMERA[2] - BASE_CAMERA[2]) * t,
    ],
    lookAt: CAMERA_LOOK_AT,
  };
}

/** Static orb / model pose when motion is reduced — no time-based animation. */
export function staticOrbTransform(
  index: number,
  scrollProgress: number,
  isActive: boolean,
  hovered: boolean,
): {rotationY: number; scale: number} {
  return {
    rotationY: index * 0.4 + scrollProgress * Math.PI,
    scale: isActive || hovered ? 1.12 : 1,
  };
}
