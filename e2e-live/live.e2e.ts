import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('live provider successes and failures preserve drafts and audit records',async({page,request})=>{
 test.setTimeout(60000);
 async function mode(value:string){expect((await request.post('http://127.0.0.1:3106/mode',{data:{mode:value}})).ok()).toBeTruthy();}
 await mode('success');
 await page.goto('/cases/ALT-001');
 await expect(page.getByText('AI',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Generate AI alert memo'}).click();
 await expect(page.getByText('Simulated live draft')).toBeVisible();
 let records=await db.analysis.findMany({where:{alertId:'ALT-001'},orderBy:{id:'asc'}});
 expect(records).toHaveLength(1);
 expect(records[0]).toMatchObject({mode:'live',model:'simulated-model',promptVersion:'v3',validation:'passed'});
 expect(JSON.parse(records[0].rawResponse!).id).toBe('resp-success');
 const snapshot=JSON.parse(records[0].inputSnapshot!);
 expect(snapshot.permitted_evidence_ids).toContain('TXN-013');
 expect(snapshot.case_context.client.transactions.find((t:{id:string})=>t.id==='TXN-013').amount).toBe(120000000);
 for(const [providerMode,validation] of [['invalid_citation','rejected'],['malformed','rejected'],['blank','rejected'],['provider_error','provider_error'],['timeout','provider_error']] as const){
  await mode(providerMode);
  await page.getByRole('button',{name:'Generate AI alert memo'}).click();
  await expect(page.locator('.form-error')).toContainText('Previous drafts are preserved',{timeout:providerMode==='timeout'?45000:5000});
  await expect(page.getByText('Simulated live draft')).toBeVisible();
  records=await db.analysis.findMany({where:{alertId:'ALT-001'},orderBy:{id:'asc'}});
  const failed=records.at(-1)!;
  expect(failed.validation).toBe(validation);
  expect(failed.mode).toBe('live');
  expect(failed.promptVersion).toBe('v3');
  expect(JSON.parse(failed.inputSnapshot!).permitted_evidence_ids).toContain('TXN-013');
  if(providerMode==='provider_error'||providerMode==='timeout') expect(failed.rawResponse).toBeNull();
  else expect(JSON.parse(failed.rawResponse!).id).toBe(`resp-${providerMode}`);
 }
 expect(records.map(r=>r.validation)).toEqual(['passed','rejected','rejected','rejected','provider_error','provider_error']);
 expect(await db.auditEvent.count({where:{alertId:'ALT-001',action:'AI alert memo failed'}})).toBe(5);
 expect(await db.auditEvent.count({where:{alertId:'ALT-001',action:'AI alert memo generated'}})).toBe(1);
 const events=await db.auditEvent.findMany({where:{alertId:'ALT-001',action:{in:['AI alert memo generated','AI alert memo failed']}}});
 for(const record of records) expect(events.filter(event=>event.detail.includes(`Attempt ID: ${record.id};`))).toHaveLength(1);
 expect(await db.analysisLock.count({where:{alertId:'ALT-001'}})).toBe(0);
 await page.reload();
 await expect(page.getByText('Simulated live draft')).toBeVisible();
 await page.getByRole('link',{name:`View attempt ${records[1].id}`}).click();
 await expect(page.getByRole('heading',{name:`Analysis attempt ${records[1].id}`})).toBeVisible();
 await expect(page.getByText('Rejected',{exact:true})).toBeVisible();
 await expect(page.getByText('resp-invalid_citation',{exact:false})).toBeVisible();
 await expect(page.getByText('TXN-013',{exact:false})).toBeVisible();
});
