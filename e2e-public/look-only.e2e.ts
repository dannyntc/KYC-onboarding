import { test, expect, type Page } from '@playwright/test';
import { db } from '../src/lib/db';

const ONLINE_ORIGIN = 'https://kyc-onboarding-dannyntc.vercel.app';

// Counts the tables a save would change. Look-only mode must leave all four untouched.
async function rowCounts() {
  return {
    analysis: await db.analysis.count(),
    onboardingAnalysis: await db.onboardingAnalysis.count(),
    onboardingEvent: await db.onboardingEvent.count(),
    auditEvent: await db.auditEvent.count()
  };
}

// Every button inside a form on the page is switched off, with no extra caption.
async function expectSaveButtonsDisabled(page: Page) {
  const buttons = page.locator('.content form button');
  const total = await buttons.count();
  expect(total).toBeGreaterThan(0);
  for (let i = 0; i < total; i++) await expect(buttons.nth(i)).toBeDisabled();
  await expect(page.locator('.content .lookonly-note')).toHaveCount(0);
}

test('the online demo shows no look-only banner or badge, and the role switch is on', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText("You're viewing the online demo.")).toHaveCount(0);
  await expect(page.locator('.topbar .demo')).toHaveCount(0);
  await expect(page.locator('#role')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Switch role' })).toBeEnabled();
  await expect(page.getByText('Switching role changes the view only; saving stays off online.')).toBeVisible();
});

test('role switching works in look-only mode, stays on the same page and writes nothing', async ({ page }) => {
  const before = await rowCounts();
  await page.goto('/onboarding/ONB-008');

  for (const role of ['read-only', 'senior-approver', 'analyst']) {
    await page.getByLabel('Demo role (not authentication)').selectOption(role);
    await page.getByRole('button', { name: 'Switch role' }).click();
    await expect(page).toHaveURL(/\/onboarding\/ONB-008$/);
    await expect(page.getByLabel('Demo role (not authentication)')).toHaveValue(role);
    if (role === 'read-only') {
      await expect(page.getByText('The read-only role cannot change onboarding files.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
    } else {
      // Saving stays off online for every role.
      await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeDisabled();
    }
  }

  expect(await rowCounts()).toEqual(before);
});

test('KYC file save buttons are disabled with a caption, and the draft is an unsaved preview', async ({ page }) => {
  const before = await rowCounts();

  await page.goto('/onboarding/ONB-002');
  await expectSaveButtonsDisabled(page);
  await expect(page.getByRole('button', { name: 'Generate fixture KYC draft' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Add draft to note' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeDisabled();

  const draft = page.locator('.draft');
  await expect(draft).toContainText('Preview of the template draft (not saved)');
  await expect(draft).toContainText('SGD 5,000,000');
  await expect(draft.locator('a.evidence-link', { hasText: 'DOC-002' }).first()).toBeVisible();

  await page.goto('/onboarding/ONB-009');
  await expectSaveButtonsDisabled(page);
  await expect(page.getByRole('button', { name: 'Clear as false positive' })).toBeDisabled();

  expect(await rowCounts()).toEqual(before);
});

test('the alert page is look-only too, with an unsaved draft preview', async ({ page }) => {
  const before = await rowCounts();
  await page.goto('/cases/ALT-001');
  await expectSaveButtonsDisabled(page);
  await expect(page.getByRole('button', { name: 'Generate fixture draft' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save review' })).toBeDisabled();
  await expect(page.locator('.notice', { hasText: 'Preview of the template draft (not saved)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Suggested action' })).toBeVisible();
  expect(await rowCounts()).toEqual(before);
});

test('opening every KYC file and alert page writes nothing to the database', async ({ page }) => {
  const before = await rowCounts();
  const cases = await db.onboardingCase.findMany({ select: { id: true }, orderBy: { id: 'asc' } });
  const alerts = await db.alert.findMany({ select: { id: true }, orderBy: { id: 'asc' } });
  expect(cases.length).toBe(12);
  for (const { id } of cases) {
    await page.goto(`/onboarding/${id}`);
    await expect(page.locator('.draft')).toContainText('Preview of the template draft (not saved)');
  }
  for (const { id } of alerts) {
    await page.goto(`/cases/${id}`);
    await expect(page.locator('.notice', { hasText: 'Preview of the template draft (not saved)' })).toBeVisible();
  }
  expect(await rowCounts()).toEqual(before);
});

test('direct saves from an online origin are still refused', async ({ request }) => {
  const before = await rowCounts();
  const headers = { origin: ONLINE_ORIGIN };
  const draft = await request.post('/api/onboarding', { headers, form: { id: 'ONB-002', action: 'analyze' } });
  expect(draft.status()).toBe(403);
  const approve = await request.post('/api/onboarding', { headers, form: { id: 'ONB-006', action: 'approve' } });
  expect(approve.status()).toBe(403);
  const alertDraft = await request.post('/api/action', { headers, form: { id: 'ALT-001', action: 'analyze' } });
  expect(alertDraft.status()).toBe(403);
  expect(await rowCounts()).toEqual(before);
});

test('a role switch from another site is still refused and sets no cookie', async ({ page }) => {
  const before = await rowCounts();
  for (const origin of [ONLINE_ORIGIN, 'http://evil.example', 'null']) {
    const response = await page.request.post('/api/role', { headers: { origin }, form: { role: 'senior-approver' } });
    expect(response.status()).toBe(403);
  }
  const noOrigin = await page.request.post('/api/role', { form: { role: 'senior-approver' } });
  expect(noOrigin.status()).toBe(403);
  expect((await page.context().cookies()).find(cookie => cookie.name === 'demo-role')).toBeUndefined();
  expect(await rowCounts()).toEqual(before);
});
