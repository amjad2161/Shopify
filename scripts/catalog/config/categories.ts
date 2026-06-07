import type {CatalogVertical} from '../types.ts';

/**
 * Commerce vertical taxonomy — high-demand, search-trending categories.
 * Collections are created/updated in Shopify Admin by `catalog:sync`.
 *
 * Adult / lingerie verticals require Shopify Markets compliance and age gates
 * in the storefront before publishing live traffic.
 */
export const CATALOG_VERTICALS: CatalogVertical[] = [
  {
    id: 'trending',
    handle: 'trending-now',
    title: {
      en: 'Trending Now',
      fr: 'Tendances du moment',
      he: 'טרנדי עכשיו',
    },
    description:
      'High-velocity, search-trending products across beauty, tech, apparel, and lifestyle.',
    ageRestricted: false,
    trendingScore: 100,
    seoKeywords: [
      'trending products 2026',
      'viral products',
      'best sellers online',
      'tiktok made me buy it',
    ],
    supplierPlatforms: ['csv_feed', 'generic_api', 'cj_dropshipping', 'spocket'],
    fulfillmentMode: 'source_seller',
    marginPercent: 45,
    minProducts: 12,
  },
  {
    id: 'beauty-grooming',
    handle: 'beauty-grooming',
    title: {
      en: 'Beauty & Grooming',
      fr: 'Beauté et soins',
      he: 'טיפוח ויופי',
    },
    description:
      'Skincare, haircare, grooming tools, and personal care with strong repeat purchase demand.',
    ageRestricted: false,
    trendingScore: 92,
    seoKeywords: [
      'skincare routine',
      'hair growth serum',
      'grooming kit men',
      'k-beauty',
      'clean beauty',
    ],
    supplierPlatforms: ['csv_feed', 'cj_dropshipping', 'spocket', 'printful'],
    fulfillmentMode: 'source_seller',
    marginPercent: 50,
    minProducts: 20,
  },
  {
    id: 'women',
    handle: 'women',
    title: {en: 'Women', fr: 'Femmes', he: 'לנשים'},
    description:
      'Women’s fashion, accessories, and lifestyle products with high conversion intent.',
    ageRestricted: false,
    trendingScore: 90,
    seoKeywords: [
      'women fashion',
      'women accessories',
      'modest wear',
      'office wear women',
    ],
    supplierPlatforms: ['csv_feed', 'generic_api', 'spocket', 'etsy'],
    fulfillmentMode: 'source_seller',
    marginPercent: 48,
    minProducts: 24,
  },
  {
    id: 'technology',
    handle: 'technology',
    title: {en: 'Technology', fr: 'Technologie', he: 'טכנולוגיה'},
    description:
      'Gadgets, phone accessories, smart home, and consumer electronics with search volume.',
    ageRestricted: false,
    trendingScore: 88,
    seoKeywords: [
      'tech gadgets',
      'phone accessories',
      'smart home devices',
      'wireless earbuds',
    ],
    supplierPlatforms: ['csv_feed', 'generic_api', 'aliexpress', 'amazon'],
    fulfillmentMode: 'source_seller',
    marginPercent: 35,
    minProducts: 20,
  },
  {
    id: 'gaming',
    handle: 'gaming',
    title: {en: 'Gaming', fr: 'Jeux', he: 'משחקים'},
    description:
      'Gaming peripherals, collectibles, and accessories for PC and console players.',
    ageRestricted: false,
    trendingScore: 86,
    seoKeywords: [
      'gaming chair',
      'mechanical keyboard',
      'gaming headset',
      'retro handheld',
    ],
    supplierPlatforms: ['csv_feed', 'generic_api', 'aliexpress', 'ebay'],
    fulfillmentMode: 'source_seller',
    marginPercent: 40,
    minProducts: 16,
  },
  {
    id: 'baby',
    handle: 'baby',
    title: {en: 'Baby', fr: 'Bébé', he: 'תינוקות'},
    description:
      'Baby gear, nursery essentials, and parent-trusted products with safety-first sourcing.',
    ageRestricted: false,
    trendingScore: 84,
    seoKeywords: [
      'baby essentials',
      'newborn must haves',
      'baby monitor',
      'stroller accessories',
    ],
    supplierPlatforms: ['csv_feed', 'spocket', 'amazon', 'etsy'],
    fulfillmentMode: 'source_seller',
    marginPercent: 42,
    minProducts: 18,
  },
  {
    id: 'kids',
    handle: 'kids',
    title: {en: 'Kids', fr: 'Enfants', he: 'ילדים'},
    description:
      'Kids clothing, toys, school gear, and age-appropriate trending items.',
    ageRestricted: false,
    trendingScore: 82,
    seoKeywords: [
      'kids toys trending',
      'school backpack',
      'kids clothing sets',
      'educational toys',
    ],
    supplierPlatforms: ['csv_feed', 'spocket', 'etsy', 'temu'],
    fulfillmentMode: 'source_seller',
    marginPercent: 44,
    minProducts: 20,
  },
  {
    id: 'apparel',
    handle: 'apparel',
    title: {en: 'Apparel', fr: 'Vêtements', he: 'בגדים'},
    description:
      'Everyday and statement apparel across men, women, and unisex — seasonless basics and trend pieces.',
    ageRestricted: false,
    trendingScore: 80,
    seoKeywords: [
      'streetwear',
      'oversized hoodie',
      'linen shirt',
      'athleisure',
    ],
    supplierPlatforms: ['csv_feed', 'printful', 'spocket', 'temu'],
    fulfillmentMode: 'source_seller',
    marginPercent: 55,
    minProducts: 30,
  },
  {
    id: 'underwear',
    handle: 'underwear',
    title: {
      en: 'Underwear & Basics',
      fr: 'Sous-vêtements',
      he: 'הלבשה תחתונה',
    },
    description:
      'Comfort-first underwear and base layers for all genders — high repeat purchase category.',
    parentId: 'apparel',
    ageRestricted: false,
    trendingScore: 78,
    seoKeywords: [
      'cotton underwear pack',
      'seamless underwear',
      'boxer briefs',
      'bralette',
    ],
    supplierPlatforms: ['csv_feed', 'printful', 'spocket'],
    fulfillmentMode: 'source_seller',
    marginPercent: 60,
    minProducts: 16,
  },
  {
    id: 'lingerie-adult',
    handle: 'lingerie-intimates',
    title: {
      en: 'Lingerie & Intimates',
      fr: 'Lingerie',
      he: 'הלבשה תחתונה סקסית',
    },
    description:
      'Fashion-forward intimates and lingerie. Age verification and market compliance required.',
    parentId: 'underwear',
    ageRestricted: true,
    trendingScore: 76,
    seoKeywords: [
      'lace lingerie set',
      'bodysuit',
      'silk slip dress',
    ],
    supplierPlatforms: ['csv_feed', 'spocket'],
    fulfillmentMode: 'source_seller',
    marginPercent: 65,
    minProducts: 12,
  },
  {
    id: 'adults-only',
    handle: 'adults-only',
    title: {
      en: 'Adults Only (18+)',
      fr: 'Adultes uniquement (18+)',
      he: 'מבוגרים בלבד (18+)',
    },
    description:
      'Age-restricted catalog segment. Must comply with Shopify Acceptable Use Policy and local law.',
    ageRestricted: true,
    trendingScore: 70,
    seoKeywords: ['adults only collection'],
    supplierPlatforms: ['csv_feed'],
    fulfillmentMode: 'source_seller',
    marginPercent: 70,
    minProducts: 0,
  },
  {
    id: 'home-living',
    handle: 'home-living',
    title: {
      en: 'Home & Living',
      fr: 'Maison',
      he: 'בית ומגורים',
    },
    description:
      'Decor, organization, kitchen, and comfort products with evergreen demand.',
    ageRestricted: false,
    trendingScore: 74,
    seoKeywords: [
      'home decor aesthetic',
      'kitchen gadgets',
      'storage organization',
    ],
    supplierPlatforms: ['csv_feed', 'cj_dropshipping', 'amazon', 'temu'],
    fulfillmentMode: 'source_seller',
    marginPercent: 48,
    minProducts: 20,
  },
  {
    id: 'fitness-wellness',
    handle: 'fitness-wellness',
    title: {
      en: 'Fitness & Wellness',
      fr: 'Fitness et bien-être',
      he: 'כושר ובריאות',
    },
    description:
      'Workout gear, recovery tools, and wellness accessories riding health trends.',
    ageRestricted: false,
    trendingScore: 72,
    seoKeywords: [
      'resistance bands',
      'yoga mat thick',
      'massage gun',
      'protein shaker',
    ],
    supplierPlatforms: ['csv_feed', 'cj_dropshipping', 'amazon'],
    fulfillmentMode: 'source_seller',
    marginPercent: 45,
    minProducts: 16,
  },
];

export function getVerticalByHandle(handle: string) {
  return CATALOG_VERTICALS.find((v) => v.handle === handle);
}

export function getVerticalsByTrending(minScore = 0) {
  return [...CATALOG_VERTICALS]
    .filter((v) => v.trendingScore >= minScore)
    .sort((a, b) => b.trendingScore - a.trendingScore);
}

export function getAgeRestrictedVerticals() {
  return CATALOG_VERTICALS.filter((v) => v.ageRestricted);
}

export function allCollectionHandles() {
  return CATALOG_VERTICALS.map((v) => v.handle);
}
