import { test, expect, type Locator, type Page } from '@playwright/test';

// The transaction tables must show their Amount column without sideways scrolling on common desktop
// widths. When a table does not fit (phones), the scroll hint shows and the fade goes at the last column.
const DESKTOPS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];
// Each page with the id of one transaction row in its table (the 13th row of each client's activity).
const PAGES = [
  { path: '/cases/ALT-001', txn: 'TXN-013' },
  { path: '/onboarding/ONB-002', txn: 'TXN-027' },
];

// The scroll area of the table that holds the given transaction row.
const tableWrap = (page: Page, txn: string) => page.locator('.tablewrap', { has: page.locator(`#${txn}`) });

// Fails unless the element sits fully inside the visible box of the table's scroll area.
async function expectInsideTableBox(page: Page, txn: string, selector: string) {
  const wrap = await tableWrap(page, txn).boundingBox();
  const box = await tableWrap(page, txn).locator(selector).first().boundingBox();
  expect(wrap, 'table box').not.toBeNull();
  expect(box, selector).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(wrap!.x);
  expect(box!.x + box!.width).toBeLessThanOrEqual(wrap!.x + wrap!.width);
}

// Every KYC file that raises transaction alerts; each shows the same four-column alerts table.
const FILES_WITH_ALERTS = ['ONB-001', 'ONB-002', 'ONB-003', 'ONB-004', 'ONB-005'];

// Fails unless the element sits fully inside the visible box of the given scroll area.
async function expectInsideBox(wrap: Locator, target: Locator) {
  const wrapBox = await wrap.boundingBox();
  const box = await target.boundingBox();
  expect(wrapBox, 'table box').not.toBeNull();
  expect(box, 'element box').not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(wrapBox!.x);
  expect(box!.x + box!.width).toBeLessThanOrEqual(wrapBox!.x + wrapBox!.width);
}

for (const viewport of DESKTOPS) {
  test.describe(`at ${viewport.width}px wide`, () => {
    test.use({ viewport });

    for (const { path, txn } of PAGES) {
      test(`${path} shows the Amount column without scrolling`, async ({ page }) => {
        await page.goto(path);
        const wrap = tableWrap(page, txn);
        await expect(wrap.locator('th.amount')).toBeVisible();
        await expectInsideTableBox(page, txn, 'th.amount');
        await expectInsideTableBox(page, txn, `#${txn} td.amount`);

        const sizes = await wrap.evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
        expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
        await expect(page.locator('.swipe', { has: page.locator(`#${txn}`) }).locator('.swipe-hint')).toBeHidden();
      });
    }

    for (const file of FILES_WITH_ALERTS) {
      test(`/onboarding/${file} shows the alert Status column without scrolling`, async ({ page }) => {
        await page.goto(`/onboarding/${file}`);
        const wrap = page.locator('.tablewrap', { has: page.locator('th.title') });
        await expect(wrap.locator('th', { hasText: 'STATUS' })).toBeVisible();
        await expectInsideBox(wrap, wrap.locator('th', { hasText: 'STATUS' }));
        const statusCells = wrap.locator('tbody tr td:last-child');
        expect(await statusCells.count()).toBeGreaterThan(0);
        for (const cell of await statusCells.all()) await expectInsideBox(wrap, cell);
        await expect(page.locator('.swipe', { has: page.locator('th.title') }).locator('.swipe-hint')).toBeHidden();
      });
    }
  });
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the hint shows, and the fade goes once the table is scrolled to the end', async ({ page }) => {
    await page.goto('/cases/ALT-001');
    const swipe = page.locator('.swipe', { has: page.locator('#TXN-013') });
    const wrap = tableWrap(page, 'TXN-013');
    await expect(swipe.locator('.swipe-hint')).toBeVisible();
    await expect(swipe.locator('.swipe-hint')).toHaveText('Scroll sideways to see all columns →');
    await expect.poll(() => wrap.evaluate(el => getComputedStyle(el).maskImage)).not.toBe('none');

    await wrap.evaluate(el => el.scrollTo({ left: el.scrollWidth }));
    await expect.poll(() => wrap.evaluate(el => getComputedStyle(el).maskImage)).toBe('none');
  });
});
