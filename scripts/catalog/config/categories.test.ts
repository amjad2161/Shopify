import {describe, expect, it} from 'vitest';
import {
  CATALOG_VERTICALS,
  allCollectionHandles,
  getAgeRestrictedVerticals,
  getVerticalByHandle,
  getVerticalsByTrending,
} from './categories.ts';

describe('catalog categories', () => {
  it('defines all requested commerce verticals', () => {
    const handles = new Set(allCollectionHandles());
    const expected = [
      'trending-now',
      'beauty-grooming',
      'women',
      'technology',
      'gaming',
      'baby',
      'kids',
      'apparel',
      'underwear',
      'lingerie-intimates',
      'adults-only',
    ];
    for (const handle of expected) {
      expect(handles.has(handle)).toBe(true);
    }
  });

  it('sorts verticals by trending score descending', () => {
    const sorted = getVerticalsByTrending(0);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].trendingScore).toBeGreaterThanOrEqual(
        sorted[i].trendingScore,
      );
    }
  });

  it('marks lingerie and adults-only as age restricted', () => {
    const restricted = getAgeRestrictedVerticals().map((v) => v.handle);
    expect(restricted).toContain('lingerie-intimates');
    expect(restricted).toContain('adults-only');
  });

  it('defines expanded vertical catalog (20+ niches)', () => {
    expect(CATALOG_VERTICALS.length).toBeGreaterThanOrEqual(20);
    const handles = new Set(allCollectionHandles());
    for (const extra of [
      'jewelry',
      'pets',
      'outdoor-sports',
      'supplements',
      'eco-sustainable',
    ]) {
      expect(handles.has(extra)).toBe(true);
    }
  });

  it('assigns commerce modes to every vertical', () => {
    for (const vertical of CATALOG_VERTICALS) {
      expect(vertical.commerceModes.length).toBeGreaterThan(0);
    }
  });

  it('uses source_seller fulfillment for every vertical', () => {
    for (const vertical of CATALOG_VERTICALS) {
      expect(vertical.fulfillmentMode).toBe('source_seller');
      expect(vertical.supplierPlatforms.length).toBeGreaterThan(0);
    }
  });

  it('resolves vertical by handle', () => {
    const tech = getVerticalByHandle('technology');
    expect(tech?.id).toBe('technology');
    expect(tech?.title.en).toBe('Technology');
  });
});
