import { test, expect } from '@playwright/test';
import { db } from '../src/lib/db';

test('live KYC drafts are labelled, bad drafts are rejected, and a provider outage is never replaced by the template', async ({
  page,
  request
}) => {
  test.setTimeout(60000);
  async function mode(value: string) {
    expect((await request.post('http://127.0.0.1:3106/mode', { data: { mode: value } })).ok()).toBeTruthy();
  }
  const caseId = 'ONB-008';

  await mode('onboarding');
  await page.goto(`/onboarding/${caseId}`);
  await expect(page.getByText('AI', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Generate AI KYC memo' }).click();
  await expect(page.getByText('Simulated live KYC draft', { exact: true })).toBeVisible();
  await expect(page.getByText('Displayed memo: AI response')).toBeVisible();
  let records = await db.onboardingAnalysis.findMany({ where: { onboardingCaseId: caseId }, orderBy: { id: 'asc' } });
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({ mode: 'live', model: 'simulated-model', promptVersion: 'kyc-v1', validation: 'passed' });
  expect(JSON.parse(records[0].rawResponse!).id).toBe('resp-onboarding');
  expect(JSON.parse(records[0].inputSnapshot!).permitted_evidence_ids).toContain('SCR-001');

  // A draft that declares the applicant approved must be rejected and logged, not shown.
  await mode('onboarding_approve');
  await page.getByRole('button', { name: 'Generate AI KYC memo' }).click();
  await expect(page.locator('p.form-error')).toContainText('Previous memos are preserved');
  await expect(page.getByText('Simulated live KYC draft', { exact: true })).toBeVisible();
  await expect(page.getByText('The applicant is approved')).toHaveCount(0);
  records = await db.onboardingAnalysis.findMany({ where: { onboardingCaseId: caseId }, orderBy: { id: 'asc' } });
  const rejected = records.at(-1)!;
  expect(rejected).toMatchObject({ mode: 'live', validation: 'rejected' });
  expect(JSON.parse(rejected.rawResponse!).id).toBe('resp-onboarding_approve');

  // A provider outage is reported and recorded; the earlier draft stays and no template is substituted.
  await mode('provider_error');
  await page.getByRole('button', { name: 'Generate AI KYC memo' }).click();
  await expect(page.locator('p.form-error')).toContainText('Previous memos are preserved');
  await expect(page.getByText('Simulated live KYC draft', { exact: true })).toBeVisible();
  records = await db.onboardingAnalysis.findMany({ where: { onboardingCaseId: caseId }, orderBy: { id: 'asc' } });
  expect(records.map(r => [r.mode, r.validation])).toEqual([
    ['live', 'passed'],
    ['live', 'rejected'],
    ['live', 'provider_error']
  ]);
  expect(records.at(-1)!.rawResponse).toBeNull();
  expect(await db.onboardingAnalysis.count({ where: { onboardingCaseId: caseId, mode: 'fixture' } })).toBe(0);

  expect(await db.onboardingEvent.count({ where: { onboardingCaseId: caseId, action: 'AI KYC memo generated' } })).toBe(1);
  expect(await db.onboardingEvent.count({ where: { onboardingCaseId: caseId, action: 'AI KYC memo failed' } })).toBe(2);
  const events = await db.onboardingEvent.findMany({ where: { onboardingCaseId: caseId } });
  for (const record of records) {
    expect(events.filter(event => event.detail.includes(`Attempt ID: ${record.id};`))).toHaveLength(1);
  }
  expect(await db.analysisLock.count({ where: { alertId: caseId } })).toBe(0);

  await page.reload();
  await expect(page.getByText('Simulated live KYC draft', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: `View attempt ${rejected.id}` }).click();
  await expect(page.getByRole('heading', { name: `KYC memo attempt ${rejected.id}` })).toBeVisible();
  await expect(page.getByText('Rejected', { exact: true })).toBeVisible();
  await expect(page.getByText('resp-onboarding_approve')).toBeVisible();
});
