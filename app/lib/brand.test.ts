import {describe, expect, it} from 'vitest';
import {organizationJsonLd, pageTitle, resolveBrandUrl} from '~/lib/brand';

describe('brand', () => {
  it('builds page titles', () => {
    expect(pageTitle()).toContain('Lumen Atelier');
    expect(pageTitle('Cart')).toBe('Cart | Lumen Atelier');
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
