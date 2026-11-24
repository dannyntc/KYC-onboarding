import { test, expect } from '@playwright/test';

test('the queue opens with the problem statement and the six gaps it closes', async ({ page }) => {
  await page.goto('/');
  const panel = page.locator('[data-tour="problem"]');
  await expect(panel).toContainText('THE PROBLEM THIS SOLVES');
  await expect(panel.locator('li')).toHaveCount(6);
  await expect(panel).toContainText('machine learning (clustering)');
  await expect(panel).toContainText('Hours spent writing up each file');
  await expect(panel).toContainText('No clear record of who decided what, and why');
});

test('a KYC file shows a Solves caption on the four key sections only', async ({ page }) => {
  await page.goto('/onboarding/ONB-003');
  await expect(page.locator('.solves')).toHaveCount(4);
  await expect(page.locator('[data-tour="ownership"] .solves')).toContainText('machine learning (clustering)');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('the problem panel fits without sideways scrolling', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-tour="problem"] li')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
