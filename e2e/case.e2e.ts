import {test,expect} from '@playwright/test';
test('analyst reviews grounded fixture and sees a persistent audit event',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('link',{name:'ALT-002'})).toBeVisible();
 await page.getByRole('link',{name:'ALT-002'}).click();
 await page.getByRole('button',{name:'Generate fixture draft'}).click();
 await expect(page.getByText('The declared sale amount exceeds the corroborated amount by SGD 5 million.')).toBeVisible();
 await expect(page.getByRole('link',{name:'DOC-002'})).toBeVisible();
 await page.getByLabel('ANALYST NOTE / REASON FOR ACTION').fill('Request sale proceeds confirmation');
 await page.getByRole('button',{name:'Request information'}).click();
 await expect(page.getByText('Information requested').first()).toBeVisible();
 await page.reload();
 await expect(page.getByLabel('ANALYST NOTE / REASON FOR ACTION')).toHaveValue('Request sale proceeds confirmation');
 await page.getByText('View recorded details').first().click();
 await expect(page.getByText(/Request sale proceeds confirmation/).last()).toBeVisible();
});
test('read-only role rejects mutations',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Demo role (not authentication)').selectOption('read-only');
 await page.getByRole('button',{name:'Switch role'}).click();
 const response=await page.request.post('/api/action',{headers:{origin:'http://127.0.0.1:3105'},form:{id:'ALT-001',action:'analyze'}});
 expect(response.status()).toBe(403);
});
