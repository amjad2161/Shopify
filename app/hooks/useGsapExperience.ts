import {useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';
import {useSceneStore} from '~/stores/useSceneStore';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ScrollProduct = {
  id: string;
  handle: string;
  title: string;
};

/**
 * Syncs scroll position with the global scene store for 3D choreography.
 */
export function useGsapExperience(products: ScrollProduct[]) {
  const rootRef = useRef<HTMLDivElement>(null);
  const setScrollProgress = useSceneStore((s) => s.setScrollProgress);
  const setActiveIndex = useSceneStore((s) => s.setActiveIndex);
  const setFocus = useSceneStore((s) => s.setFocus);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const productCount = products.length;

  useGSAP(
    () => {
      if (!rootRef.current || reducedMotion || productCount === 0) return;

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.45,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
          const index = Math.min(
            productCount - 1,
            Math.floor(self.progress * productCount),
          );
          setActiveIndex(index);
          const product = products[index];
          if (product) {
            setFocus({
              id: product.id,
              handle: product.handle,
              title: product.title,
            });
          }
        },
      });
    },
    {scope: rootRef, dependencies: [productCount, products, reducedMotion]},
  );

  return rootRef;
}
