import {useEffect} from 'react';
import {useAnalytics} from '@shopify/hydrogen';

type VitalMetric = {
  name: string;
  value: number;
  rating?: string;
};

/**
 * Report Core Web Vitals to Hydrogen analytics when the browser supports them.
 */
export function useWebVitals(enabled: boolean, label: '3d' | 'classic' = 'classic') {
  const {publish} = useAnalytics();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let cancelled = false;

    void import('web-vitals')
      .then(({onCLS, onINP, onLCP, onFCP, onTTFB}) => {
        if (cancelled) return;

        const report = (metric: VitalMetric) => {
          publish?.('custom_web_vitals', {
            ...metric,
            experience: label,
            path: window.location.pathname,
          });
        };

        onCLS((m) => report({name: m.name, value: m.value, rating: m.rating}));
        onINP((m) => report({name: m.name, value: m.value, rating: m.rating}));
        onLCP((m) => report({name: m.name, value: m.value, rating: m.rating}));
        onFCP((m) => report({name: m.name, value: m.value, rating: m.rating}));
        onTTFB((m) => report({name: m.name, value: m.value, rating: m.rating}));
      })
      .catch(() => {
        // web-vitals is optional — skip silently when unavailable
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, label, publish]);
}
