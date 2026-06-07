/** Shared catalog automation types — suppliers, products, fulfillment. */

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
  | 'manual';

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
  FEATURED_COLLECTION_HANDLES?: string;
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
