import {test,expect} from '@playwright/test';
test('analyst reviews grounded fixture and sees a persistent audit event',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('link',{name:'ALT-002'})).toBeVisible();
 await page.getByRole('link',{name:'ALT-002'}).click();
 await page.getByRole('button',{name:'Generate fixture draft'}).click();
 await expect(page.getByText('The declared wealth exceeds the amount in the company-sale record by SGD 5,000,000.')).toBeVisible();
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
 {id:'ALT-002',finding:'The declared wealth exceeds the amount in the company-sale record by SGD 5,000,000.',citation:'DOC-002'},
 {id:'ALT-003',finding:'The ownership records identify the same beneficial owner and holding entity across two clients.',citation:'REL-001'},
 {id:'ALT-004',finding:'The property-sale agreement records proceeds matching the incoming payment.',citation:'DOC-004'},
]) test(`fixture evidence is traceable for ${scenario.id}`,async({page})=>{
 await page.goto(`/cases/${scenario.id}`);
 await page.getByRole('button',{name:'Generate fixture draft'}).click();
 await expect(page.getByText(scenario.finding)).toBeVisible();
 await page.getByRole('link',{name:scenario.citation}).first().click();
 await expect(page.locator(`[id="${scenario.citation}"]`)).toBeVisible();
});
test('linked ownership draft cites both client relationship records',async({page})=>{
 await page.goto('/cases/ALT-003');
 await page.getByRole('button',{name:'Generate fixture draft'}).click();
 const finding=page.getByText('The ownership records identify the same beneficial owner and holding entity across two clients.');
 await expect(finding).toBeVisible();
 await expect(finding.getByRole('link',{name:'REL-001'})).toBeVisible();
 await finding.getByRole('link',{name:'REL-002'}).click();
 await expect(page.locator('[id="REL-002"]')).toContainText('Cedar Harbour Holdings');
});
test('analyst can add the draft to their note without losing existing text',async({page})=>{
 await page.goto('/cases/ALT-006');
 await page.getByRole('button',{name:'Generate fixture draft'}).click();
 const original=await page.locator('#draft-case-note').textContent();
 const notes=page.getByLabel('ANALYST NOTE / REASON FOR ACTION');
 await notes.fill('My existing observation.');
 await page.getByRole('button',{name:'Add draft to analyst note'}).click();
 await expect(notes).toHaveValue(`My existing observation.\n\n${original}`);
 await notes.fill('My revised analyst decision.');
 await page.getByRole('button',{name:'Save review'}).click();
 await expect(page.locator('#draft-case-note')).toHaveText(original!);
 await expect(notes).toHaveValue('My revised analyst decision.');
});
test('generating a draft preserves an unsaved analyst note',async({page})=>{
 await page.goto('/cases/ALT-008');
 const notes=page.getByLabel('ANALYST NOTE / REASON FOR ACTION');
 await notes.fill('Unsaved investigation notes');
 await page.getByRole('button',{name:'Generate fixture draft'}).click();
 await expect(page.getByText('Review any property-sale evidence and payment trail before a human decision.').first()).toBeVisible();
 await expect(notes).toHaveValue('Unsaved investigation notes');
});
test('refreshing a draft does not hide a concurrent review conflict',async({browser})=>{
 const context=await browser.newContext();
 const first=await context.newPage();const second=await context.newPage();
 await first.goto('http://127.0.0.1:3105/cases/ALT-009');
 await second.goto('http://127.0.0.1:3105/cases/ALT-009');
 await first.getByLabel('ANALYST NOTE / REASON FOR ACTION').fill('My unsaved note');
 await second.getByLabel('ANALYST NOTE / REASON FOR ACTION').fill('Another analyst saved this');
 await second.getByRole('button',{name:'Save review'}).click();
 await expect(second.getByText('In review').first()).toBeVisible();
 await first.getByRole('button',{name:'Generate fixture draft'}).click();
 await expect(first.getByText('In review').first()).toBeVisible();
 await expect(first.getByLabel('ANALYST NOTE / REASON FOR ACTION')).toHaveValue('My unsaved note');
 await first.getByRole('button',{name:'Save review'}).click();
 await expect(first.locator('.form-error')).toContainText('This case changed');
 await expect(first.getByLabel('ANALYST NOTE / REASON FOR ACTION')).toHaveValue('My unsaved note');
 await context.close();
});
test('switching to a related case does not carry the prior case note',async({page})=>{
 await page.goto('/cases/ALT-003');
 await page.getByLabel('ANALYST NOTE / REASON FOR ACTION').fill('Note for the first client only');
 await page.getByRole('link',{name:'Nadia Rahman'}).click();
 await expect(page).toHaveURL(/\/cases\/ALT-007$/);
 await expect(page.getByLabel('ANALYST NOTE / REASON FOR ACTION')).toHaveValue('');
});
test('case shows traceable candidate source references and their review status',async({page})=>{
 await page.goto('/cases/ALT-003');
 await expect(page.getByRole('heading',{name:'Candidate regulatory references'})).toBeVisible();
 await page.getByRole('link',{name:'MAS-626-6.14B'}).click();
 await expect(page).toHaveURL(/\/controls#MAS-626-6\.14B$/);
 const source=page.locator('[id="MAS-626-6.14B"]');
 await expect(source).toContainText('Compliance review required');
 await expect(source.getByRole('link',{name:'Open MAS Notice 626 paragraph 6.14B'})).toHaveAttribute('href',/mas\.gov\.sg.*#page=14$/);
});
test('account identifiers connect a client and their transaction evidence',async({page})=>{
 await page.goto('/cases/ALT-003');
 await expect(page.getByText('ACC-CLI-003').first()).toBeVisible();
 await expect(page.locator('#TXN-041')).toContainText('ACC-CLI-003');
 await expect(page.locator('#REL-002')).toContainText('ACC-CLI-007');
});

test('rapid-movement fixture links the incoming and outgoing transactions',async({page})=>{
 await page.goto('/cases/ALT-001');
 await page.getByRole('button',{name:'Generate fixture draft'}).click();
 const finding=page.getByText('An outgoing payment was recorded within two calendar days of the incoming payment.');
 await expect(finding.getByRole('link',{name:'TXN-013'})).toBeVisible();
 await finding.getByRole('link',{name:'TXN-014'}).click();
 await expect(page.locator('#TXN-014')).toBeVisible();
});
test('property-sale evidence shows the fictional parties and missing settlement trail',async({page})=>{
 await page.goto('/cases/ALT-004');
 const agreement=page.locator('#DOC-004');
 await expect(agreement).toContainText('seller Marcus Lee');
 await expect(agreement).toContainText('buyer Harbour Property Buyer');
 await expect(agreement).toContainText('completion 2026-05-10');
 await expect(agreement).toContainText('Settlement trail not supplied');
 await expect(page.locator('#TXN-055')).toContainText('Harbour Property Buyer');
});
