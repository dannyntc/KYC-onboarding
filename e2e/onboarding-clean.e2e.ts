import { test, expect } from '@playwright/test';
import { db } from '../src/lib/db';

test('a clean applicant is rated, approved and audited with before and after values', async ({ page }) => {
  await page.goto('/onboarding/ONB-006');
  await expect(page.getByTestId('suggested-risk')).toHaveText('Low');
  await expect(page.getByTestId('blockers')).toContainText('Record a final risk rating and reasons');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeDisabled();

  await page.getByLabel('FINAL RISK RATING').selectOption('Low');
  await page.getByLabel('REASONS FOR RATING').fill('Documents verified, no screening hits, income corroborated.');
  await page.getByRole('button', { name: 'Save risk rating' }).click();
  await expect(page.getByTestId('final-risk')).toHaveText('Low');
  await expect(page.getByText('Ready for decision')).toBeVisible();

  await page.getByLabel('DECISION NOTE').fill('All onboarding checks complete.');
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(page.getByTestId('onboarding-status')).toHaveText('Approved');
  await expect(page.getByText('Decision recorded: Approved')).toBeVisible();

  await expect(page.locator('.events li')).toHaveCount(2);
  const events = await db.onboardingEvent.findMany({ where: { onboardingCaseId: 'ONB-006' }, orderBy: { id: 'asc' } });
  expect(events.map(e => [e.action, e.actor])).toEqual([
    ['Risk rating saved', 'Demo analyst'],
    ['Approved', 'Demo analyst']
  ]);
  expect(JSON.parse(events[0].detail)).toEqual({
    before: { riskRating: null, riskRationale: '' },
    after: { riskRating: 'Low', riskRationale: 'Documents verified, no screening hits, income corroborated.' }
  });
  expect(JSON.parse(events[1].detail)).toEqual({
    before: { status: 'In progress', notes: '' },
    after: { status: 'Approved', notes: 'All onboarding checks complete.' }
  });
  await page.getByText('View recorded details').first().click();
  await expect(page.locator('.audit-detail').first()).toContainText('"before"');
});
