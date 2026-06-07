/** Shared catalog automation types — suppliers, products, fulfillment. */

import type {CommerceModeId} from './config/commerce-modes.ts';

export type FulfillmentMode = 'source_seller' | 'warehouse' | 'hybrid';

export type SupplierPlatformId =
  | 'csv_feed'
  | 'generic_api'
  | 'aliexpress'
  | 'cj_dropshipping'
  | 'spocket'
  | 'printful'
  | 'amazon'
  | 'ebay'
  | 'etsy'
  | 'temu'
  | 'walmart'
  | 'shein'
  | 'dhgate'
  | 'tiktok_shop'
  | 'wholesale_central'
  | 'manual';

export type {CommerceModeId};

export type CatalogVerticalId =
  | 'beauty-grooming'
  | 'women'
  | 'technology'
  | 'gaming'
  | 'baby'
  | 'kids'
  | 'apparel'
  | 'underwear'
  | 'lingerie-adult'
  | 'adults-only'
  | 'home-living'
  | 'fitness-wellness'
  | 'jewelry'
  | 'pets'
  | 'outdoor-sports'
  | 'office-supplies'
  | 'automotive'
  | 'supplements'
  | 'eco-sustainable'
  | 'trending';

export type CatalogVertical = {
  id: CatalogVerticalId;
  /** Shopify collection handle (URL-safe, lowercase). */
  handle: string;
  title: {en: string; fr: string; he: string};
  description: string;
  parentId?: CatalogVerticalId;
  ageRestricted: boolean;
  /** 1–100 — higher = prioritize in sync & homepage merchandising. */
  trendingScore: number;
  seoKeywords: string[];
  /** Business models this vertical supports (dropship, arbitrage, etc.). */
  commerceModes: CommerceModeId[];
  supplierPlatforms: SupplierPlatformId[];
  fulfillmentMode: FulfillmentMode;
  /** Suggested markup over supplier cost (percent). */
  marginPercent: number;
  /** Minimum products to consider collection "healthy". */
  minProducts: number;
};

export type SupplierProduct = {
  externalId: string;
  platform: SupplierPlatformId;
  sellerId: string;
  sellerName?: string;
  title: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  categoryHandles: string[];
  sku: string;
  price: string;
  compareAtPrice?: string;
  currency: string;
  inventoryQuantity: number;
  imageUrls: string[];
  sourceUrl?: string;
  cost?: string;
  leadTimeDays?: number;
  /** Alternative listings for same SKU — kept for audit, not imported. */
  alternateSources?: Array<{
    platform: SupplierPlatformId;
    sellerId: string;
    cost: string;
    price: string;
  }>;
};

export type ProductFingerprint = string;

export type AggregatedProduct = SupplierProduct & {
  fingerprint: ProductFingerprint;
  landedCost: number;
  rejectedSources: number;
};

export type TrendSignal = {
  keyword: string;
  score: number;
  region: string;
  source: 'vertical' | 'seo' | 'ai' | 'early_detect';
  detectedAt: string;
};

export type ScoredProduct = AggregatedProduct & {
  scores: {
    trend: number;
    margin: number;
    demand: number;
    regional: number;
    composite: number;
  };
  matchedTrends: string[];
  promote: boolean;
};

export type PromotionRecommendation = {
  product: ScoredProduct;
  action: 'feature' | 'publish' | 'boost_ad' | 'hold_draft';
  reason: string;
  priority: number;
};

export type SupplierAdapter = {
  id: SupplierPlatformId;
  label: string;
  /** Whether credentials/env for this platform are configured. */
  isConfigured: (env: CatalogEnv) => boolean;
  /** Pull normalized products for given vertical handles. */
  fetchProducts: (options: {
    env: CatalogEnv;
    verticalHandles: string[];
    limit?: number;
  }) => Promise<SupplierProduct[]>;
};

export type CatalogEnv = {
  PUBLIC_STORE_DOMAIN?: string;
  SHOPIFY_ADMIN_ACCESS_TOKEN?: string;
  CATALOG_SYNC_ENABLED?: string;
  CATALOG_DRY_RUN?: string;
  CATALOG_DEFAULT_VENDOR?: string;
  CATALOG_MARGIN_PERCENT?: string;
  CATALOG_SUPPLIER_CSV_PATH?: string;
  CATALOG_WEBHOOK_SECRET?: string;
  GENERIC_SUPPLIER_API_URL?: string;
  GENERIC_SUPPLIER_API_KEY?: string;
  CJ_DROPSHIPPING_API_KEY?: string;
  SPOCKET_API_KEY?: string;
  ALIEXPRESS_APP_KEY?: string;
  PRINTFUL_API_KEY?: string;
  AMAZON_SP_API_REFRESH_TOKEN?: string;
  EBAY_OAUTH_TOKEN?: string;
  ETSY_API_KEY?: string;
  TEMU_SUPPLIER_API_KEY?: string;
  WALMART_MARKETPLACE_CLIENT_ID?: string;
  SHEIN_SUPPLIER_API_KEY?: string;
  DHGATE_API_KEY?: string;
  TIKTOK_SHOP_API_KEY?: string;
  WHOLESALE_CENTRAL_API_KEY?: string;
  FEATURED_COLLECTION_HANDLES?: string;
  /** AI-assisted catalog (optional — rule-based scoring works without keys). */
  CATALOG_AI_ENABLED?: string;
  CATALOG_AI_API_URL?: string;
  CATALOG_AI_API_KEY?: string;
  CATALOG_AI_MODEL?: string;
  /** ISO 3166-1 alpha-2 — boosts regional trend keywords (e.g. IL, US, CA). */
  CATALOG_TARGET_COUNTRY?: string;
  CATALOG_TARGET_REGION?: string;
  CATALOG_TARGET_LOCALE?: string;
  /** When 1/true, only import cheapest source per product fingerprint. */
  CATALOG_CHEAPEST_SOURCE_ONLY?: string;
  CATALOG_MIN_PROFIT_PERCENT?: string;
  CATALOG_TREND_LOOKAHEAD_DAYS?: string;
  CATALOG_MAX_IMPORT_PER_SYNC?: string;
  /** Fallback when CATALOG_AI_API_KEY is unset. */
  OPENAI_API_KEY?: string;
};

export type SyncReport = {
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  collections: {
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
  products: {
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
  fulfillment: {
    routesConfigured: number;
    warnings: string[];
  };
  smart?: {
    region: string;
    aggregated: number;
    scored: number;
    candidates: number;
    trendSignals: number;
    earlyTrendKeywords: string[];
    promotions: number;
    aiEnabled: boolean;
    cheapestSourceOnly: boolean;
  };
};

export type OrderFulfillmentRoute = {
  shopifyLineItemId: string;
  shopifyProductId: string;
  sourcePlatform: SupplierPlatformId;
  sourceSellerId: string;
  sourceProductId: string;
  sourceOrderPayload?: Record<string, unknown>;
  status: 'pending' | 'forwarded' | 'acknowledged' | 'shipped' | 'failed';
};
