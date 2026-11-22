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
test('a stale review stays on the case and keeps the unsaved note',async({browser})=>{
 const context=await browser.newContext();
 const first=await context.newPage(); const second=await context.newPage();
 await first.goto('http://127.0.0.1:3105/cases/ALT-005');
 await second.goto('http://127.0.0.1:3105/cases/ALT-005');
 await first.getByLabel('ANALYST NOTE / REASON FOR ACTION').fill('First review');
 await first.getByRole('button',{name:'Save review'}).click();
 await expect(first.getByText('In review').first()).toBeVisible();
 await second.getByLabel('ANALYST NOTE / REASON FOR ACTION').fill('Unsaved review to preserve');
 await second.getByRole('button',{name:'Save review'}).click();
 await expect(second.locator('.form-error')).toContainText('This case changed');
 await expect(second.getByLabel('ANALYST NOTE / REASON FOR ACTION')).toHaveValue('Unsaved review to preserve');
 await context.close();
});
for(const scenario of [
 {id:'ALT-001',finding:'The incoming payment exceeds the expected activity range.',citation:'TXN-013'},
 {id:'ALT-002',finding:'The declared sale amount exceeds the corroborated amount by SGD 5 million.',citation:'DOC-002'},
 {id:'ALT-003',finding:'An ownership record identifies a beneficial owner of the holding entity; examine other linked accounts.',citation:'REL-001'},
 {id:'ALT-004',finding:'The property-sale agreement records proceeds matching the incoming payment.',citation:'DOC-004'},
]) test(`fixture evidence is traceable for ${scenario.id}`,async({page})=>{
 await page.goto(`/cases/${scenario.id}`);
 await page.getByRole('button',{name:'Generate fixture draft'}).click();
 await expect(page.getByText(scenario.finding)).toBeVisible();
 await page.getByRole('link',{name:scenario.citation}).first().click();
 await expect(page.locator(`[id="${scenario.citation}"]`)).toBeVisible();
});
