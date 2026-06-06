export const BRAND = {
  name: 'Lumen Atelier',
  tagline: 'Objects of light, craft, and quiet luxury.',
  description:
    'A curated house of design-led goods — timeless materials, intentional silhouettes, and pieces made to live beautifully every day.',
  announcement: 'Complimentary shipping on orders over $150 — limited time.',
  url: 'https://lumen-atelier.com',
} as const;

/** Page title for document head — e.g. "Gray Runners | Lumen Atelier" */
export function pageTitle(page?: string) {
  return page ? `${page} | ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline}`;
}

/** JSON-LD Organization schema for SEO */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    description: BRAND.description,
    url: BRAND.url,
    slogan: BRAND.tagline,
  };
}
