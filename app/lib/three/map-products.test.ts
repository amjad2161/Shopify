import {describe, expect, it} from 'vitest';
import {mapProductsToScene} from '~/lib/three/map-products';

describe('mapProductsToScene', () => {
  it('maps storefront products into scene orbs', () => {
    const scene = mapProductsToScene([
      {
        id: 'gid://shopify/Product/1',
        handle: 'orb-lamp',
        title: 'Orb Lamp',
        featuredImage: {url: 'https://cdn.shopify.com/lamp.jpg'},
        priceRange: {minVariantPrice: {amount: '129.00', currencyCode: 'USD'}},
      },
    ]);

    expect(scene).toHaveLength(1);
    expect(scene[0]?.handle).toBe('orb-lamp');
    expect(scene[0]?.imageUrl).toContain('lamp.jpg');
    expect(scene[0]?.priceLabel).toContain('USD');
    expect(scene[0]?.position).toHaveLength(3);
    expect(scene[0]?.hue).toBeGreaterThanOrEqual(0);
  });

  it('caps at eight products for performance', () => {
    const products = Array.from({length: 12}, (_, i) => ({
      id: `gid://${i}`,
      handle: `product-${i}`,
      title: `Product ${i}`,
    }));
    expect(mapProductsToScene(products)).toHaveLength(8);
  });
});
