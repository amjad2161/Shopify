import {describe, expect, it} from 'vitest';
import {detectWebGLSupport} from '~/lib/three/webgl';

describe('detectWebGLSupport', () => {
  it('returns true on the server (SSR-safe default)', () => {
    expect(detectWebGLSupport()).toBe(true);
  });
});
