import {describe, expect, it} from 'vitest';
import {
  buildFulfillmentRoutes,
  fulfillmentPlanSummary,
  parseShopifyOrderWebhookPayload,
} from '~/lib/fulfillment-routing';

describe('fulfillment-routing', () => {
  it('builds routes from dropship line properties', () => {
    const order = {
      id: '1001',
      name: '#1001',
      email: 'buyer@example.com',
      lineItems: [
        {
          id: '10',
          productId: '200',
          quantity: 2,
          metafields: [
            {
              namespace: 'lumen_dropship',
              key: 'source_platform',
              value: 'aliexpress',
            },
            {
              namespace: 'lumen_dropship',
              key: 'source_seller_id',
              value: 'seller-42',
            },
            {
              namespace: 'lumen_dropship',
              key: 'source_product_id',
              value: 'sku-99',
            },
          ],
        },
      ],
    };

    const routes = buildFulfillmentRoutes(order);
    expect(routes).toHaveLength(1);
    expect(routes[0]?.sourcePlatform).toBe('aliexpress');
    expect(routes[0]?.sourceSellerId).toBe('seller-42');
    expect(routes[0]?.status).toBe('pending');
  });

  it('skips lines without dropship metafields', () => {
    const routes = buildFulfillmentRoutes({
      id: '1',
      name: '#1',
      lineItems: [{id: '1', productId: '2', quantity: 1}],
    });
    expect(routes).toHaveLength(0);
  });

  it('summarizes routes by seller', () => {
    const summary = fulfillmentPlanSummary([
      {
        shopifyLineItemId: '1',
        shopifyProductId: 'p1',
        sourcePlatform: 'aliexpress',
        sourceSellerId: 'a',
        sourceProductId: 'x',
        status: 'pending',
      },
      {
        shopifyLineItemId: '2',
        shopifyProductId: 'p2',
        sourcePlatform: 'aliexpress',
        sourceSellerId: 'a',
        sourceProductId: 'y',
        status: 'pending',
      },
    ]);
    expect(summary.lineCount).toBe(2);
    expect(summary.sellerCount).toBe(1);
  });

  it('parses Shopify order webhook payloads', () => {
    const order = parseShopifyOrderWebhookPayload({
      id: 55,
      name: '#55',
      email: 'a@b.com',
      line_items: [
        {
          id: 9,
          product_id: 88,
          quantity: 1,
          properties: [
            {name: 'lumen_dropship.source_platform', value: 'cj'},
            {name: 'lumen_dropship.source_seller_id', value: 'cj-1'},
            {name: 'lumen_dropship.source_product_id', value: 'prod-1'},
          ],
        },
      ],
      shipping_address: {
        city: 'Tel Aviv',
        country: 'Israel',
      },
    });

    expect(order?.id).toBe('55');
    expect(order?.lineItems[0]?.metafields).toHaveLength(3);
    expect(order?.shippingAddress?.city).toBe('Tel Aviv');
  });
});
