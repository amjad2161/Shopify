/**
 * Shopify metafield namespace for dropship / source-seller automation.
 * Apply via Admin API when products are imported from external platforms.
 */
export const DROPSHIP_METAFIELD_NAMESPACE = 'lumen_dropship';

export const DROPSHIP_METAFIELDS = {
  source_platform: {
    key: 'source_platform',
    type: 'single_line_text_field',
    description: 'Origin platform (csv_feed, aliexpress, cj_dropshipping, …)',
  },
  source_product_id: {
    key: 'source_product_id',
    type: 'single_line_text_field',
    description: 'Product ID on the source platform',
  },
  source_seller_id: {
    key: 'source_seller_id',
    type: 'single_line_text_field',
    description: 'Seller / vendor ID on the source platform',
  },
  source_seller_name: {
    key: 'source_seller_name',
    type: 'single_line_text_field',
    description: 'Display name of the source seller',
  },
  source_url: {
    key: 'source_url',
    type: 'url',
    description: 'Canonical listing URL on source platform',
  },
  fulfillment_mode: {
    key: 'fulfillment_mode',
    type: 'single_line_text_field',
    description: 'source_seller | warehouse | hybrid',
  },
  cost_amount: {
    key: 'cost_amount',
    type: 'single_line_text_field',
    description: 'Supplier cost (decimal string, shop currency)',
  },
  lead_time_days: {
    key: 'lead_time_days',
    type: 'number_integer',
    description: 'Estimated fulfillment lead time in days',
  },
  age_restricted: {
    key: 'age_restricted',
    type: 'boolean',
    description: 'Requires 18+ age gate in storefront',
  },
} as const;

export type DropshipMetafieldKey = keyof typeof DROPSHIP_METAFIELDS;
