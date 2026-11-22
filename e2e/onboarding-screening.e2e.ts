import { test, expect } from '@playwright/test';

test('a screening false positive needs a reason and then lowers the suggested risk', async ({ page }) => {
  await page.goto('/onboarding/ONB-009');
  await expect(page.getByTestId('suggested-risk')).toHaveText('High');

  await page.getByRole('button', { name: 'Clear as false positive' }).click();
  await expect(page.locator('p.form-error')).toContainText('at least 10 characters');
  await expect(page.locator('#SCR-002')).toContainText('Potential match');

  await page.getByLabel('REASON FOR DECISION').fill('Different birth year and nationality.');
  await page.getByRole('button', { name: 'Clear as false positive' }).click();
  await expect(page.locator('#SCR-002')).toContainText('Cleared – false positive');
  await expect(page.locator('#SCR-002')).toContainText('Different birth year and nationality.');
  await expect(page.getByTestId('suggested-risk')).toHaveText('Low');
});
