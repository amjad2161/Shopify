import {DROPSHIP_METAFIELD_NAMESPACE} from '../config/metafields.ts';
import type {
  OrderFulfillmentRoute,
  SupplierPlatformId,
  SupplierProduct,
} from '../types.ts';

/**
 * Source-seller fulfillment model:
 * 1. Customer checks out on your Shopify store (you capture payment).
 * 2. Order webhook splits line items by `lumen_dropship.*` metafields.
 * 3. Each line is forwarded to the original seller's API — they ship to the customer.
 * 4. Tracking flows back → Shopify fulfillment update → customer notification.
 *
 * Payment settlement with the source seller is handled per your supplier contract
 * (API auto-pay, invoice, or marketplace escrow).
 */

export type ShopifyOrderLine = {
  id: string;
  productId: string;
  quantity: number;
  metafields?: Array<{namespace: string; key: string; value: string}>;
};

export type ShopifyOrderPayload = {
  id: string;
  name: string;
  email?: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    phone?: string;
  };
  lineItems: ShopifyOrderLine[];
};

function metafieldValue(
  line: ShopifyOrderLine,
  key: string,
): string | undefined {
  return line.metafields?.find(
    (m) => m.namespace === DROPSHIP_METAFIELD_NAMESPACE && m.key === key,
  )?.value;
}

export function buildFulfillmentRoutes(
  order: ShopifyOrderPayload,
): OrderFulfillmentRoute[] {
  const routes: OrderFulfillmentRoute[] = [];

  for (const line of order.lineItems) {
    const platform = metafieldValue(line, 'source_platform') as
      | SupplierPlatformId
      | undefined;
    const sellerId = metafieldValue(line, 'source_seller_id');
    const productId = metafieldValue(line, 'source_product_id');
    const fulfillmentMode = metafieldValue(line, 'fulfillment_mode');

    if (!platform || !sellerId || !productId) continue;
    if (fulfillmentMode && fulfillmentMode !== 'source_seller') continue;

    routes.push({
      shopifyLineItemId: line.id,
      shopifyProductId: line.productId,
      sourcePlatform: platform,
      sourceSellerId: sellerId,
      sourceProductId: productId,
      status: 'pending',
      sourceOrderPayload: {
        shopifyOrderId: order.id,
        shopifyOrderName: order.name,
        quantity: line.quantity,
        shipTo: order.shippingAddress,
        customerEmail: order.email,
      },
    });
  }

  return routes;
}

export function fulfillmentPlanSummary(routes: OrderFulfillmentRoute[]) {
  const bySeller = new Map<string, number>();
  for (const route of routes) {
    const key = `${route.sourcePlatform}:${route.sourceSellerId}`;
    bySeller.set(key, (bySeller.get(key) ?? 0) + 1);
  }
  return {
    lineCount: routes.length,
    sellerCount: bySeller.size,
    sellers: [...bySeller.entries()].map(([key, lines]) => ({
      seller: key,
      lines,
    })),
  };
}

/** Build a forward payload for a supplier API from a normalized product + order line. */
export function buildSourceSellerOrderPayload(options: {
  product: SupplierProduct;
  quantity: number;
  shipTo: ShopifyOrderPayload['shippingAddress'];
  shopifyOrderRef: string;
}) {
  return {
    seller_id: options.product.sellerId,
    source_product_id: options.product.externalId,
    quantity: options.quantity,
    ship_to: options.shipTo,
    reference: options.shopifyOrderRef,
    fulfillment_mode: 'source_seller',
  };
}
