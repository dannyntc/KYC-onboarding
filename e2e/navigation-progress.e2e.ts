import { test, expect } from '@playwright/test';

test('a Loading… badge shows while a clicked page is on its way, then disappears', async ({ page }) => {
  await page.goto('/');
  const badge = page.getByRole('status').filter({ hasText: 'Loading…' });
  await expect(badge).toHaveCount(0);

  // Hold back the next page's data for a moment, as a slow server would.
  await page.route('**/onboarding/ONB-008**', async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.locator('a[href="/onboarding/ONB-008"]').first().click();
  await expect(badge).toBeVisible();

  await expect(page).toHaveURL(/\/onboarding\/ONB-008$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(badge).toHaveCount(0);
});

test('missing pages still answer "not found"', async ({ request }) => {
  expect((await request.get('/onboarding/ONB-999')).status()).toBe(404);
});
