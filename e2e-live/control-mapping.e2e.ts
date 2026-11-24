import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {db} from '../src/lib/db';
import {controlFingerprint} from '../src/lib/control-review';
import {regulatoryReferences} from '../src/lib/regulatory-references';

test('a KYC memo may cite only a regulation with a current recorded review',async({page,request})=>{
 const file=process.env.KYC_ONBOARDING_CONTROL_REVIEWS_FILE!;
 const reference=regulatoryReferences.find(r=>r.id==='MAS-626-6.39-6.42')!;
 const review={id:reference.id,fingerprint:controlFingerprint(reference),reviewer:'Simulated reviewer',reviewedOn:'2025-08-01',expiresOn:'2099-12-31',scenarios:['screening']};
 const generate=()=>page.getByRole('button',{name:'Generate AI KYC memo'}).click();
 try {
  await request.post('http://127.0.0.1:3106/mode',{data:{mode:'control'}});
  await page.goto('/onboarding/ONB-010');
  // No review recorded: the citation is unavailable, so the memo is rejected.
  await generate();
  await expect(page.locator('p.form-error')).toContainText('invalid citations');

  await writeFile(file,JSON.stringify([review]));
  await generate();
  await expect(page.getByText('Simulated KYC draft citing a regulation',{exact:true})).toBeVisible();
  const latest=await db.onboardingAnalysis.findFirstOrThrow({where:{onboardingCaseId:'ONB-010',validation:'passed'},orderBy:{id:'desc'}});
  expect(JSON.parse(latest.inputSnapshot!).reviewed_controls.map((c:{id:string})=>c.id)).toContain(reference.id);
  expect(JSON.parse(latest.inputSnapshot!).recorded_control_reviews[0].reviewer).toBe('Simulated reviewer');

  const library=await page.context().newPage();
  await library.goto(`/controls#${reference.id}`);
  const source=library.locator(`[id="${reference.id}"]`);
  await expect(source).toContainText('Current review recorded');
  await expect(source).toContainText('Simulated reviewer');
  await source.getByText('Reference fingerprint').click();
  await expect(source).toContainText(review.fingerprint);

  // A review whose fingerprint no longer matches the reference stops counting.
  await writeFile(file,JSON.stringify([{...review,fingerprint:'stale'}]));
  await library.reload();
  await expect(source).toContainText('Not eligible for live analysis');
  await library.close();
  await generate();
  await expect(page.locator('p.form-error')).toContainText('invalid citations');
 } finally {
  await writeFile(file,'[]');
  await request.post('http://127.0.0.1:3106/mode',{data:{mode:'onboarding'}});
 }
});
