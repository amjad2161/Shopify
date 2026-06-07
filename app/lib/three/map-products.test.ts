import {describe, expect, it} from 'vitest';
import {
  isLowStock,
  mapProductsToScene,
  resolveProductModelUrl,
  sceneProductsWithModels,
} from '~/lib/three/map-products';

describe('isLowStock', () => {
  it('is true only for 1–5 units', () => {
    expect(isLowStock(0)).toBe(false);
    expect(isLowStock(1)).toBe(true);
    expect(isLowStock(5)).toBe(true);
    expect(isLowStock(6)).toBe(false);
    expect(isLowStock(null)).toBe(false);
    expect(isLowStock(undefined)).toBe(false);
  });
});

describe('resolveProductModelUrl', () => {
  it('reads GLB from media sources', () => {
    const url = resolveProductModelUrl({
      id: '1',
      handle: 'chair',
      title: 'Chair',
      media: {
        nodes: [
          {
            sources: [{url: 'https://cdn.shopify.com/chair.glb', format: 'glb'}],
          },
        ],
      },
    });

    expect(url).toContain('chair.glb');
  });

  it('falls back to custom metafield URL', () => {
    const url = resolveProductModelUrl({
      id: '1',
      handle: 'vase',
      title: 'Vase',
      model3dMetafield: {
        reference: {url: 'https://cdn.shopify.com/vase.glb'},
      },
    });

    expect(url).toBe('https://cdn.shopify.com/vase.glb');
  });
});

describe('mapProductsToScene', () => {
  it('maps storefront products into scene orbs', () => {
    const scene = mapProductsToScene([
      {
        id: 'gid://shopify/Product/1',
        handle: 'orb-lamp',
        title: 'Orb Lamp',
        featuredImage: {url: 'https://cdn.shopify.com/lamp.jpg'},
        priceRange: {minVariantPrice: {amount: '129.00', currencyCode: 'USD'}},
        totalInventory: 3,
      },
    ]);

    expect(scene).toHaveLength(1);
    expect(scene[0]?.handle).toBe('orb-lamp');
    expect(scene[0]?.imageUrl).toContain('width=512');
    expect(scene[0]?.imageUrl).toContain('format=webp');
    expect(scene[0]?.priceLabel).toContain('USD');
    expect(scene[0]?.totalInventory).toBe(3);
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

describe('sceneProductsWithModels', () => {
  it('filters products that have a model URL', () => {
    const scene = mapProductsToScene([
      {
        id: '1',
        handle: 'with-model',
        title: 'With model',
        media: {
          nodes: [
            {sources: [{url: 'https://cdn.shopify.com/a.glb', format: 'glb'}]},
          ],
        },
      },
      {id: '2', handle: 'no-model', title: 'No model'},
    ]);

    expect(sceneProductsWithModels(scene)).toHaveLength(1);
    expect(sceneProductsWithModels(scene)[0]?.handle).toBe('with-model');
  });
});
