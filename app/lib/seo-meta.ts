import type {MetaDescriptor} from 'react-router';
import {LOCALES, type LocaleDefinition} from '~/lib/i18n/config';
import {localizePath, stripLocalePrefix} from '~/lib/i18n/paths';

type CanonicalOptions = {
  brandUrl?: string;
  localePath: string;
  pathname: string;
};

/** Absolute canonical URL for a localized internal path. */
export function buildCanonicalUrl({
  brandUrl,
  localePath,
  pathname,
}: CanonicalOptions) {
  const localized = localizePath(pathname, localePath);
  if (brandUrl) return `${brandUrl.replace(/\/$/, '')}${localized}`;
  return localized;
}

export function canonicalLinkMeta(href: string): MetaDescriptor {
  return {tagName: 'link', rel: 'canonical', href};
}

/** hreflang alternates for all storefront locales sharing the same path. */
export function hreflangAlternateMetas(
  brandUrl: string | undefined,
  pathname: string,
): MetaDescriptor[] {
  const basePath = stripLocalePrefix(pathname.split('?')[0] ?? pathname);
  const metas: MetaDescriptor[] = [];

  for (const locale of LOCALES) {
    const href = buildCanonicalUrl({
      brandUrl,
      localePath: locale.path,
      pathname: basePath,
    });
    metas.push({
      tagName: 'link',
      rel: 'alternate',
      hrefLang: locale.intlTag.toLowerCase(),
      href,
    });
  }

  const defaultLocale = LOCALES[0] as LocaleDefinition;
  metas.push({
    tagName: 'link',
    rel: 'alternate',
    hrefLang: 'x-default',
    href: buildCanonicalUrl({
      brandUrl,
      localePath: defaultLocale.path,
      pathname: basePath,
    }),
  });

  return metas;
}

type CollectionJsonLdInput = {
  title: string;
  description?: string | null;
  handle: string;
};

export function collectionJsonLd(
  collection: CollectionJsonLdInput,
  collectionUrl: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.title,
    url: collectionUrl,
    ...(collection.description?.trim()
      ? {description: collection.description.trim()}
      : {}),
    mainEntity: {
      '@type': 'ItemList',
      name: collection.title,
      url: collectionUrl,
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{name: string; url?: string}>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? {item: item.url} : {}),
    })),
  };
}

type ArticleJsonLdInput = {
  title: string;
  description?: string | null;
  publishedAt: string;
  authorName?: string | null;
  imageUrl?: string | null;
};

export function articleJsonLd(
  article: ArticleJsonLdInput,
  articleUrl: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    url: articleUrl,
    datePublished: article.publishedAt,
    ...(article.description?.trim()
      ? {description: article.description.trim()}
      : {}),
    ...(article.imageUrl ? {image: article.imageUrl} : {}),
    ...(article.authorName
      ? {
          author: {
            '@type': 'Person',
            name: article.authorName,
          },
        }
      : {}),
  };
}
