import {describe, expect, it, vi} from 'vitest';
import {
  AGE_GATE_TAG,
  AGE_RESTRICTED_COLLECTION_HANDLES,
  AGE_VERIFIED_AT_SESSION_KEY,
  AGE_VERIFIED_SESSION_KEY,
  AGE_VERIFICATION_TTL_MS,
  cartRequiresAgeGate,
  collectionRequiresAgeGate,
  isAgeVerified,
  markAgeVerified,
  productRequiresAgeGate,
  searchTermRequiresAgeGate,
} from '~/lib/age-gate';

describe('age-gate', () => {
  it('detects the age gate product tag', () => {
    expect(productRequiresAgeGate(['age-18-plus'])).toBe(true);
    expect(productRequiresAgeGate(['AGE-18-PLUS'])).toBe(true);
    expect(productRequiresAgeGate(['featured'])).toBe(false);
    expect(productRequiresAgeGate(null)).toBe(false);
    expect(productRequiresAgeGate([])).toBe(false);
  });

  it('flags restricted collection handles', () => {
    for (const handle of AGE_RESTRICTED_COLLECTION_HANDLES) {
      expect(collectionRequiresAgeGate(handle)).toBe(true);
    }
    expect(collectionRequiresAgeGate('summer-sale')).toBe(false);
    expect(collectionRequiresAgeGate(null)).toBe(false);
  });

  it('flags restricted search terms', () => {
    expect(searchTermRequiresAgeGate('tag:age-18-plus')).toBe(true);
    expect(searchTermRequiresAgeGate('adults-only')).toBe(true);
    expect(searchTermRequiresAgeGate('dress')).toBe(false);
    expect(searchTermRequiresAgeGate('')).toBe(false);
  });

  it('flags carts with age-restricted products', () => {
    expect(
      cartRequiresAgeGate([
        {merchandise: {product: {tags: ['featured']}}},
        {merchandise: {product: {tags: ['age-18-plus']}}},
      ]),
    ).toBe(true);
    expect(
      cartRequiresAgeGate([{merchandise: {product: {tags: ['featured']}}}]),
    ).toBe(false);
    expect(cartRequiresAgeGate([])).toBe(false);
  });

  it('reads session verification state', () => {
    const session = {
      get: (key: string) =>
        key === AGE_VERIFIED_SESSION_KEY ? true : undefined,
    };
    expect(isAgeVerified(session)).toBe(true);
    expect(isAgeVerified({get: () => false})).toBe(false);
  });

  it('expires verification after TTL', () => {
    vi.useFakeTimers();
    const verifiedAt = Date.now();
    const session = {
      get: (key: string) => {
        if (key === AGE_VERIFIED_SESSION_KEY) return true;
        if (key === AGE_VERIFIED_AT_SESSION_KEY) return verifiedAt;
        return undefined;
      },
    };

    expect(isAgeVerified(session)).toBe(true);
    vi.advanceTimersByTime(AGE_VERIFICATION_TTL_MS + 1);
    expect(isAgeVerified(session)).toBe(false);
    vi.useRealTimers();
  });

  it('marks verification with timestamp', () => {
    vi.useFakeTimers();
    const now = Date.now();
    const sets: Record<string, unknown> = {};
    const session = {
      set: (key: string, value: unknown) => {
        sets[key] = value;
      },
    };

    markAgeVerified(session);
    expect(sets[AGE_VERIFIED_SESSION_KEY]).toBe(true);
    expect(sets[AGE_VERIFIED_AT_SESSION_KEY]).toBe(now);
    vi.useRealTimers();
  });

  it('exports the canonical tag constant', () => {
    expect(AGE_GATE_TAG).toBe('age-18-plus');
  });
});
