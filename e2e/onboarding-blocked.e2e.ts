import { test, expect } from '@playwright/test';
import { db } from '../src/lib/db';

test('an expired passport blocks approval, even for a direct request, and information can be requested', async ({ page }) => {
  await page.goto('/onboarding/ONB-007');
  await expect(page.getByTestId('blockers')).toContainText('Passport IDV-013 is Expired');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeDisabled();

  const before = await db.onboardingCase.findUniqueOrThrow({ where: { id: 'ONB-007' } });
  const response = await page.request.post('/api/onboarding', {
    headers: { origin: 'http://127.0.0.1:3105' },
    form: { id: 'ONB-007', action: 'approve', version: String(before.version) }
  });
  expect(response.status()).toBe(422);
  expect(await response.text()).toContain('Passport IDV-013 is Expired');
  const after = await db.onboardingCase.findUniqueOrThrow({ where: { id: 'ONB-007' } });
  expect(after.status).toBe(before.status);
  expect(after.version).toBe(before.version);

  await page.getByLabel('DECISION NOTE').fill('Please send a valid passport.');
  await page.getByRole('button', { name: 'Request information' }).click();
  await expect(page.getByTestId('onboarding-status')).toHaveText('Information requested');
});
