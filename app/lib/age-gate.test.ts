import {describe, expect, it} from 'vitest';
import {
  AGE_GATE_TAG,
  AGE_VERIFIED_SESSION_KEY,
  isAgeVerified,
  productRequiresAgeGate,
} from '~/lib/age-gate';

describe('age-gate', () => {
  it('detects the age gate product tag', () => {
    expect(productRequiresAgeGate(['age-18-plus'])).toBe(true);
    expect(productRequiresAgeGate(['AGE-18-PLUS'])).toBe(true);
    expect(productRequiresAgeGate(['featured'])).toBe(false);
    expect(productRequiresAgeGate(null)).toBe(false);
    expect(productRequiresAgeGate([])).toBe(false);
  });

  it('reads session verification state', () => {
    const session = {
      get: (key: string) =>
        key === AGE_VERIFIED_SESSION_KEY ? true : undefined,
    };
    expect(isAgeVerified(session)).toBe(true);
    expect(
      isAgeVerified({get: () => false}),
    ).toBe(false);
  });

  it('exports the canonical tag constant', () => {
    expect(AGE_GATE_TAG).toBe('age-18-plus');
  });
});
