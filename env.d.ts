/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

interface Env extends HydrogenEnv {
  /** Public storefront URL for SEO (defaults to https://{PUBLIC_STORE_DOMAIN}) */
  PUBLIC_BRAND_URL?: string;
  /** Shopify collection handle for the homepage feature block */
  FEATURED_COLLECTION_HANDLE?: string;
}
