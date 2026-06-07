export type ExperienceAnalyticsEvent =
  | '3d_orb_click'
  | '3d_scroll_depth'
  | '3d_fallback'
  | '3d_webgl_error'
  | '3d_pdp_viewer_open'
  | '3d_page_transition';

export type ExperienceAnalyticsPayload = {
  event: ExperienceAnalyticsEvent;
  handle?: string;
  depth?: number;
  reason?: string;
  from?: string;
  to?: string;
};

type PublishFn = (
  event: `custom_${string}`,
  payload: Record<string, unknown>,
) => void;

/**
 * Publish a custom 3D experience event via Hydrogen Analytics when available.
 * Falls back to a DOM CustomEvent for tests and local debugging.
 */
export function publishExperienceEvent(
  publish: unknown,
  payload: ExperienceAnalyticsPayload,
): void {
  const data = {
    ...payload,
    timestamp: Date.now(),
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  };

  if (typeof publish === 'function') {
    (publish as PublishFn)('custom_3d_experience', data);
    return;
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('oneclick:3d-analytics', {detail: data}),
    );
  }
}

/** Map scroll progress 0–1 to decile buckets for analytics. */
export function scrollDepthBucket(progress: number): number {
  return Math.min(10, Math.max(0, Math.floor(progress * 10)));
}
