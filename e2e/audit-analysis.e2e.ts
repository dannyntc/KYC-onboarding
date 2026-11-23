import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('each fixture generation is linked to its own audit event',async({page})=>{
 await page.goto('/cases/ALT-008');
 for(let i=0;i<2;i++) {
  await page.getByRole('button',{name:'Generate draft alert memo'}).click();
  await expect.poll(()=>db.analysis.count({where:{alertId:'ALT-008'}})).toBe(i+1);
  await expect(page.getByRole('button',{name:'Generate draft alert memo'})).toBeEnabled();
 }
 const attempts=await db.analysis.findMany({where:{alertId:'ALT-008'},orderBy:{id:'asc'}});
 const events=await db.auditEvent.findMany({where:{alertId:'ALT-008',action:'Template alert memo generated'}});
 expect(attempts).toHaveLength(2);
 expect(events).toHaveLength(2);
 for(const attempt of attempts) expect(events.filter(event=>event.detail.includes(`Attempt ID: ${attempt.id};`))).toHaveLength(1);
});
