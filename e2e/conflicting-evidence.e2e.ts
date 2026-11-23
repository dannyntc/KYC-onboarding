import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('conflicting source-of-wealth evidence is visible and cited for reconciliation',async({page})=>{
 await db.kYCDocument.create({data:{id:'DOC-CONFLICT',clientId:'CLI-002',kind:'company_sale',title:'Conflicting sale extract',summary:'Fictional conflicting extract.',corroboratedAmount:600000000}});
 try {
  await page.goto('/cases/ALT-002');
  await page.getByRole('button',{name:'Generate draft alert memo'}).click();
  const conflict=page.getByText('Company-sale records report different amounts.');
  await expect(conflict.getByRole('link',{name:'DOC-002'})).toBeVisible();
  await expect(conflict.getByRole('link',{name:'DOC-CONFLICT'})).toBeVisible();
  await expect(page.getByText(/Reconcile the conflicting company-sale records/)).toBeVisible();
  await expect(page.getByText(/The declared wealth exceeds the amount/)).toHaveCount(0);
 } finally {await db.kYCDocument.delete({where:{id:'DOC-CONFLICT'}});}
});

test('different property-sale amounts are visible and require reconciliation',async({page})=>{
 await db.kYCDocument.create({data:{id:'DOC-SALE-DIFFERENT',clientId:'CLI-004',kind:'property_sale',title:'Another fictional sale extract',summary:'A sale extract with different proceeds.',corroboratedAmount:100000000}});
 try {
  await page.goto('/cases/ALT-004');
  await page.getByRole('button',{name:'Generate draft alert memo'}).click();
  const difference=page.getByText('Property-sale records report different amounts.');
  await expect(difference.getByRole('link',{name:'DOC-004'})).toBeVisible();
  await expect(difference.getByRole('link',{name:'DOC-SALE-DIFFERENT'})).toBeVisible();
  await expect(page.getByText(/Reconcile the property-sale records/)).toBeVisible();
  await expect(page.getByText('The property-sale agreement records proceeds matching the incoming payment.')).toHaveCount(0);
 } finally {await db.kYCDocument.delete({where:{id:'DOC-SALE-DIFFERENT'}});}
});
