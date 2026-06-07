/**
 * Example: Shopify `orders/paid` webhook handler (deploy on Oxygen worker route or backend).
 *
 * 1. Verify HMAC with CATALOG_WEBHOOK_SECRET / Shopify webhook secret.
 * 2. Parse order JSON → buildFulfillmentRoutes().
 * 3. For each route, call the platform adapter's placeOrder() (implement per supplier).
 * 4. Store route status; on tracking webhook, create Shopify fulfillment.
 *
 * This file is reference-only — not mounted as a route until you add auth + persistence.
 */

import {
  buildFulfillmentRoutes,
  fulfillmentPlanSummary,
  type ShopifyOrderPayload,
} from './routing.ts';

export function handleOrderPaidWebhook(payload: ShopifyOrderPayload) {
  const routes = buildFulfillmentRoutes(payload);
  const summary = fulfillmentPlanSummary(routes);

  return {
    shopifyOrderId: payload.id,
    summary,
    routes,
    nextSteps: [
      'Forward each route to supplier adapter placeOrder()',
      'Persist route status (pending → forwarded → shipped)',
      'On tracking: Admin API fulfillmentCreate + notify customer',
    ],
  };
}
