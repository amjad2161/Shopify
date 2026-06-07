import {useEffect} from 'react';
import {useSceneStore} from '~/stores/useSceneStore';

export function useDevice3dProfile() {
  const setReducedMotion = useSceneStore((s) => s.setReducedMotion);
  const setIsMobile = useSceneStore((s) => s.setIsMobile);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 768px), (pointer: coarse)');

    const apply = () => {
      setReducedMotion(motion.matches);
      setIsMobile(mobile.matches);
    };

    apply();
    motion.addEventListener('change', apply);
    mobile.addEventListener('change', apply);

    return () => {
      motion.removeEventListener('change', apply);
      mobile.removeEventListener('change', apply);
    };
  }, [setIsMobile, setReducedMotion]);
}

export function useCanvasDpr() {
  const isMobile = useSceneStore((s) => s.isMobile);
  return isMobile ? ([1, 1.25] as [number, number]) : ([1, 1.75] as [number, number]);
}
