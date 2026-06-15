import {useEffect} from 'react';
import {useSceneStore} from '~/stores/useSceneStore';

/**
 * Measures the announcement bar, sets --announcement-offset for fixed header,
 * and hides the bar after the user scrolls on immersive home.
 */
export function useAnnouncementOffset(immersiveHome: boolean) {
  const scrollProgress = useSceneStore((s) => s.scrollProgress);

  useEffect(() => {
    if (!immersiveHome) {
      document.documentElement.style.removeProperty('--announcement-offset');
      return;
    }

    const bar = document.querySelector<HTMLElement>('.announcement-bar');
    if (!bar) return;

    const syncOffset = () => {
      const height = bar.offsetHeight;
      document.documentElement.style.setProperty(
        '--announcement-offset',
        `${height}px`,
      );
    };

    syncOffset();

    const observer = new ResizeObserver(syncOffset);
    observer.observe(bar);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--announcement-offset');
    };
  }, [immersiveHome]);

  useEffect(() => {
    if (!immersiveHome) return;

    const bar = document.querySelector<HTMLElement>('.announcement-bar');
    if (!bar) return;

    const hidden = scrollProgress > 0.04;
    bar.classList.toggle('announcement-bar--hidden', hidden);
  }, [immersiveHome, scrollProgress]);
}
