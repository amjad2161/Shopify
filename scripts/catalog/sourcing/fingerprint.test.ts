import {describe, expect, it} from 'vitest';
import {normalizeTitle, productFingerprint} from './fingerprint.ts';
import type {SupplierProduct} from '../types.ts';

function sample(overrides: Partial<SupplierProduct> = {}): SupplierProduct {
  return {
    externalId: '1',
    platform: 'csv_feed',
    sellerId: 'seller-a',
    title: 'Wireless Earbuds Pro',
    tags: [],
    categoryHandles: ['technology'],
    sku: 'WB-100',
    price: '29.99',
    currency: 'USD',
    inventoryQuantity: 50,
    imageUrls: [],
    ...overrides,
  };
}

describe('productFingerprint', () => {
  it('prefers SKU when long enough', () => {
    const fp = productFingerprint(sample({sku: 'SKU-1234'}));
    expect(fp).toBe('sku:sku-1234');
  });

  it('dedupes same title across platforms via title key', () => {
    const a = productFingerprint(
      sample({platform: 'csv_feed', sku: '', title: 'LED Ring Light'}),
    );
    const b = productFingerprint(
      sample({
        platform: 'aliexpress',
        sku: '',
        title: 'LED Ring Light!!!',
      }),
    );
    expect(a).toBe(b);
  });

  it('normalizes punctuation in titles', () => {
    expect(normalizeTitle('Hello — World!!!')).toBe('hello world');
  });
});
