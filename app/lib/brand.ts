import {isPlaceholder, isValidStoreDomain, normalizeStoreDomain} from '~/lib/store-env';

export const BRAND = {
  name: 'Lumen Atelier',
  tagline: 'Objects of light, craft, and quiet luxury.',
  description:
    'A curated house of design-led goods — timeless materials, intentional silhouettes, and pieces made to live beautifully every day.',
  announcement: 'New arrivals and studio notes — explore the collection.',
} as const;

type BrandEnv = {
  PUBLIC_BRAND_URL?: string;
  PUBLIC_STORE_DOMAIN?: string;
};

/**
 * Canonical public site URL for SEO and JSON-LD.
 * Prefer PUBLIC_BRAND_URL; otherwise derive from the linked myshopify.com domain.
 */
export function resolveBrandUrl(env: BrandEnv) {
  const explicit = env.PUBLIC_BRAND_URL?.trim();
  if (explicit && !isPlaceholder(explicit)) {
    return explicit.replace(/\/$/, '');
  }

  const storeDomain = env.PUBLIC_STORE_DOMAIN?.trim();
  if (storeDomain && isValidStoreDomain(storeDomain)) {
    return `https://${normalizeStoreDomain(storeDomain)}`;
  }

  return undefined;
}

/** Page title for document head — e.g. "Gray Runners | Lumen Atelier" */
export function pageTitle(page?: string) {
  return page ? `${page} | ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline}`;
}

/** JSON-LD Organization schema for SEO */
export function organizationJsonLd(siteUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    description: BRAND.description,
    ...(siteUrl ? {url: siteUrl} : {}),
    slogan: BRAND.tagline,
  };
}
