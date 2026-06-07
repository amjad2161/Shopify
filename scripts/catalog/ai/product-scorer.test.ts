import {describe, expect, it} from 'vitest';
import {filterImportCandidates, scoreProducts} from './product-scorer.ts';
import type {AggregatedProduct, TrendSignal} from '../types.ts';

function aggregated(overrides: Partial<AggregatedProduct> = {}): AggregatedProduct {
  return {
    externalId: '1',
    platform: 'csv_feed',
    sellerId: 's1',
    title: 'Viral LED skincare mask trending beauty',
    tags: ['trending', 'bestseller'],
    categoryHandles: ['beauty-grooming'],
    sku: 'LED-1',
    price: '49.99',
    cost: '18',
    currency: 'USD',
    inventoryQuantity: 200,
    imageUrls: ['a.jpg', 'b.jpg', 'c.jpg'],
    fingerprint: 'sku:led-1',
    landedCost: 18,
    rejectedSources: 2,
    ...overrides,
  };
}

const signals: TrendSignal[] = [
  {
    keyword: 'beauty',
    score: 90,
    region: 'IL',
    source: 'vertical',
    detectedAt: new Date().toISOString(),
  },
  {
    keyword: 'skincare',
    score: 85,
    region: 'IL',
    source: 'ai',
    detectedAt: new Date().toISOString(),
  },
];

describe('scoreProducts', () => {
  it('scores high for trend + margin match', () => {
    const [scored] = scoreProducts({}, [aggregated()], signals);
    expect(scored.scores.composite).toBeGreaterThan(55);
    expect(scored.matchedTrends.length).toBeGreaterThan(0);
    expect(scored.promote).toBe(true);
  });

  it('filters and limits import candidates', () => {
    const batch = Array.from({length: 10}, (_, i) =>
      aggregated({
        externalId: String(i),
        sku: `SKU-${i}`,
        title: `Product ${i}`,
        tags: [],
      }),
    );
    const scored = scoreProducts({}, batch, signals);
    const filtered = filterImportCandidates(
      {CATALOG_MAX_IMPORT_PER_SYNC: '3'},
      scored,
    );
    expect(filtered.length).toBeLessThanOrEqual(3);
  });
});
