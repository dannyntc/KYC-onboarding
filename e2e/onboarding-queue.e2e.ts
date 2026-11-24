import { test, expect } from '@playwright/test';
import { db } from '../src/lib/db';

const expectedRisk: Record<string, string> = {
  'ONB-001': 'Low',
  'ONB-002': 'High',
  'ONB-003': 'Medium',
  'ONB-004': 'Low',
  'ONB-005': 'Medium',
  'ONB-006': 'Low',
  'ONB-007': 'Low',
  'ONB-008': 'Medium',
  'ONB-009': 'High',
  'ONB-010': 'Low',
  'ONB-011': 'Low',
  'ONB-012': 'Low'
};

test('the queue shows all twelve files with their suggested risk and can be searched', async ({ page }) => {
  // Other tests in the same run decide screening hits. Put the records that drive the suggested
  // rating back to their seeded state so this test does not depend on test order.
  await db.screeningResult.updateMany({ data: { disposition: 'Potential match', dispositionReason: '' } });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Onboarding queue' })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(12);
  for (const [id, rating] of Object.entries(expectedRisk)) {
    const row = page.getByRole('row').filter({ has: page.getByRole('link', { name: id, exact: true }) });
    await expect(row.locator('.badge'), id).toHaveText(rating);
  }

  await page.goto('/?q=Aisha');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'ONB-008', exact: true })).toBeVisible();
});

test('the removed alert pages answer not found, and the sidebar has no alerts link', async ({ page, request }) => {
  for (const path of ['/alerts', '/cases/ALT-001', '/cases/ALT-001/analyses/1']) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  await page.goto('/');
  await expect(page.locator('.sidebar nav a')).toHaveText([/Onboarding queue/, /Regulatory library/]);
});
