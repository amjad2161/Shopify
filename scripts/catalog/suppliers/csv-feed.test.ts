import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {csvFeedAdapter} from './csv-feed.ts';
import type {CatalogEnv} from '../types.ts';

const fixturePath = resolve(
  import.meta.dirname,
  '../feeds/example-products.csv',
);

describe('csv feed adapter', () => {
  const env: CatalogEnv = {
    CATALOG_SUPPLIER_CSV_PATH: fixturePath,
  };

  it('detects configured feed path', () => {
    expect(csvFeedAdapter.isConfigured(env)).toBe(true);
    expect(csvFeedAdapter.isConfigured({})).toBe(false);
  });

  it('parses products from example feed', async () => {
    const products = await csvFeedAdapter.fetchProducts({env, verticalHandles: []});
    expect(products.length).toBeGreaterThanOrEqual(8);
    expect(products[0].platform).toBe('csv_feed');
    expect(products[0].sellerId).toBeTruthy();
  });

  it('filters by vertical handle', async () => {
    const gaming = await csvFeedAdapter.fetchProducts({
      env,
      verticalHandles: ['gaming'],
    });
    expect(gaming.length).toBeGreaterThanOrEqual(1);
    expect(
      gaming.every((p) => p.categoryHandles.includes('gaming')),
    ).toBe(true);

    const baby = await csvFeedAdapter.fetchProducts({
      env,
      verticalHandles: ['baby'],
    });
    expect(baby.length).toBeGreaterThanOrEqual(1);
    expect(baby.every((p) => p.categoryHandles.includes('baby'))).toBe(true);
  });
});
