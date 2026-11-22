import { test, expect } from '@playwright/test';
import { TOUR_STEPS } from '../src/lib/tour-steps';
import { expectStep, walkWholeTour, watchForProblems } from './tour-walk';

// These tests need a browser that has never seen the tour, unlike the rest of the suite.
test.use({ storageState: { cookies: [], origins: [] } });

const popover = (page: import('@playwright/test').Page) => page.locator('.driver-popover');

test('a first-time visitor is offered step 1 once, and closing it keeps it closed', async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto('/');
  await expectStep(page, 1, false);
  await expect(popover(page).locator('.driver-popover-prev-btn')).toBeHidden();

  await popover(page).locator('.driver-popover-close-btn').click();
  await expect(popover(page)).toHaveCount(0);
  await expect(page).not.toHaveURL(/tour=/);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Onboarding queue' })).toBeVisible();
  await expect(popover(page)).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('Next walks all 13 steps across the pages and Finish ends the tour', async ({ page }) => {
  await walkWholeTour(page, false);
});

test('local wording invites the visitor to try the buttons, which stay enabled', async ({ page }) => {
  await page.goto('/onboarding/ONB-006?tour=6');
  await expectStep(page, 6, false);
  await expect(popover(page).locator('.driver-popover-description')).toContainText('Try it here');
  await popover(page).locator('.driver-popover-close-btn').click();
  await expect(page.getByLabel('REASONS FOR RATING')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Save risk rating' })).toBeEnabled();
});

test('Back works within a page and across a page change', async ({ page }) => {
  await page.goto('/onboarding/ONB-006?tour=5');
  await expectStep(page, 5, false);
  await popover(page).locator('.driver-popover-prev-btn').click();
  await expectStep(page, 4, false);
  await popover(page).locator('.driver-popover-prev-btn').click();
  await expectStep(page, 3, false);
  await expect(page).toHaveURL(/\/\?tour=3$/);
  // driver.js ignores arrow keys while its 0.4 s fade-in is still running, so let it finish.
  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowRight');
  await expectStep(page, 4, false);
});

test('a tour address for another page takes the visitor to that page', async ({ page }) => {
  await page.goto('/?tour=7');
  await expectStep(page, 7, false);
  await expect(page).toHaveURL(/\/onboarding\/ONB-009\?tour=7$/);
});

test('Escape closes the tour', async ({ page }) => {
  await page.goto('/?tour=2');
  await expectStep(page, 2, false);
  await page.keyboard.press('Escape');
  await expect(popover(page)).toHaveCount(0);
  await expect(page).not.toHaveURL(/tour=/);
});

test('the sidebar button restarts the tour from step 1 on any page', async ({ page }) => {
  await page.goto('/');
  await popover(page).locator('.driver-popover-close-btn').click();
  await page.goto('/alerts');
  await expect(popover(page)).toHaveCount(0);
  await page.getByRole('link', { name: /Guided tour/ }).click();
  await expectStep(page, 1, false);
});

test('every tagged target exists exactly once on its page', async ({ page }) => {
  for (const step of TOUR_STEPS) {
    if (!step.target) continue;
    await page.goto(step.page);
    await expect(page.locator(`[data-tour="${step.target}"]`), `${step.page} ${step.target}`).toHaveCount(1);
  }
});
