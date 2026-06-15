import {createHmac} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {verifyShopifyWebhook} from '~/lib/shopify-webhook';

function shopifyHmac(body: string, secret: string) {
  return createHmac('sha256', secret).update(body, 'utf8').digest('base64');
}

describe('verifyShopifyWebhook', () => {
  it('accepts a valid HMAC signature', async () => {
    const body = '{"id":123}';
    const secret = 'test-secret';
    const hmac = shopifyHmac(body, secret);

    await expect(verifyShopifyWebhook(body, hmac, secret)).resolves.toBe(true);
  });

  it('rejects an invalid signature', async () => {
    await expect(
      verifyShopifyWebhook('{"id":123}', 'bad-signature', 'test-secret'),
    ).resolves.toBe(false);
  });

  it('rejects missing headers or secrets', async () => {
    await expect(
      verifyShopifyWebhook('{}', null, 'secret'),
    ).resolves.toBe(false);
    await expect(verifyShopifyWebhook('{}', 'sig', '')).resolves.toBe(false);
  });
});
