import {describe, expect, it} from 'vitest';
import {DROPSHIP_METAFIELD_NAMESPACE} from '../config/metafields.ts';
import {
  buildFulfillmentRoutes,
  buildSourceSellerOrderPayload,
  fulfillmentPlanSummary,
} from './routing.ts';
import type {SupplierProduct} from '../types.ts';

function dropshipMetafields(
  values: Record<string, string>,
): Array<{namespace: string; key: string; value: string}> {
  return Object.entries(values).map(([key, value]) => ({
    namespace: DROPSHIP_METAFIELD_NAMESPACE,
    key,
    value,
  }));
}

describe('fulfillment routing', () => {
  it('routes line items with source-seller metafields to the original seller', () => {
    const routes = buildFulfillmentRoutes({
      id: 'gid://shopify/Order/1',
      name: '#1001',
      email: 'buyer@example.com',
      shippingAddress: {city: 'Tel Aviv', country: 'IL'},
      lineItems: [
        {
          id: 'gid://shopify/LineItem/1',
          productId: 'gid://shopify/Product/10',
          quantity: 2,
          metafields: dropshipMetafields({
            source_platform: 'csv_feed',
            source_seller_id: 'seller-gadgethub',
            source_product_id: 'csv-tech-001',
            fulfillment_mode: 'source_seller',
          }),
        },
      ],
    });

    expect(routes).toHaveLength(1);
    expect(routes[0].sourcePlatform).toBe('csv_feed');
    expect(routes[0].sourceSellerId).toBe('seller-gadgethub');
    expect(routes[0].sourceProductId).toBe('csv-tech-001');
    expect(routes[0].status).toBe('pending');
  });

  it('skips lines without dropship metafields', () => {
    const routes = buildFulfillmentRoutes({
      id: 'gid://shopify/Order/2',
      name: '#1002',
      lineItems: [
        {
          id: 'gid://shopify/LineItem/2',
          productId: 'gid://shopify/Product/11',
          quantity: 1,
        },
      ],
    });
    expect(routes).toHaveLength(0);
  });

  it('groups routes by seller in summary', () => {
    const routes = buildFulfillmentRoutes({
      id: 'gid://shopify/Order/3',
      name: '#1003',
      lineItems: [
        {
          id: 'a',
          productId: 'p1',
          quantity: 1,
          metafields: dropshipMetafields({
            source_platform: 'csv_feed',
            source_seller_id: 'seller-a',
            source_product_id: 'x1',
            fulfillment_mode: 'source_seller',
          }),
        },
        {
          id: 'b',
          productId: 'p2',
          quantity: 1,
          metafields: dropshipMetafields({
            source_platform: 'csv_feed',
            source_seller_id: 'seller-a',
            source_product_id: 'x2',
            fulfillment_mode: 'source_seller',
          }),
        },
        {
          id: 'c',
          productId: 'p3',
          quantity: 1,
          metafields: dropshipMetafields({
            source_platform: 'spocket',
            source_seller_id: 'seller-b',
            source_product_id: 'y1',
            fulfillment_mode: 'source_seller',
          }),
        },
      ],
    });

    const summary = fulfillmentPlanSummary(routes);
    expect(summary.lineCount).toBe(3);
    expect(summary.sellerCount).toBe(2);
  });

  it('builds source seller API payload from supplier product', () => {
    const product: SupplierProduct = {
      externalId: 'csv-tech-001',
      platform: 'csv_feed',
      sellerId: 'seller-gadgethub',
      title: 'Charger',
      sku: 'SKU-TEC-001',
      price: '29.99',
      currency: 'USD',
      inventoryQuantity: 100,
      categoryHandles: ['technology'],
      tags: [],
      imageUrls: [],
    };

    const payload = buildSourceSellerOrderPayload({
      product,
      quantity: 1,
      shipTo: {city: 'Toronto', country: 'CA'},
      shopifyOrderRef: '#1001',
    });

    expect(payload.seller_id).toBe('seller-gadgethub');
    expect(payload.source_product_id).toBe('csv-tech-001');
    expect(payload.fulfillment_mode).toBe('source_seller');
    expect(payload.reference).toBe('#1001');
  });
});
