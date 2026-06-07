import {isPlaceholder, isValidStoreDomain, normalizeStoreDomain} from '~/lib/store-env';

export const BRAND = {
  name: 'OneClick Hub',
  tagline: 'Discover. Tap. Own — premium goods in one immersive click.',
  description:
    'OneClick Hub is a design-led Shopify storefront with a cinematic 3D experience — curated products, instant checkout, and frictionless discovery.',
  announcement: 'New drops and limited picks — explore the 3D collection.',
} as const;

type BrandEnv = {
  PUBLIC_BRAND_URL?: string;
  PUBLIC_STORE_DOMAIN?: string;
  PUBLIC_BRAND_NAME?: string;
  PUBLIC_BRAND_TAGLINE?: string;
  PUBLIC_BRAND_DESCRIPTION?: string;
};

export type BrandConfig = {
  name: string;
  tagline: string;
  description: string;
  announcement: string;
};

/** Resolve display brand from optional PUBLIC_* overrides (server / loader). */
export function resolveBrand(env?: BrandEnv): BrandConfig {
  return {
    name: env?.PUBLIC_BRAND_NAME?.trim() || BRAND.name,
    tagline: env?.PUBLIC_BRAND_TAGLINE?.trim() || BRAND.tagline,
    description: env?.PUBLIC_BRAND_DESCRIPTION?.trim() || BRAND.description,
    announcement: BRAND.announcement,
  };
}

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
