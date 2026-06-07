import {describe, expect, it} from 'vitest';
import {scoutTrends} from './trend-scout.ts';
import type {AggregatedProduct} from '../types.ts';

describe('scoutTrends', () => {
  it('builds regional signals without AI', async () => {
    const result = await scoutTrends(
      {CATALOG_TARGET_COUNTRY: 'IL'},
      [
        {
          externalId: '1',
          platform: 'csv_feed',
          sellerId: 's',
          title: 'Gaming headset',
          tags: ['gaming', 'gaming'],
          categoryHandles: ['gaming'],
          sku: 'G1',
          price: '59',
          currency: 'USD',
          inventoryQuantity: 5,
          imageUrls: [],
          fingerprint: 'sku:g1',
          landedCost: 30,
          rejectedSources: 0,
        } satisfies AggregatedProduct,
      ],
    );

    expect(result.region).toBe('IL');
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.earlyTrendKeywords).toContain('gaming');
  });
});
