const IDEMPOTENCY_TTL_SECONDS = 86_400;

function idempotencyRequest(webhookId: string) {
  return new Request(`https://webhook-idempotency.internal/${webhookId}`);
}

/** Returns true when this webhook ID was already processed recently. */
export async function isWebhookDuplicate(
  cache: Cache,
  webhookId: string,
): Promise<boolean> {
  if (!webhookId.trim()) return false;
  const hit = await cache.match(idempotencyRequest(webhookId));
  return hit !== undefined;
}

/** Mark a webhook as processed (24h TTL via Cache-Control). */
export async function markWebhookProcessed(
  cache: Cache,
  webhookId: string,
): Promise<void> {
  if (!webhookId.trim()) return;
  await cache.put(
    idempotencyRequest(webhookId),
    new Response('1', {
      headers: {
        'Cache-Control': `max-age=${IDEMPOTENCY_TTL_SECONDS}`,
      },
    }),
  );
}
