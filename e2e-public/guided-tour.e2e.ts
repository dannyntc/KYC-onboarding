import { test, expect } from '@playwright/test';
import { db } from '../src/lib/db';
import { walkWholeTour } from '../e2e/tour-walk';

// This browser has never seen the tour, so it is offered automatically.
test.use({ storageState: { cookies: [], origins: [] } });

test('the whole tour runs in look-only mode with the online wording and writes nothing', async ({ page }) => {
  const before = {
    onboardingAnalysis: await db.onboardingAnalysis.count(),
    onboardingEvent: await db.onboardingEvent.count()
  };

  await walkWholeTour(page, true);

  expect({
    onboardingAnalysis: await db.onboardingAnalysis.count(),
    onboardingEvent: await db.onboardingEvent.count()
  }).toEqual(before);
});

test('the online decision step shows the shorter online wording, and the buttons are switched off', async ({ page }) => {
  await page.goto('/onboarding/ONB-006?tour=12');
  await expect(page.locator('.driver-popover-description')).toHaveText(
    'Once a final rating is saved, Approve unlocks. The analyst can also Reject, or Request information from the applicant, with a note each time.'
  );
  await page.locator('.driver-popover-close-btn').click();
  await expect(page.getByRole('button', { name: 'Save risk rating' })).toBeDisabled();
});
