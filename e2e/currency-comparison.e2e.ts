import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('foreign-currency trigger requests an SGD comparison instead of applying the SGD threshold',async({page})=>{
 const ids=['TXN-069','TXN-070'];
 await db.transaction.updateMany({where:{id:{in:ids}},data:{currency:'USD'}});
 try {
  await page.goto('/cases/ALT-005');
  await page.getByRole('button',{name:'Generate draft alert memo'}).click();
  await expect(page.getByText(/obtain a comparable SGD amount/)).toBeVisible();
  await expect(page.getByText('The incoming payment exceeds the expected activity range.')).toHaveCount(0);
  await expect(page.getByText('An outgoing payment was recorded within two calendar days of the incoming payment.')).toHaveCount(0);
  await expect(page.locator('#TXN-069')).toContainText('USD 1,200,000.00');
 } finally {await db.transaction.updateMany({where:{id:{in:ids}},data:{currency:'SGD'}});}
});
