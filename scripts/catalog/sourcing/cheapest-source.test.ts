import {describe, expect, it} from 'vitest';
import {
  isCheapestSourceOnly,
  minProfitPercent,
  pickCheapestPerFingerprint,
} from './cheapest-source.ts';
import type {CatalogEnv, SupplierProduct} from '../types.ts';

function product(
  platform: SupplierProduct['platform'],
  cost: string,
  price: string,
  sku = 'shared-sku',
): SupplierProduct {
  return {
    externalId: `${platform}-1`,
    platform,
    sellerId: `${platform}-seller`,
    title: 'Shared Product',
    tags: [],
    categoryHandles: ['technology'],
    sku,
    price,
    cost,
    currency: 'USD',
    inventoryQuantity: 10,
    imageUrls: [],
  };
}

describe('pickCheapestPerFingerprint', () => {
  it('keeps cheapest landed cost per SKU', () => {
    const winners = pickCheapestPerFingerprint([
      product('csv_feed', '20', '35'),
      product('aliexpress', '12', '28'),
      product('temu', '15', '30'),
    ]);

    expect(winners).toHaveLength(1);
    expect(winners[0].platform).toBe('aliexpress');
    expect(winners[0].rejectedSources).toBe(2);
    expect(winners[0].alternateSources?.length).toBe(2);
  });
});

describe('catalog env flags', () => {
  it('defaults cheapest-source-only to true', () => {
    expect(isCheapestSourceOnly({})).toBe(true);
    expect(isCheapestSourceOnly({CATALOG_CHEAPEST_SOURCE_ONLY: '0'})).toBe(
      false,
    );
  });

  it('uses vertical margin when min profit unset', () => {
    const env: CatalogEnv = {};
    expect(minProfitPercent(env, 45)).toBe(45);
    expect(minProfitPercent({CATALOG_MIN_PROFIT_PERCENT: '30'}, 45)).toBe(30);
  });
});
