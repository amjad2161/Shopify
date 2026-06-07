import type {CommerceModeId} from './commerce-modes.ts';
import type {CatalogVertical} from '../types.ts';

/** Default commerce models for high-velocity catalog verticals. */
export const DEFAULT_COMMERCE_MODES: CommerceModeId[] = [
  'dropshipping',
  'arbitrage',
  'cross_border',
  'white_label',
  'flash_sales',
  'marketplace',
  'affiliate',
  'preorder',
  'bundle_upsell',
  'print_on_demand',
  'standard_ecommerce',
];

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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
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
    commerceModes: DEFAULT_COMMERCE_MODES,
    fulfillmentMode: 'source_seller',
    marginPercent: 45,
    minProducts: 16,
  },
  {
    id: 'jewelry',
    handle: 'jewelry',
    title: {en: 'Jewelry & Watches', fr: 'Bijoux', he: 'תכשיטים ושעונים'},
    description:
      'Fashion jewelry, fine accessories, and watches with high AOV and gift demand.',
    ageRestricted: false,
    trendingScore: 71,
    seoKeywords: ['gold plated jewelry', 'minimalist necklace', 'smart watch band'],
    supplierPlatforms: ['csv_feed', 'aliexpress', 'etsy', 'dhgate'],
    commerceModes: DEFAULT_COMMERCE_MODES,
    fulfillmentMode: 'source_seller',
    marginPercent: 58,
    minProducts: 14,
  },
  {
    id: 'pets',
    handle: 'pets',
    title: {en: 'Pets', fr: 'Animaux', he: 'חיות מחמד'},
    description: 'Pet supplies, grooming, and accessories with loyal repeat buyers.',
    ageRestricted: false,
    trendingScore: 69,
    seoKeywords: ['dog accessories', 'cat tree', 'pet grooming kit'],
    supplierPlatforms: ['csv_feed', 'amazon', 'cj_dropshipping', 'walmart'],
    commerceModes: DEFAULT_COMMERCE_MODES,
    fulfillmentMode: 'source_seller',
    marginPercent: 46,
    minProducts: 16,
  },
  {
    id: 'outdoor-sports',
    handle: 'outdoor-sports',
    title: {en: 'Outdoor & Sports', fr: 'Plein air', he: 'ספורט וחוץ'},
    description: 'Camping, hiking, cycling, and seasonal outdoor gear.',
    ageRestricted: false,
    trendingScore: 68,
    seoKeywords: ['camping gear', 'hiking backpack', 'cycling accessories'],
    supplierPlatforms: ['csv_feed', 'amazon', 'aliexpress', 'walmart'],
    commerceModes: DEFAULT_COMMERCE_MODES,
    fulfillmentMode: 'source_seller',
    marginPercent: 38,
    minProducts: 18,
  },
  {
    id: 'office-supplies',
    handle: 'office-supplies',
    title: {en: 'Office & Productivity', fr: 'Bureau', he: 'משרד ופרודוקטיביות'},
    description: 'Desk setup, stationery, and WFH essentials.',
    ageRestricted: false,
    trendingScore: 66,
    seoKeywords: ['desk organizer', 'ergonomic mouse', 'standing desk accessories'],
    supplierPlatforms: ['csv_feed', 'amazon', 'walmart', 'generic_api'],
    commerceModes: DEFAULT_COMMERCE_MODES,
    fulfillmentMode: 'source_seller',
    marginPercent: 36,
    minProducts: 12,
  },
  {
    id: 'automotive',
    handle: 'automotive',
    title: {en: 'Automotive', fr: 'Automobile', he: 'רכב'},
    description: 'Car accessories, detailing, and interior upgrades.',
    ageRestricted: false,
    trendingScore: 65,
    seoKeywords: ['car phone mount', 'dash cam', 'seat covers'],
    supplierPlatforms: ['csv_feed', 'amazon', 'aliexpress', 'ebay'],
    commerceModes: DEFAULT_COMMERCE_MODES,
    fulfillmentMode: 'source_seller',
    marginPercent: 34,
    minProducts: 14,
  },
  {
    id: 'supplements',
    handle: 'supplements',
    title: {en: 'Supplements & Nutrition', fr: 'Compléments', he: 'תוספי תזונה'},
    description:
      'Vitamins and wellness supplements — verify regional compliance before publishing.',
    ageRestricted: false,
    trendingScore: 64,
    seoKeywords: ['protein powder', 'collagen peptides', 'vitamin d3'],
    supplierPlatforms: ['csv_feed', 'amazon', 'wholesale_central'],
    commerceModes: ['dropshipping', 'wholesale', 'cross_border', 'white_label'],
    fulfillmentMode: 'source_seller',
    marginPercent: 40,
    minProducts: 10,
  },
  {
    id: 'eco-sustainable',
    handle: 'eco-sustainable',
    title: {en: 'Eco & Sustainable', fr: 'Écologique', he: 'אקולוגי ובר-קיימא'},
    description: 'Reusable, zero-waste, and sustainable lifestyle products.',
    ageRestricted: false,
    trendingScore: 63,
    seoKeywords: ['reusable water bottle', 'bamboo utensils', 'eco friendly gifts'],
    supplierPlatforms: ['csv_feed', 'etsy', 'spocket', 'printful'],
    commerceModes: DEFAULT_COMMERCE_MODES,
    fulfillmentMode: 'source_seller',
    marginPercent: 50,
    minProducts: 12,
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
