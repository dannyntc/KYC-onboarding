import { test, expect, type Page } from '@playwright/test';

// Phone width: the queue turns into cards.
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

// The label drawn in front of a card value comes from CSS, so read it from the browser.
const labelOf = (cell: ReturnType<Page['locator']>) =>
  cell.evaluate(element => getComputedStyle(element, '::before').content);

// True when the element sits fully inside the phone screen (nothing cut off on the right).
async function fitsOnScreen(cell: ReturnType<Page['locator']>) {
  const box = await cell.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(PHONE.width);
}

test.describe('on a phone', () => {
  test.use({ viewport: PHONE });

  test('each queue row is a card that shows its risk and status without sideways scrolling', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('tbody tr', { has: page.getByRole('link', { name: 'ONB-008', exact: true }) });
    await expect(card).toBeVisible();

    const risk = card.locator('td[data-label="Suggested risk"]');
    const status = card.locator('td[data-label="Status"]');
    await expect(risk).toBeVisible();
    // Other tests change screening decisions, so the rating itself can differ; only check that one is shown.
    await expect(risk).toHaveText(/^(High|Medium|Low)$/);
    await expect(status).toBeVisible();
    await expect(status).toHaveText(/\S/);
    expect(await labelOf(risk)).toBe('"Suggested risk"');
    expect(await labelOf(status)).toBe('"Status"');
    await fitsOnScreen(risk);
    await fitsOnScreen(status);

    const wrap = page.locator('.tablewrap').first();
    expect(await wrap.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('the tour still highlights the queue table and the outstanding items on a phone', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', message => {
      if (message.text().includes('[tour]')) warnings.push(message.text());
    });

    await page.goto('/?tour=6');
    await expect(page.locator('.driver-popover-progress-text')).toHaveText('Step 6 of 24');
    await expect(page.locator('[data-tour="queue-table"]')).toHaveClass(/driver-active-element/);

    await page.goto('/?tour=7');
    await expect(page.locator('.driver-popover-progress-text')).toHaveText('Step 7 of 24');
    const target = page.locator('[data-tour="outstanding-cell"]');
    await expect(target).toHaveCount(1);
    await expect(target).toHaveClass(/driver-active-element/);
    await expect(target).toBeVisible();
    await expect(page.locator('#driver-dummy-element')).toHaveCount(0);
    expect(warnings).toEqual([]);
  });
});

test.describe('on a desktop', () => {
  test.use({ viewport: DESKTOP });

  test('the queue table keeps its normal layout', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('thead').first()).toBeVisible();
    await expect(page.locator('tbody tr').first()).toHaveCSS('display', 'table-row');
  });
});
