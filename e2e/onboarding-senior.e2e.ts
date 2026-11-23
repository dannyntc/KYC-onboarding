import { test, expect } from '@playwright/test';
import { db } from '../src/lib/db';

test('a confirmed PEP needs senior approval, which a senior approver gives', async ({ page }) => {
  await page.goto('/onboarding/ONB-008');
  await page.getByLabel('REASON FOR DECISION').fill('Name, birth date and nationality all match the list entry.');
  await page.getByRole('button', { name: 'Confirm match' }).click();
  await expect(page.getByTestId('suggested-risk')).toHaveText('High');

  await page.getByLabel('FINAL RISK RATING').selectOption('High');
  await page.getByLabel('REASONS FOR RATING').fill('Confirmed PEP; enhanced due diligence required.');
  await page.getByRole('button', { name: 'Save risk rating' }).click();
  await expect(page.getByTestId('final-risk')).toHaveText('High');
  await expect(page.getByTestId('blockers')).toContainText('High-risk applicants need senior approval');

  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(page.getByTestId('onboarding-status')).toHaveText('Pending senior approval');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeDisabled();

  await page.getByLabel('Demo role (not authentication)').selectOption('senior-approver');
  await page.getByRole('button', { name: 'Switch role' }).click();
  // The switch returns to the same file, so the senior approver sees the new button straight away.
  await expect(page).toHaveURL(/\/onboarding\/ONB-008$/);
  await page.getByRole('button', { name: 'Give senior approval' }).click();
  await expect(page.getByTestId('onboarding-status')).toHaveText('Approved');

  const events = await db.onboardingEvent.findMany({ where: { onboardingCaseId: 'ONB-008' }, orderBy: { id: 'asc' } });
  expect(events.map(e => [e.action, e.actor])).toEqual([
    ['Screening decision recorded', 'Demo analyst'],
    ['Risk rating saved', 'Demo analyst'],
    ['Pending senior approval', 'Demo analyst'],
    ['Approved', 'Demo senior approver']
  ]);
  await expect(page.getByText('Demo senior approver')).toBeVisible();
});
