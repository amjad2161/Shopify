import {describe, expect, it} from 'vitest';
import {
  isLocaleExemptPath,
  localizePath,
  parseLocaleFromPathname,
  stripLocalePrefix,
} from './paths';

describe('parseLocaleFromPathname', () => {
  it('reads locale from prefixed paths', () => {
    expect(parseLocaleFromPathname('/FR-CA/collections')).toBe('FR-CA');
    expect(parseLocaleFromPathname('/HE-IL')).toBe('HE-IL');
  });

  it('returns undefined without a locale segment', () => {
    expect(parseLocaleFromPathname('/collections')).toBeUndefined();
  });
});

describe('stripLocalePrefix', () => {
  it('removes locale segments', () => {
    expect(stripLocalePrefix('/EN-CA/account/orders')).toBe('/account/orders');
    expect(stripLocalePrefix('/HE-IL')).toBe('/');
  });
});

describe('localizePath', () => {
  it('prefixes internal paths', () => {
    expect(localizePath('/cart', 'FR-CA')).toBe('/FR-CA/cart');
    expect(localizePath('/', 'HE-IL')).toBe('/HE-IL');
  });

  it('preserves query strings', () => {
    expect(localizePath('/products/handle?variant=1', 'EN-US')).toBe(
      '/EN-US/products/handle?variant=1',
    );
  });

  it('leaves already-localized paths unchanged', () => {
    expect(localizePath('/FR-CA/search', 'EN-US')).toBe('/FR-CA/search');
  });
});

describe('isLocaleExemptPath', () => {
  it('marks auth and SEO paths as exempt', () => {
    expect(isLocaleExemptPath('/account/login')).toBe(true);
    expect(isLocaleExemptPath('/robots.txt')).toBe(true);
    expect(isLocaleExemptPath('/EN-US/cart')).toBe(false);
  });
});
