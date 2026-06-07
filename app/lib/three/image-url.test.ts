import {describe, expect, it} from 'vitest';
import {optimizeShopifyImageUrl} from '~/lib/three/image-url';

describe('optimizeShopifyImageUrl', () => {
  it('returns undefined for empty input', () => {
    expect(optimizeShopifyImageUrl(undefined)).toBeUndefined();
    expect(optimizeShopifyImageUrl(null)).toBeUndefined();
  });

  it('adds width and webp for Shopify CDN URLs', () => {
    const url = 'https://cdn.shopify.com/s/files/1/0001/0002/products/lamp.jpg';
    const optimized = optimizeShopifyImageUrl(url, 512);

    expect(optimized).toContain('width=512');
    expect(optimized).toContain('format=webp');
  });

  it('passes through non-Shopify URLs unchanged', () => {
    const url = 'https://example.com/image.jpg';
    expect(optimizeShopifyImageUrl(url, 256)).toBe(url);
  });
});
