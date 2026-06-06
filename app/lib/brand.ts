export const BRAND = {
  name: 'Lumen Atelier',
  tagline: 'Objects of light, craft, and quiet luxury.',
  description:
    'A curated house of design-led goods — timeless materials, intentional silhouettes, and pieces made to live beautifully every day.',
} as const;

/** Page title for document head — e.g. "Gray Runners | Lumen Atelier" */
export function pageTitle(page?: string) {
  return page ? `${page} | ${BRAND.name}` : BRAND.name;
}
