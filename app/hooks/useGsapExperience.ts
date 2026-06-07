import {useCallback, useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';
import {
  scrollProgressForIndex,
  scrollProgressFromElement,
  scrollRootToProgress,
  syncScrollToScene,
  type ScrollProduct,
} from '~/lib/experience-scroll';
import {useSceneStore} from '~/stores/useSceneStore';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type {ScrollProduct};

/**
 * Syncs scroll position with the global scene store for 3D choreography.
 * Uses GSAP ScrollTrigger by default; falls back to native scroll when motion is reduced.
 */
export function useGsapExperience(products: ScrollProduct[]) {
  const rootRef = useRef<HTMLDivElement>(null);
  const setScrollProgress = useSceneStore((s) => s.setScrollProgress);
  const setActiveIndex = useSceneStore((s) => s.setActiveIndex);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const productCount = products.length;

  useGSAP(
    () => {
      if (!rootRef.current || reducedMotion || productCount === 0) return;

      const setters = {setScrollProgress, setActiveIndex};

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.45,
        onUpdate: (self) => {
          syncScrollToScene(self.progress, products, setters);
        },
      });
    },
    {scope: rootRef, dependencies: [productCount, products, reducedMotion]},
  );

  useEffect(() => {
    if (!reducedMotion || productCount === 0) return;

    const setters = {setScrollProgress, setActiveIndex};

    const tick = () => {
      const root = rootRef.current;
      if (!root) return;
      syncScrollToScene(scrollProgressFromElement(root), products, setters);
    };

    tick();
    window.addEventListener('scroll', tick, {passive: true});
    window.addEventListener('resize', tick);

    return () => {
      window.removeEventListener('scroll', tick);
      window.removeEventListener('resize', tick);
    };
  }, [
    productCount,
    products,
    reducedMotion,
    setActiveIndex,
    setScrollProgress,
  ]);

  const focusAtIndex = useCallback(
    (index: number) => {
      const root = rootRef.current;
      if (!root || productCount === 0) return;

      const progress = scrollProgressForIndex(index, productCount);
      const behavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';
      scrollRootToProgress(root, progress, behavior);

      if (reducedMotion) {
        syncScrollToScene(progress, products, {
          setScrollProgress,
          setActiveIndex,
        });
      }
    },
    [
      productCount,
      products,
      reducedMotion,
      setActiveIndex,
      setScrollProgress,
    ],
  );

  return {scrollRef: rootRef, focusAtIndex};
}
