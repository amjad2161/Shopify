import {useEffect, useRef} from 'react';
import {useAnalytics} from '@shopify/hydrogen';
import {useSceneStore} from '~/stores/useSceneStore';
import {
  publishExperienceEvent,
  scrollDepthBucket,
} from '~/lib/experience-analytics';

/** Emit decile scroll-depth events while the user explores the 3D home. */
export function useExperienceAnalytics(enabled: boolean) {
  const {publish, shop, cart} = useAnalytics();
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const lastBucket = useRef(-1);

  useEffect(() => {
    if (!enabled) return;

    const bucket = scrollDepthBucket(scrollProgress);
    if (bucket === lastBucket.current) return;

    lastBucket.current = bucket;
    publishExperienceEvent(publish, {
      event: '3d_scroll_depth',
      depth: bucket,
    });
  }, [enabled, publish, scrollProgress, shop, cart]);
}
