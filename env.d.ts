/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env extends HydrogenEnv {
    /** Public storefront URL for SEO (defaults to https://{PUBLIC_STORE_DOMAIN}) */
    PUBLIC_BRAND_URL?: string;
    /** Display name override (default: OneClick Hub) */
    PUBLIC_BRAND_NAME?: string;
    PUBLIC_BRAND_TAGLINE?: string;
    PUBLIC_BRAND_DESCRIPTION?: string;
    /** Enable full-screen 3D homepage (1 | true | yes) */
    PUBLIC_3D_EXPERIENCE?: string;
    /** Shopify collection handle for the homepage feature block */
    FEATURED_COLLECTION_HANDLE?: string;
    /** Comma-separated collection handles — first entry pins the homepage hero */
    FEATURED_COLLECTION_HANDLES?: string;
    /** Shopify Admin API token (custom app) for catalog sync */
    SHOPIFY_ADMIN_ACCESS_TOKEN?: string;
    /** Enable live catalog import (1 | true) */
    CATALOG_SYNC_ENABLED?: string;
    /** Preview catalog sync without Admin writes */
    CATALOG_DRY_RUN?: string;
    /** Path to CSV supplier feed for catalog:sync */
    CATALOG_SUPPLIER_CSV_PATH?: string;
    /** HMAC secret for POST /webhooks/shopify */
    SHOPIFY_WEBHOOK_SECRET?: string;
  }
}

export {};
