import { test, expect } from '@playwright/test';
import { db } from '../src/lib/db';

// Runs near the end of the suite (file name order), because it erases everything earlier tests saved.
test('Reset demo data restores the starting applicants and clears saved work', async ({ page }) => {
  await page.goto('/onboarding/ONB-007');
  await page.getByLabel('FINAL RISK RATING').selectOption('Medium');
  await page.getByLabel('REASONS FOR RATING').fill('Saved before the reset, to prove the reset clears it.');
  await page.getByRole('button', { name: 'Save risk rating' }).click();
  await expect(page.getByTestId('final-risk')).toHaveText('Medium');
  expect(await db.onboardingEvent.count()).toBeGreaterThan(0);

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await expect(page).toHaveURL(/\/$/);

  expect(await db.onboardingCase.count()).toBe(12);
  expect(await db.onboardingEvent.count()).toBe(0);
  expect(await db.auditEvent.count()).toBe(0);
  expect((await db.onboardingCase.findUniqueOrThrow({ where: { id: 'ONB-007' } })).riskRating).toBeNull();
  await page.goto('/onboarding/ONB-007');
  await expect(page.getByTestId('final-risk')).toHaveText('Not set');
});

test('cancelling the confirmation changes nothing', async ({ page }) => {
  await page.goto('/');
  const events = await db.auditEvent.count();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await expect(page.getByRole('button', { name: 'Reset demo data' })).toBeEnabled();
  expect(await db.auditEvent.count()).toBe(events);
  expect(await db.onboardingCase.count()).toBe(12);
});

test('the read-only role does not see the reset button and cannot call it', async ({ page }) => {
  await page.goto('/');
  await page.locator('#role').selectOption('read-only');
  await page.getByRole('button', { name: 'Switch role' }).click();
  await expect(page.getByRole('button', { name: 'Reset demo data' })).toHaveCount(0);
  const response = await page.request.post('/api/reset', { headers: { origin: 'http://127.0.0.1:3105' } });
  expect(response.status()).toBe(403);
});

test('saves and resets sent from another website are refused', async ({ request }) => {
  const before = await db.onboardingCase.findUniqueOrThrow({ where: { id: 'ONB-006' } });
  const headers = { origin: 'https://evil.example' };
  expect((await request.post('/api/reset', { headers })).status()).toBe(403);
  expect((await request.post('/api/onboarding', { headers, form: { id: 'ONB-006', action: 'set-risk', version: String(before.version), riskRating: 'High', riskRationale: 'Forged request from another site.' } })).status()).toBe(403);
  expect((await db.onboardingCase.findUniqueOrThrow({ where: { id: 'ONB-006' } })).riskRating).toBe(before.riskRating);
});
