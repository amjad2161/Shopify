import {DROPSHIP_METAFIELD_NAMESPACE} from '~/lib/dropship-config';

export type SupplierPlatformId = string;

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

export type OrderFulfillmentRoute = {
  shopifyLineItemId: string;
  shopifyProductId: string;
  sourcePlatform: SupplierPlatformId;
  sourceSellerId: string;
  sourceProductId: string;
  sourceOrderPayload?: Record<string, unknown>;
  status: 'pending' | 'forwarded' | 'acknowledged' | 'shipped' | 'failed';
};

function metafieldValue(
  line: ShopifyOrderLine,
  key: string,
): string | undefined {
  return line.metafields?.find(
    (m) => m.namespace === DROPSHIP_METAFIELD_NAMESPACE && m.key === key,
  )?.value;
}

/** Split paid order lines into per-seller fulfillment routes from dropship metafields. */
export function buildFulfillmentRoutes(
  order: ShopifyOrderPayload,
): OrderFulfillmentRoute[] {
  const routes: OrderFulfillmentRoute[] = [];

  for (const line of order.lineItems) {
    const platform = metafieldValue(line, 'source_platform');
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

/** Normalize Shopify REST webhook order payload into routing input. */
export function parseShopifyOrderWebhookPayload(
  payload: Record<string, unknown>,
): ShopifyOrderPayload | null {
  const id = payload.id;
  const name = payload.name;
  if (id == null || typeof name !== 'string') return null;

  const lineItemsRaw = payload.line_items;
  if (!Array.isArray(lineItemsRaw)) return null;

  const lineItems: ShopifyOrderLine[] = [];
  for (const item of lineItemsRaw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const lineId = row.id;
    const productId = row.product_id;
    const quantity = row.quantity;
    if (lineId == null || productId == null) continue;

    const properties = Array.isArray(row.properties)
      ? (row.properties as Array<{name?: string; value?: string}>)
      : [];

    const metafields = properties
      .filter((p) => p.name?.startsWith(`${DROPSHIP_METAFIELD_NAMESPACE}.`))
      .map((p) => {
        const key = p.name!.slice(DROPSHIP_METAFIELD_NAMESPACE.length + 1);
        return {
          namespace: DROPSHIP_METAFIELD_NAMESPACE,
          key,
          value: String(p.value ?? ''),
        };
      });

    lineItems.push({
      id: String(lineId),
      productId: String(productId),
      quantity: typeof quantity === 'number' ? quantity : 1,
      ...(metafields.length ? {metafields} : {}),
    });
  }

  const shipping = payload.shipping_address;
  const shippingAddress =
    shipping && typeof shipping === 'object'
      ? {
          firstName: (shipping as {first_name?: string}).first_name,
          lastName: (shipping as {last_name?: string}).last_name,
          address1: (shipping as {address1?: string}).address1,
          address2: (shipping as {address2?: string}).address2,
          city: (shipping as {city?: string}).city,
          province: (shipping as {province?: string}).province,
          zip: (shipping as {zip?: string}).zip,
          country: (shipping as {country?: string}).country,
          phone: (shipping as {phone?: string}).phone,
        }
      : undefined;

  return {
    id: String(id),
    name,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    shippingAddress,
    lineItems,
  };
}
