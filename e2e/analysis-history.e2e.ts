import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('analysts can inspect rejected attempts without replacing the latest valid draft',async({page,request})=>{
 const draft={case_summary:'Previously accepted draft',observed_facts:[],risk_indicators:[],mitigating_factors:[],missing_information:[],relevant_controls:[],suggested_action:'review',draft_case_note:'Review the evidence.',limitations:[]};
 const saved=await db.analysis.create({data:{alertId:'ALT-012',mode:'fixture',model:'fixture',promptVersion:'v3',validation:'passed',output:JSON.stringify(draft)}});
 const rejected=await db.analysis.create({data:{alertId:'ALT-012',mode:'live',model:'test-model',promptVersion:'v3',validation:'rejected',output:'{"case_summary":"Rejected draft"}',rawResponse:'{"id":"rejected-response","text":"<script>unsafe()</script>"}',inputSnapshot:'{"permitted_evidence_ids":["TXN-167"]}'}});
 await page.goto('/cases/ALT-012');
 await expect(page.getByText('Previously accepted draft')).toBeVisible();
 const history=page.locator('section').filter({has:page.getByRole('heading',{name:'Analysis history'})});
 await expect(history).toContainText('Rejected');
 await history.getByRole('link',{name:`View attempt ${rejected.id}`}).click();
 await expect(page.getByRole('heading',{name:`Analysis attempt ${rejected.id}`})).toBeVisible();
 await expect(page.getByText('Rejected', {exact:true})).toBeVisible();
 await expect(page.getByText('Rejected draft',{exact:false})).toBeVisible();
 await expect(page.getByText('rejected-response',{exact:false})).toBeVisible();
 await expect(page.getByText('TXN-167',{exact:false})).toBeVisible();
 expect(await page.locator('script').filter({hasText:'unsafe()'}).count()).toBe(0);
 expect((await request.get(`/cases/ALT-011/analyses/${rejected.id}`)).status()).toBe(404);
 await page.getByRole('link',{name:'Back to case'}).click();
 await expect(page.getByText('Previously accepted draft')).toBeVisible();
 await page.getByRole('link',{name:`View attempt ${saved.id}`}).click();
 await expect(page.getByText('No input snapshot was saved for this attempt.')).toBeVisible();
 await expect(page.getByText('No provider response was saved for this attempt.')).toBeVisible();
});
