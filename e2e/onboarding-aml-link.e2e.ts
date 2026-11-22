import { test, expect } from '@playwright/test';

test('an open funding alert blocks approval until it is reviewed on the alert page', async ({ page }) => {
  await page.goto('/onboarding/ONB-001');
  await expect(page.getByTestId('blockers')).toContainText('Alert ALT-001 has not been reviewed');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeDisabled();

  await page.locator('a[href="/cases/ALT-001"]').click();
  await expect(page).toHaveURL(/\/cases\/ALT-001$/);
  await page.getByLabel('ANALYST NOTE / REASON FOR ACTION').fill('Rapid movement reviewed; funds explained by the applicant.');
  await page.getByRole('button', { name: 'Save review' }).click();
  await expect(page.getByText('In review').first()).toBeVisible();

  await page.getByRole('link', { name: 'Back to KYC file ONB-001' }).click();
  await expect(page).toHaveURL(/\/onboarding\/ONB-001$/);
  await expect(page.getByTestId('blockers')).not.toContainText('ALT-001');
  await expect(page.getByTestId('suggested-risk')).toHaveText('Low');
});
