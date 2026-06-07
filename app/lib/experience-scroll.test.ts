import {describe, expect, it, vi} from 'vitest';
import {
  cameraPositionForScroll,
  scrollProgressFromElement,
  staticOrbTransform,
  syncScrollToScene,
} from '~/lib/experience-scroll';

const products = [
  {id: '1', handle: 'alpha', title: 'Alpha'},
  {id: '2', handle: 'beta', title: 'Beta'},
  {id: '3', handle: 'gamma', title: 'Gamma'},
];

describe('scrollProgressFromElement', () => {
  it('returns 0 before the section scrolls', () => {
    const el = {
      offsetHeight: 2000,
      getBoundingClientRect: () => ({top: 0}),
    } as HTMLElement;

    expect(scrollProgressFromElement(el, 800)).toBe(0);
  });

  it('returns 1 after the section fully scrolls', () => {
    const el = {
      offsetHeight: 2000,
      getBoundingClientRect: () => ({top: -1200}),
    } as HTMLElement;

    expect(scrollProgressFromElement(el, 800)).toBe(1);
  });

  it('returns 0 when the section is shorter than the viewport', () => {
    const el = {
      offsetHeight: 400,
      getBoundingClientRect: () => ({top: -100}),
    } as HTMLElement;

    expect(scrollProgressFromElement(el, 800)).toBe(0);
  });
});

describe('syncScrollToScene', () => {
  it('updates store setters from scroll progress', () => {
    const setScrollProgress = vi.fn();
    const setActiveIndex = vi.fn();
    const setFocus = vi.fn();

    syncScrollToScene(0.55, products, {
      setScrollProgress,
      setActiveIndex,
      setFocus,
    });

    expect(setScrollProgress).toHaveBeenCalledWith(0.55);
    expect(setActiveIndex).toHaveBeenCalledWith(1);
    expect(setFocus).toHaveBeenCalledWith(products[1]);
  });

  it('clamps progress and focuses the last product at 100%', () => {
    const setScrollProgress = vi.fn();
    const setActiveIndex = vi.fn();
    const setFocus = vi.fn();

    syncScrollToScene(1.2, products, {
      setScrollProgress,
      setActiveIndex,
      setFocus,
    });

    expect(setScrollProgress).toHaveBeenCalledWith(1);
    expect(setActiveIndex).toHaveBeenCalledWith(2);
    expect(setFocus).toHaveBeenCalledWith(products[2]);
  });

  it('no-ops when there are no products', () => {
    const setScrollProgress = vi.fn();
    const setActiveIndex = vi.fn();
    const setFocus = vi.fn();

    syncScrollToScene(0.5, [], {
      setScrollProgress,
      setActiveIndex,
      setFocus,
    });

    expect(setScrollProgress).not.toHaveBeenCalled();
    expect(setActiveIndex).not.toHaveBeenCalled();
    expect(setFocus).not.toHaveBeenCalled();
  });
});

describe('cameraPositionForScroll', () => {
  it('moves the camera toward the scroll target', () => {
    const start = cameraPositionForScroll(0, 0);
    const end = cameraPositionForScroll(1, 0);

    expect(end.position[2]).toBeLessThan(start.position[2]);
    expect(end.lookAt).toEqual([0, 0.1, -0.6]);
  });
});

describe('staticOrbTransform', () => {
  it('derives pose from scroll without time', () => {
    const idle = staticOrbTransform(1, 0.25, false, false);
    const active = staticOrbTransform(1, 0.25, true, false);

    expect(idle.rotationY).toBeCloseTo(0.4 + 0.25 * Math.PI);
    expect(active.scale).toBeGreaterThan(idle.scale);
  });
});
