import { test, expect } from '@playwright/test';

test('the read-only role cannot change an onboarding file', async ({ page }) => {
  await page.goto('/controls');
  await page.getByLabel('Demo role (not authentication)').selectOption('read-only');
  await page.getByRole('button', { name: 'Switch role' }).click();
  const response = await page.request.post('/api/onboarding', {
    headers: { origin: 'http://127.0.0.1:3105' },
    form: { id: 'ONB-012', action: 'request-info', version: '0', note: 'Should not be saved' }
  });
  expect(response.status()).toBe(403);
  await page.goto('/onboarding/ONB-012');
  await expect(page.getByText('The read-only role cannot change onboarding files.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Request information' })).toHaveCount(0);
});

test('a stale save is refused with 409 and keeps the note that was typed', async ({ browser }) => {
  const context = await browser.newContext();
  const first = await context.newPage();
  const second = await context.newPage();
  await first.goto('http://127.0.0.1:3105/onboarding/ONB-012');
  await second.goto('http://127.0.0.1:3105/onboarding/ONB-012');

  await first.getByLabel('FINAL RISK RATING').selectOption('Low');
  await first.getByLabel('REASONS FOR RATING').fill('Clean applicant, first reviewer.');
  await first.getByRole('button', { name: 'Save risk rating' }).click();
  await expect(first.getByTestId('final-risk')).toHaveText('Low');

  await second.getByLabel('DECISION NOTE').fill('Unsaved decision note to keep');
  await second.getByRole('button', { name: 'Request information' }).click();
  await expect(second.locator('p.form-error')).toContainText('This file changed. Reload and try again.');
  await expect(second.getByLabel('DECISION NOTE')).toHaveValue('Unsaved decision note to keep');
  await context.close();
});
