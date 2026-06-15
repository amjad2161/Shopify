import {describe, expect, it} from 'vitest';
import {
  BRAND,
  organizationJsonLd,
  pageTitle,
  resolveBrand,
  resolveBrandUrl,
} from '~/lib/brand';

describe('brand', () => {
  it('builds page titles', () => {
    expect(pageTitle()).toContain(BRAND.name);
    expect(pageTitle('Cart')).toBe(`Cart | ${BRAND.name}`);
  });

  it('overrides brand from PUBLIC_* env', () => {
    expect(
      resolveBrand({
        PUBLIC_BRAND_NAME: 'Custom Store',
        PUBLIC_BRAND_TAGLINE: 'Custom tagline',
      }).name,
    ).toBe('Custom Store');
  });

  it('prefers PUBLIC_BRAND_URL for canonical URL', () => {
    expect(
      resolveBrandUrl({
        PUBLIC_BRAND_URL: 'https://lumenatelier.com/',
        PUBLIC_STORE_DOMAIN: 'shop.myshopify.com',
      }),
    ).toBe('https://lumenatelier.com');
  });

  it('derives brand URL from store domain', () => {
    expect(
      resolveBrandUrl({
        PUBLIC_STORE_DOMAIN: 'lumen-atelier.myshopify.com',
      }),
    ).toBe('https://lumen-atelier.myshopify.com');
  });

  it('omits url from JSON-LD when site URL is unknown', () => {
    expect(organizationJsonLd()).not.toHaveProperty('url');
    expect(organizationJsonLd('https://lumenatelier.com').url).toBe(
      'https://lumenatelier.com',
    );
  });
});
