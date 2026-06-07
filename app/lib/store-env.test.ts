import {describe, expect, it} from 'vitest';
import {
  isMockDomain,
  isPlaceholder,
  isValidStoreDomain,
  normalizeStoreDomain,
  parseEnvFile,
  validateStoreEnvRecord,
} from '~/lib/store-env';

describe('store-env', () => {
  it('detects placeholder values', () => {
    expect(isPlaceholder('')).toBe(true);
    expect(isPlaceholder('replace-with-random-string')).toBe(true);
    expect(isPlaceholder('your-store.myshopify.com')).toBe(true);
    expect(isPlaceholder('a-real-secret-value-here')).toBe(false);
  });

  it('rejects mock.shop domains', () => {
    expect(isMockDomain('mock.shop')).toBe(true);
    expect(isMockDomain('hydrogen-preview.mock.shop')).toBe(true);
    expect(isMockDomain('lumen-atelier.myshopify.com')).toBe(false);
  });

  it('validates myshopify.com storefront domains', () => {
    expect(isValidStoreDomain('lumen-atelier.myshopify.com')).toBe(true);
    expect(isValidStoreDomain('https://lumen-atelier.myshopify.com/')).toBe(
      true,
    );
    expect(isValidStoreDomain('not-a-store.com')).toBe(false);
    expect(isValidStoreDomain('mock.shop')).toBe(false);
  });

  it('normalizes store domains', () => {
    expect(normalizeStoreDomain('HTTPS://Store.Myshopify.com/')).toBe(
      'store.myshopify.com',
    );
  });

  it('parses .env files', () => {
    const env = parseEnvFile(`
# comment
SESSION_SECRET=abc
PUBLIC_STORE_DOMAIN="shop.myshopify.com"
EMPTY=
`);
    expect(env.SESSION_SECRET).toBe('abc');
    expect(env.PUBLIC_STORE_DOMAIN).toBe('shop.myshopify.com');
    expect(env.EMPTY).toBe('');
  });

  it('returns null when env is valid', () => {
    const error = validateStoreEnvRecord({
      SESSION_SECRET: 'super-secret-session-key',
      PUBLIC_STORE_DOMAIN: 'lumen-atelier.myshopify.com',
      PUBLIC_STOREFRONT_API_TOKEN: '0123456789abcdef',
    });
    expect(error).toBeNull();
  });

  it('reports missing and invalid keys', () => {
    const error = validateStoreEnvRecord({
      SESSION_SECRET: 'replace-with-random-string',
      PUBLIC_STORE_DOMAIN: 'mock.shop',
      PUBLIC_STOREFRONT_API_TOKEN: 'short',
      PUBLIC_CHECKOUT_DOMAIN: 'checkout.mock.shop',
    });

    expect(error).not.toBeNull();
    expect(error?.missingKeys).toContain('SESSION_SECRET');
    expect(error?.invalidKeys.some((key) => key.includes('mock.shop'))).toBe(
      true,
    );
    expect(error?.invalidKeys.some((key) => key.includes('token'))).toBe(true);
  });
});
