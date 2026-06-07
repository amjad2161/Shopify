import {describe, expect, it} from 'vitest';
import {isImmersive3dEnabled, isImmersiveHomePath} from '~/lib/experience';

describe('isImmersive3dEnabled', () => {
  it('is off by default', () => {
    expect(isImmersive3dEnabled({})).toBe(false);
    expect(isImmersive3dEnabled({PUBLIC_3D_EXPERIENCE: '0'})).toBe(false);
  });

  it('accepts truthy env values', () => {
    expect(isImmersive3dEnabled({PUBLIC_3D_EXPERIENCE: '1'})).toBe(true);
    expect(isImmersive3dEnabled({PUBLIC_3D_EXPERIENCE: 'true'})).toBe(true);
    expect(isImmersive3dEnabled({PUBLIC_3D_EXPERIENCE: 'yes'})).toBe(true);
  });
});

describe('isImmersiveHomePath', () => {
  it('matches locale roots and default home', () => {
    expect(isImmersiveHomePath('/')).toBe(true);
    expect(isImmersiveHomePath('/en')).toBe(true);
    expect(isImmersiveHomePath('/he/')).toBe(true);
    expect(isImmersiveHomePath('/en-US')).toBe(true);
  });

  it('rejects nested routes', () => {
    expect(isImmersiveHomePath('/products/foo')).toBe(false);
    expect(isImmersiveHomePath('/en/collections/all')).toBe(false);
  });
});
