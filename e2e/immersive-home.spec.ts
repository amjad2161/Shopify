import {expect, test} from '@playwright/test';
import {hasLiveStoreEnv} from './helpers/store-env';

const liveStore = hasLiveStoreEnv();

test.describe('Immersive homepage', () => {
  test.skip(
    !liveStore,
    'Requires SESSION_SECRET, PUBLIC_STORE_DOMAIN, and PUBLIC_STOREFRONT_API_TOKEN in .env',
  );
  test('renders branded shell when 3D experience is enabled', async ({page}) => {
    await page.goto('/');

    await expect(page.locator('.experience-shell, .home')).toBeVisible({
      timeout: 30_000,
    });

    const immersive = page.locator('.experience-shell');
    if (await immersive.count()) {
      await expect(page.locator('.experience-title')).toBeVisible();
      await expect(page.locator('.experience-overlay')).toBeVisible();
    } else {
      await expect(page.locator('.home')).toBeVisible();
    }
  });

  test('classic homepage remains navigable without WebGL canvas', async ({
    page,
  }) => {
    await page.goto('/collections/all');
    await expect(page.locator('main')).toBeVisible({timeout: 30_000});
  });

  test('immersive overlay exposes product focus affordance', async ({page}) => {
    await page.goto('/');

    const immersive = page.locator('.experience-shell');
    if ((await immersive.count()) === 0) {
      await expect(page.locator('.home')).toBeVisible({timeout: 30_000});
      return;
    }

    await expect(page.locator('.experience-overlay')).toBeVisible();
    await expect(page.locator('.experience-title, .experience-cta')).toBeVisible();
    await expect(page.locator('.experience-focus-hint')).toBeVisible();
  });

  test('product pages render the PDP media region', async ({page}) => {
    await page.goto('/collections/all');
    await expect(page.locator('main')).toBeVisible({timeout: 30_000});

    const productLink = page.locator('a[href*="/products/"]').first();
    if ((await productLink.count()) === 0) return;

    await productLink.click();
    await expect(page.locator('.product')).toBeVisible({timeout: 30_000});
    await expect(
      page.locator('.product-viewer-3d, .product img, .product-image'),
    ).toBeVisible();
  });
});
