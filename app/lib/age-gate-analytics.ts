export type AgeGateAnalyticsEvent = 'age_gate_view' | 'age_gate_confirm';

export type AgeGateAnalyticsPayload = {
  event: AgeGateAnalyticsEvent;
  returnTo?: string;
};

type PublishFn = (
  event: `custom_${string}`,
  payload: Record<string, unknown>,
) => void;

/** Publish age-gate funnel events via Hydrogen Analytics when available. */
export function publishAgeGateEvent(
  publish: unknown,
  payload: AgeGateAnalyticsPayload,
): void {
  const data = {
    ...payload,
    timestamp: Date.now(),
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  };

  if (typeof publish === 'function') {
    (publish as PublishFn)('custom_age_gate', data);
    return;
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('oneclick:age-gate-analytics', {detail: data}),
    );
  }
}
