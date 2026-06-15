import {describe, expect, it} from 'vitest';
import {productJsonLd} from '~/lib/product-json-ld';

describe('productJsonLd', () => {
  it('builds a product schema with offers', () => {
    const schema = productJsonLd(
      {
        title: 'Demo Lamp',
        description: 'A warm glow.',
        handle: 'demo-lamp',
        vendor: 'Lumen',
        selectedOrFirstAvailableVariant: {
          sku: 'SKU-1',
          availableForSale: true,
          image: {url: 'https://cdn.example.com/lamp.jpg'},
          price: {amount: '99.00', currencyCode: 'USD'},
        },
      },
      'https://shop.example.com/products/demo-lamp',
      'OneClick Hub',
    );

    expect(schema['@type']).toBe('Product');
    expect(schema.name).toBe('Demo Lamp');
    expect(schema.url).toBe('https://shop.example.com/products/demo-lamp');
    expect(schema.brand).toEqual({'@type': 'Brand', name: 'Lumen'});
    expect(schema.offers).toMatchObject({
      price: '99.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    });
  });

  it('falls back to brand name when vendor is missing', () => {
    const schema = productJsonLd(
      {title: 'Simple', handle: 'simple'},
      'https://shop.example.com/products/simple',
      'OneClick Hub',
    );

    expect(schema.brand).toEqual({
      '@type': 'Brand',
      name: 'OneClick Hub',
    });
    expect(schema).not.toHaveProperty('offers');
  });
});
