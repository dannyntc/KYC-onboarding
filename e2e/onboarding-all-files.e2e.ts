import { test, expect } from '@playwright/test';
import { db } from '../src/lib/db';
import { evidenceIdsFor, loadOnboardingFile } from '../src/lib/onboarding-file';

test('all twelve KYC files open and show every record they can cite', async ({ page }) => {
  test.setTimeout(120000);
  const cases = await db.onboardingCase.findMany({ orderBy: { id: 'asc' }, include: { client: true } });
  expect(cases).toHaveLength(12);
  for (const onboarding of cases) {
    const loaded = await loadOnboardingFile(onboarding.id);
    const response = await page.goto(`/onboarding/${onboarding.id}`);
    expect(response?.status(), onboarding.id).toBe(200);
    await expect(page.getByRole('heading', { name: onboarding.client.name, exact: true })).toBeVisible();
    const ids = evidenceIdsFor(loaded!);
    const missing = await page.evaluate(ids => ids.filter(id => !document.getElementById(id)), ids);
    expect(missing, `Missing evidence in ${onboarding.id}`).toEqual([]);
  }
});
