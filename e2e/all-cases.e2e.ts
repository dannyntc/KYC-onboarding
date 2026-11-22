import { test, expect } from '@playwright/test';
import { db } from '../src/lib/db';

test('all twelve alerts open with their client and stored case evidence', async ({ page }) => {
 test.setTimeout(90000);
 const alerts = await db.alert.findMany({
  orderBy: { id: 'asc' },
  include: { client: { include: { accounts: true, transactions: true, documents: true, relationships: true } } },
 });
 expect(alerts).toHaveLength(12);
 await page.goto('/alerts');
 for (const alert of alerts) await expect(page.getByRole('link', { name: alert.id, exact: true })).toBeVisible();
 for (const alert of alerts) {
  const response = await page.goto(`/cases/${alert.id}`);
  expect(response?.status(), alert.id).toBe(200);
  await expect(page.getByRole('heading', { name: alert.client.name, exact: true })).toBeVisible();
  await expect(page.locator(`[id="${alert.triggerTransactionId}"]`)).toContainText('Alert trigger');
  const ids = [alert.client.id, ...alert.client.accounts.map(x => x.id), ...alert.client.transactions.map(x => x.id), ...alert.client.documents.map(x => x.id), ...alert.client.relationships.map(x => x.id)];
  const missing = await page.evaluate(ids => ids.filter(id => !document.getElementById(id)), ids);
  expect(missing, `Missing evidence in ${alert.id}`).toEqual([]);
 }
});
