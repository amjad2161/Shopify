import type {Route} from './+types/webhooks.shopify';
import {verifyShopifyWebhook} from '~/lib/shopify-webhook';

type FulfillmentWebhookResult = {
  ok: true;
  topic: string;
  orderId?: number;
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

  const valid = await verifyShopifyWebhook(rawBody, hmac, secret);
  if (!valid) {
    return new Response('Invalid webhook signature', {status: 401});
  }

  let payload: {id?: number} = {};
  try {
    payload = JSON.parse(rawBody) as {id?: number};
  } catch {
    return new Response('Invalid JSON payload', {status: 400});
  }

  const result: FulfillmentWebhookResult = {
    ok: true,
    topic,
    orderId: payload.id,
    message:
      topic === 'orders/paid'
        ? 'Order received — forward to fulfillment routing (see scripts/catalog/fulfillment/).'
        : 'Webhook accepted.',
  };

  return Response.json(result);
}

export async function loader() {
  return new Response('Shopify webhooks accept POST only', {status: 405});
}
