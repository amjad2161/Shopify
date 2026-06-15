import {expect, test} from '@playwright/test';

test.describe('Age verification', () => {
  test('renders the age gate page', async ({page}) => {
    await page.goto('/age-verify?returnTo=%2F');
    await expect(page.locator('.age-verify')).toBeVisible({timeout: 15_000});
    await expect(
      page.getByRole('button', {name: /18|confirm|אני בן|J'ai/i}),
    ).toBeVisible();
  });

  test('shows confirm action on age gate without a verified session', async ({
    page,
  }) => {
    await page.goto('/age-verify?returnTo=%2F');
    await expect(page.locator('.age-verify')).toBeVisible({timeout: 15_000});
    await expect(
      page.getByRole('button', {name: /18|confirm|אני בן|J'ai/i}),
    ).toBeVisible();
  });
});
