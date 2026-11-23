import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {db} from '../src/lib/db';
import {controlFingerprint} from '../src/lib/control-review';
import {regulatoryReferences} from '../src/lib/regulatory-references';

test('only an attested, current control can be returned and traced to the source',async({page,request})=>{
 const file=process.env.KYC_ONBOARDING_CONTROL_REVIEWS_FILE!;
 const reference=regulatoryReferences.find(r=>r.id==='MAS-626-6.20')!;
 const review={id:reference.id,fingerprint:controlFingerprint(reference),reviewer:'Simulated reviewer',reviewedOn:'2025-08-01',expiresOn:'2099-12-31',scenarios:['rapid_movement']};
 try {
  await request.post('http://127.0.0.1:3106/mode',{data:{mode:'control'}});
  await page.goto('/cases/ALT-005');
  await page.getByRole('button',{name:'Generate AI alert memo'}).click();
  await expect(page.locator('.form-error')).toContainText('invalid citations');
  await writeFile(file,JSON.stringify([review]));
  await page.getByRole('button',{name:'Generate AI alert memo'}).click();
  const assistant=page.locator('section').filter({has:page.getByRole('heading',{name:'Alert memo assistant'})});
  await expect(assistant.getByRole('link',{name:reference.id})).toHaveAttribute('href',`/controls#${reference.id}`);
  const library=await page.context().newPage();
  await library.goto(`/controls#${reference.id}`);
  const source=library.locator(`[id="${reference.id}"]`);
  await expect(source).toContainText('Current review recorded');
  await expect(source).toContainText('Simulated reviewer');
  await source.getByText('Reference fingerprint').click();
  await expect(source).toContainText(review.fingerprint);
  const latest=await db.analysis.findFirstOrThrow({where:{alertId:'ALT-005',validation:'passed'},orderBy:{id:'desc'}});
  expect(JSON.parse(latest.inputSnapshot!).reviewed_controls.map((c:{id:string})=>c.id)).toEqual([reference.id]);
  expect(JSON.parse(latest.inputSnapshot!).recorded_control_reviews[0].reviewer).toBe('Simulated reviewer');
  await writeFile(file,JSON.stringify([{...review,fingerprint:'stale'}]));
  await library.reload();
  await expect(source).toContainText('Not eligible for live analysis');
  await library.close();
  await page.getByRole('button',{name:'Generate AI alert memo'}).click();
  await expect(page.locator('.form-error')).toContainText('invalid citations');
  await expect(assistant.getByRole('link',{name:reference.id})).toBeVisible();
 } finally {
  await writeFile(file,'[]');
  await request.post('http://127.0.0.1:3106/mode',{data:{mode:'success'}});
 }
});
