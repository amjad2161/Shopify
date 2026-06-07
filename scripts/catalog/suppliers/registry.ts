import type {CatalogEnv, SupplierAdapter, SupplierPlatformId} from '../types.ts';
import {csvFeedAdapter} from './csv-feed.ts';
import {genericApiAdapter} from './generic-api.ts';

/** Placeholder adapters — wire credentials + API client when onboarding a platform. */
function stubAdapter(
  id: SupplierPlatformId,
  label: string,
  envKey?: keyof CatalogEnv,
): SupplierAdapter {
  return {
    id,
    label,
    isConfigured(env) {
      if (!envKey) return false;
      return Boolean(env[envKey]?.trim());
    },
    async fetchProducts() {
      return [];
    },
  };
}

export const SUPPLIER_ADAPTERS: SupplierAdapter[] = [
  csvFeedAdapter,
  genericApiAdapter,
  stubAdapter('cj_dropshipping', 'CJ Dropshipping', 'CJ_DROPSHIPPING_API_KEY'),
  stubAdapter('spocket', 'Spocket', 'SPOCKET_API_KEY'),
  stubAdapter('aliexpress', 'AliExpress', 'ALIEXPRESS_APP_KEY'),
  stubAdapter('printful', 'Printful', 'PRINTFUL_API_KEY'),
  stubAdapter('amazon', 'Amazon', 'AMAZON_SP_API_REFRESH_TOKEN'),
  stubAdapter('ebay', 'eBay', 'EBAY_OAUTH_TOKEN'),
  stubAdapter('etsy', 'Etsy', 'ETSY_API_KEY'),
  stubAdapter('temu', 'Temu', 'TEMU_SUPPLIER_API_KEY'),
  stubAdapter('walmart', 'Walmart Marketplace', 'WALMART_MARKETPLACE_CLIENT_ID'),
  stubAdapter('shein', 'Shein Supplier', 'SHEIN_SUPPLIER_API_KEY'),
  stubAdapter('dhgate', 'DHgate', 'DHGATE_API_KEY'),
  stubAdapter('tiktok_shop', 'TikTok Shop', 'TIKTOK_SHOP_API_KEY'),
  stubAdapter(
    'wholesale_central',
    'Wholesale Central',
    'WHOLESALE_CENTRAL_API_KEY',
  ),
];

export function getAdapter(id: SupplierPlatformId) {
  return SUPPLIER_ADAPTERS.find((a) => a.id === id);
}

export function getConfiguredAdapters(env: CatalogEnv) {
  return SUPPLIER_ADAPTERS.filter((a) => a.isConfigured(env));
}

export async function fetchAllSupplierProducts(options: {
  env: CatalogEnv;
  platformIds: SupplierPlatformId[];
  verticalHandles: string[];
  limitPerPlatform?: number;
}) {
  const {env, platformIds, verticalHandles, limitPerPlatform = 200} = options;
  const products = [];

  for (const platformId of platformIds) {
    const adapter = getAdapter(platformId);
    if (!adapter || !adapter.isConfigured(env)) continue;

    const batch = await adapter.fetchProducts({
      env,
      verticalHandles,
      limit: limitPerPlatform,
    });
    products.push(...batch);
  }

  return products;
}
