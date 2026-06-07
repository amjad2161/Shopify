export type ScrollProduct = {
  id: string;
  handle: string;
  title: string;
};

export type ScrollSceneSetters = {
  setScrollProgress: (value: number) => void;
  setActiveIndex: (index: number) => void;
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

/** Scroll progress that centers the viewport on a product segment (0–1). */
export function scrollProgressForIndex(
  index: number,
  productCount: number,
): number {
  if (productCount <= 0) return 0;
  if (productCount === 1) return 0;
  const clamped = Math.min(productCount - 1, Math.max(0, index));
  return Math.min(1, (clamped + 0.5) / productCount);
}

/** Scroll the immersive root so ScrollTrigger progress matches `progress`. */
export function scrollRootToProgress(
  root: HTMLElement,
  progress: number,
  behavior: ScrollBehavior = 'smooth',
): void {
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 800;
  const scrollable = root.offsetHeight - viewportHeight;
  if (scrollable <= 0) return;

  const rootTop = root.getBoundingClientRect().top + window.scrollY;
  const clamped = Math.min(1, Math.max(0, progress));
  const target = rootTop + clamped * scrollable;

  window.scrollTo({top: target, behavior});
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
