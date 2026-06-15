import type {CatalogEnv, SupplierAdapter, SupplierProduct} from '../types.ts';

/**
 * Template adapter for REST product feeds from external marketplaces.
 * Configure GENERIC_SUPPLIER_API_URL + GENERIC_SUPPLIER_API_KEY in .env.
 *
 * Expected JSON shape:
 * { "products": [{ "id", "title", "price", "seller_id", "category_handles", ... }] }
 */
export const genericApiAdapter: SupplierAdapter = {
  id: 'generic_api',
  label: 'Generic REST supplier API',
  isConfigured(env) {
    return Boolean(
      env.GENERIC_SUPPLIER_API_URL?.trim() &&
        env.GENERIC_SUPPLIER_API_KEY?.trim(),
    );
  },
  async fetchProducts({env, verticalHandles, limit = 200}) {
    const url = env.GENERIC_SUPPLIER_API_URL?.trim();
    const key = env.GENERIC_SUPPLIER_API_KEY?.trim();
    if (!url || !key) return [];

    const params = new URLSearchParams({
      limit: String(limit),
      categories: verticalHandles.join(','),
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Generic supplier API ${response.status}`);
    }

    const json = (await response.json()) as {
      products?: Array<Record<string, unknown>>;
    };

    const products: SupplierProduct[] = [];

    for (const raw of json.products ?? []) {
      const externalId = String(raw.id ?? '');
      const title = String(raw.title ?? '');
      const sku = String(raw.sku ?? externalId);
      const price = String(raw.price ?? '');
      const sellerId = String(raw.seller_id ?? 'generic-seller');

      if (!externalId || !title || !price) continue;

      products.push({
        externalId,
        platform: 'generic_api',
        sellerId,
        sellerName: raw.seller_name ? String(raw.seller_name) : undefined,
        title,
        descriptionHtml: raw.description_html
          ? String(raw.description_html)
          : undefined,
        vendor: raw.vendor ? String(raw.vendor) : undefined,
        productType: raw.product_type ? String(raw.product_type) : undefined,
        tags: Array.isArray(raw.tags)
          ? raw.tags.map(String)
          : [],
        categoryHandles: Array.isArray(raw.category_handles)
          ? raw.category_handles.map(String)
          : verticalHandles,
        sku,
        price,
        compareAtPrice: raw.compare_at_price
          ? String(raw.compare_at_price)
          : undefined,
        currency: String(raw.currency ?? 'USD'),
        inventoryQuantity: Number(raw.inventory ?? 50) || 0,
        imageUrls: Array.isArray(raw.image_urls)
          ? raw.image_urls.map(String)
          : [],
        sourceUrl: raw.source_url ? String(raw.source_url) : undefined,
        cost: raw.cost ? String(raw.cost) : undefined,
        leadTimeDays: raw.lead_time_days
          ? Number(raw.lead_time_days)
          : undefined,
      });
    }

    return products;
  },
};
