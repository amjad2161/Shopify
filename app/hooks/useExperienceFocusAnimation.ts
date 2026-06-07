import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {useSceneStore} from '~/stores/useSceneStore';

/** Subtle reward animation when the active product focus changes. */
export function useExperienceFocusAnimation(activeIndex: number) {
  const panelRef = useRef<HTMLElement>(null);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || reducedMotion) return;

    gsap.fromTo(
      el,
      {opacity: 0.72, y: 14, scale: 0.98},
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      },
    );
  }, [activeIndex, reducedMotion]);

  return panelRef;
}
