import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('a generated draft keeps the evidence used even if the current record changes',async({page})=>{
 await page.goto('/cases/ALT-001');
 const previous=await db.analysis.count({where:{alertId:'ALT-001'}});
 await page.getByRole('button',{name:'Generate fixture draft'}).click();
 await expect.poll(()=>db.analysis.count({where:{alertId:'ALT-001'}})).toBe(previous+1);
 const [record]=await db.$queryRawUnsafe<{id:number;inputSnapshot:string|null}[]>(`SELECT id,inputSnapshot FROM Analysis WHERE alertId = 'ALT-001' ORDER BY id DESC LIMIT 1`);
 const saved=JSON.parse(record.inputSnapshot!);
 expect(saved.case_context.client.transactions.find((t:{id:string})=>t.id==='TXN-013').amount).toBe(120000000);
 expect(saved.permitted_evidence_ids).toContain('TXN-013');
 expect(saved.fixture_scenario).toBe('rapid_movement');
 await db.transaction.update({where:{id:'TXN-013'},data:{amount:42}});
 try {
 await page.reload();
 await page.getByText('View evidence used for this draft').click();
 await expect(page.locator('.audit-detail').filter({hasText:'TXN-013'})).toContainText('120000000');
 const unchanged=await db.analysis.findUniqueOrThrow({where:{id:record.id}});
 expect(unchanged.inputSnapshot).toBe(record.inputSnapshot);
 } finally {await db.transaction.update({where:{id:'TXN-013'},data:{amount:120000000}});}
});
