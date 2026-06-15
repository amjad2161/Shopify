import {describe, expect, it} from 'vitest';
import {
  breadcrumbJsonLd,
  buildCanonicalUrl,
  canonicalLinkMeta,
  collectionJsonLd,
  hreflangAlternateMetas,
  articleJsonLd,
} from '~/lib/seo-meta';

describe('seo-meta', () => {
  it('builds canonical URLs with brand host', () => {
    expect(
      buildCanonicalUrl({
        brandUrl: 'https://oneclick.example',
        localePath: 'FR-CA',
        pathname: '/collections/all',
      }),
    ).toBe('https://oneclick.example/FR-CA/collections/all');
  });

  it('returns canonical link meta', () => {
    expect(canonicalLinkMeta('https://x.test/p')).toEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://x.test/p',
    });
  });

  it('emits hreflang alternates including x-default', () => {
    const metas = hreflangAlternateMetas(
      'https://shop.test',
      '/collections/all',
    );
    const hrefLangs = metas
      .filter((m): m is {hrefLang: string} & typeof m => 'hrefLang' in m)
      .map((m) => m.hrefLang);
    expect(hrefLangs).toContain('x-default');
    expect(metas.length).toBeGreaterThan(1);
  });

  it('builds collection JSON-LD', () => {
    const schema = collectionJsonLd(
      {title: 'All', handle: 'all', description: 'Everything'},
      'https://shop.test/collections/all',
    );
    expect(schema['@type']).toBe('CollectionPage');
    expect(schema.name).toBe('All');
  });

  it('builds breadcrumb JSON-LD', () => {
    const schema = breadcrumbJsonLd([
      {name: 'Home', url: 'https://shop.test/'},
      {name: 'All'},
    ]);
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0]?.position).toBe(1);
  });

  it('builds article JSON-LD', () => {
    const schema = articleJsonLd(
      {
        title: 'Hello',
        description: 'Intro',
        publishedAt: '2026-01-01T00:00:00Z',
        authorName: 'Ada',
        imageUrl: 'https://shop.test/cover.jpg',
      },
      'https://shop.test/blogs/news/hello',
    );
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.headline).toBe('Hello');
    expect(schema.author?.name).toBe('Ada');
  });
});
