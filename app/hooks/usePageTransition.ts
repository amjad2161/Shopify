import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router';
import {gsap} from 'gsap';
import {useAnalytics} from '@shopify/hydrogen';
import {publishExperienceEvent} from '~/lib/experience-analytics';

/** Subtle fade on route changes when 3D experience is enabled site-wide. */
export function usePageTransition(immersive3dEnabled: boolean) {
  const location = useLocation();
  const {publish} = useAnalytics();
  const mainRef = useRef<HTMLElement | null>(null);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main');
    if (!main) return;
    mainRef.current = main;
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main || !immersive3dEnabled) return;

    const from = prevPath.current;
    const to = location.pathname;
    if (from === to) return;

    prevPath.current = to;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    publishExperienceEvent(publish, {
      event: '3d_page_transition',
      from,
      to,
    });

    gsap.fromTo(
      main,
      {opacity: 0.72, y: 8},
      {opacity: 1, y: 0, duration: 0.45, ease: 'power2.out'},
    );
  }, [immersive3dEnabled, location.pathname, publish]);

  return mainRef;
}
