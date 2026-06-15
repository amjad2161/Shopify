import {describe, expect, it} from 'vitest';
import {
  isWebhookDuplicate,
  markWebhookProcessed,
} from '~/lib/webhook-idempotency';

function requestKey(request: RequestInfo | URL): string {
  if (typeof request === 'string') return request;
  if (request instanceof URL) return request.href;
  return request.url;
}

function createMemoryCache(): Cache {
  const store = new Map<string, Response>();

  return {
    async match(request: RequestInfo | URL) {
      return store.get(requestKey(request));
    },
    async put(request: RequestInfo | URL, response: Response) {
      store.set(requestKey(request), response.clone());
    },
    async delete() {
      return true;
    },
  } as unknown as Cache;
}

describe('webhook-idempotency', () => {
  it('detects duplicate webhook IDs', async () => {
    const cache = createMemoryCache();
    expect(await isWebhookDuplicate(cache, 'wh-1')).toBe(false);
    await markWebhookProcessed(cache, 'wh-1');
    expect(await isWebhookDuplicate(cache, 'wh-1')).toBe(true);
  });

  it('ignores blank webhook IDs', async () => {
    const cache = createMemoryCache();
    expect(await isWebhookDuplicate(cache, '')).toBe(false);
    await markWebhookProcessed(cache, '  ');
    expect(await isWebhookDuplicate(cache, '  ')).toBe(false);
  });
});
