import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('transaction evidence retains its recorded currency, cents and direction',async({page})=>{
 await db.transaction.createMany({data:[
  {id:'TXN-USD-TEST',clientId:'CLI-012',accountId:'ACC-CLI-012',date:'2026-06-01',amount:-123456,currency:'USD',counterparty:'Fictional test counterparty'},
  {id:'TXN-SGD-TEST',clientId:'CLI-012',accountId:'ACC-CLI-012',date:'2026-06-02',amount:100001,currency:'SGD',counterparty:'Fictional test counterparty'}
 ]});
 try {
  await page.goto('/cases/ALT-012');
  await expect(page.locator('#TXN-USD-TEST')).toContainText('USD -1,234.56');
  await expect(page.locator('#TXN-SGD-TEST')).toContainText('SGD 1,000.01');
  await expect(page.getByText('Amounts in SGD · negative values are outgoing')).toHaveCount(0);
 } finally {await db.transaction.deleteMany({where:{id:{in:['TXN-USD-TEST','TXN-SGD-TEST']}}});}
});
