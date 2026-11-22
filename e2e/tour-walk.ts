import { expect, type Page } from '@playwright/test';
import { TOUR_STEPS, tourText } from '../src/lib/tour-steps';

// Collects anything the browser reports as an error, plus the tour's own "target not found" warning.
export function watchForProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', message => {
    const bad = message.type() === 'error' || (message.type() === 'warning' && message.text().includes('[tour]'));
    if (bad) problems.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', error => problems.push(`pageerror: ${error.message}`));
  return problems;
}

// Checks the bubble for one step: right page, right words, and the highlighted element really is
// the tagged target (no centred fallback). Step 1 is the only one that is meant to be centred.
export async function expectStep(page: Page, number: number, publicDemo: boolean) {
  const step = TOUR_STEPS[number - 1];
  const popover = page.locator('.driver-popover');
  await expect(page).toHaveURL(new RegExp(`${step.page}\\?tour=${number}$`));
  await expect(popover.locator('.driver-popover-progress-text')).toHaveText(`Step ${number} of ${TOUR_STEPS.length}`);
  await expect(popover.locator('.driver-popover-title')).toHaveText(step.title);
  await expect(popover.locator('.driver-popover-description')).toHaveText(tourText(step, publicDemo));
  if (step.target) {
    const target = page.locator(`[data-tour="${step.target}"]`);
    await expect(target).toHaveCount(1);
    await expect(target).toHaveClass(/driver-active-element/);
    await expect(target).toBeVisible();
    await expect(page.locator('#driver-dummy-element')).toHaveCount(0);
  } else {
    // With no target, driver.js highlights an invisible stand-in in the middle of the screen.
    await expect(page.locator('.driver-active-element')).toHaveAttribute('id', 'driver-dummy-element');
  }
}

// Starts at the queue, follows the tour with Next through all steps, and ends it with Finish.
export async function walkWholeTour(page: Page, publicDemo: boolean) {
  const problems = watchForProblems(page);
  await page.goto('/');
  for (let number = 1; number <= TOUR_STEPS.length; number++) {
    await expectStep(page, number, publicDemo);
    await page.locator('.driver-popover-next-btn').click();
  }
  await expect(page.locator('.driver-popover')).toHaveCount(0);
  await expect(page).not.toHaveURL(/tour=/);
  expect(problems).toEqual([]);
}
