import type {Route} from './+types/webhooks.shopify';
import {
  buildFulfillmentRoutes,
  fulfillmentPlanSummary,
  parseShopifyOrderWebhookPayload,
} from '~/lib/fulfillment-routing';
import {verifyShopifyWebhook} from '~/lib/shopify-webhook';
import {
  isWebhookDuplicate,
  markWebhookProcessed,
} from '~/lib/webhook-idempotency';

type FulfillmentWebhookResult = {
  ok: true;
  topic: string;
  orderId?: number;
  duplicate?: boolean;
  fulfillment?: ReturnType<typeof fulfillmentPlanSummary>;
  message: string;
};

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {status: 405});
  }

  const secret = context.env.SHOPIFY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return new Response('Webhook secret not configured', {status: 503});
  }

  const rawBody = await request.text();
  const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
  const topic = request.headers.get('X-Shopify-Topic') ?? 'unknown';
  const webhookId = request.headers.get('X-Shopify-Webhook-Id') ?? '';

  const valid = await verifyShopifyWebhook(rawBody, hmac, secret);
  if (!valid) {
    return new Response('Invalid webhook signature', {status: 401});
  }

  if (webhookId && (await isWebhookDuplicate(context.workerCache, webhookId))) {
    const duplicateResult: FulfillmentWebhookResult = {
      ok: true,
      topic,
      duplicate: true,
      message: 'Webhook already processed.',
    };
    return Response.json(duplicateResult);
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response('Invalid JSON payload', {status: 400});
  }

  const orderId =
    typeof payload.id === 'number' ? payload.id : Number(payload.id);

  let message = 'Webhook accepted.';
  let fulfillment: ReturnType<typeof fulfillmentPlanSummary> | undefined;

  if (topic === 'orders/paid') {
    const order = parseShopifyOrderWebhookPayload(payload);
    if (order) {
      const routes = buildFulfillmentRoutes(order);
      fulfillment = fulfillmentPlanSummary(routes);
      if (routes.length > 0) {
        message = `Order ${order.name}: ${routes.length} line(s) queued for source-seller fulfillment across ${fulfillment.sellerCount} seller(s).`;
      } else {
        message = `Order ${order.name}: no dropship metafields — manual fulfillment.`;
      }
    } else {
      message = 'Order paid — payload could not be parsed for routing.';
    }
  }

  if (webhookId) {
    await markWebhookProcessed(context.workerCache, webhookId);
  }

  const result: FulfillmentWebhookResult = {
    ok: true,
    topic,
    orderId: Number.isFinite(orderId) ? orderId : undefined,
    fulfillment,
    message,
  };

  return Response.json(result);
}

export async function loader() {
  return new Response('Shopify webhooks accept POST only', {status: 405});
}
