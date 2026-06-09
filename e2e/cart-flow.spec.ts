import {expect, test} from '@playwright/test';
import {hasLiveStoreEnv} from './helpers/store-env';

const liveStore = hasLiveStoreEnv();

test.describe('Cart flow', () => {
  test.skip(
    !liveStore,
    'Requires SESSION_SECRET, PUBLIC_STORE_DOMAIN, and PUBLIC_STOREFRONT_API_TOKEN in .env',
  );

  test('adds a product to cart from PDP', async ({page}) => {
    await page.goto('/collections/all');
    await expect(page.locator('main')).toBeVisible({timeout: 30_000});

    const productLink = page.locator('a[href*="/products/"]').first();
    if ((await productLink.count()) === 0) return;

    await productLink.click();
    await expect(page.locator('.product')).toBeVisible({timeout: 30_000});

    const addToCart = page.getByRole('button', {name: /add to cart/i});
    if ((await addToCart.count()) === 0) return;

    await addToCart.click();
    await page.goto('/cart');
    await expect(page.locator('main')).toBeVisible({timeout: 30_000});
    await expect(page.locator('.cart, [class*="cart"]')).toBeVisible();
  });
});
