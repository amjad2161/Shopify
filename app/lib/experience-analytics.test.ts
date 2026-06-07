import {describe, expect, it, vi} from 'vitest';
import {
  publishExperienceEvent,
  scrollDepthBucket,
} from '~/lib/experience-analytics';

describe('scrollDepthBucket', () => {
  it('maps progress to deciles', () => {
    expect(scrollDepthBucket(0)).toBe(0);
    expect(scrollDepthBucket(0.09)).toBe(0);
    expect(scrollDepthBucket(0.1)).toBe(1);
    expect(scrollDepthBucket(0.95)).toBe(9);
    expect(scrollDepthBucket(1)).toBe(10);
    expect(scrollDepthBucket(1.5)).toBe(10);
  });
});

describe('publishExperienceEvent', () => {
  it('publishes via Hydrogen analytics when available', () => {
    const publish = vi.fn();
    publishExperienceEvent(publish, {event: '3d_orb_click', handle: 'orb-lamp'});

    expect(publish).toHaveBeenCalledWith(
      'custom_3d_experience',
      expect.objectContaining({
        event: '3d_orb_click',
        handle: 'orb-lamp',
      }),
    );
  });

  it('publishes focus events for single-click orb interaction', () => {
    const publish = vi.fn();
    publishExperienceEvent(publish, {event: '3d_orb_focus', handle: 'orb-lamp'});

    expect(publish).toHaveBeenCalledWith(
      'custom_3d_experience',
      expect.objectContaining({
        event: '3d_orb_focus',
        handle: 'orb-lamp',
      }),
    );
  });
});
