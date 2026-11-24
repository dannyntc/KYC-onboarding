import { test, expect } from '@playwright/test';
import { db } from '../src/lib/db';

test('a fixture KYC draft shows the wealth gap with its citation and can be added to the note', async ({ page }) => {
  await page.goto('/onboarding/ONB-002');
  await expect(page.getByText('TEMPLATE', { exact: true })).toBeVisible();
  await expect(page.getByText('No KYC memos yet.')).toBeVisible();

  await page.getByRole('button', { name: 'Generate draft KYC memo' }).click();
  const assistant = page.locator('section', { has: page.getByRole('heading', { name: 'KYC memo builder' }) });
  await expect(assistant.getByText('Displayed memo: template (no AI used)')).toBeVisible();
  await expect(assistant.getByText('SGD 5,000,000 of declared wealth not corroborated').first()).toBeVisible();
  await expect(assistant.getByRole('link', { name: 'DOC-002' }).first()).toBeVisible();
  await expect(assistant.getByText('Suggestions for the analyst')).toBeVisible();
  await expect(assistant.getByText('Suggested next step: request information')).toBeVisible();

  await assistant.getByRole('link', { name: 'DOC-002' }).first().click();
  await expect(page.locator('[id="DOC-002"]')).toBeVisible();

  await page.getByRole('button', { name: 'Add draft to note' }).click();
  await expect(page.getByLabel('DECISION NOTE')).toHaveValue(/Suggested risk rating: High/);

  await assistant.getByText('View evidence used for this memo').click();
  await expect(assistant.getByText('permitted_evidence_ids')).toBeVisible();

  await expect(page.locator('.events li').filter({ hasText: 'Template KYC memo generated' })).toHaveCount(1);
  const attempts = await db.onboardingAnalysis.findMany({ where: { onboardingCaseId: 'ONB-002' } });
  expect(attempts).toHaveLength(1);
  expect(attempts[0]).toMatchObject({ mode: 'fixture', model: 'fixture', promptVersion: 'kyc-v1', validation: 'passed' });
  expect(await db.analysisLock.count({ where: { alertId: 'ONB-002' } })).toBe(0);
  await expect(page.getByRole('link', { name: `View attempt ${attempts[0].id}` })).toBeVisible();
});
