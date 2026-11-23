import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('a saved live draft remains labeled when fixture generation is configured',async({page})=>{
 const draft={case_summary:'Previously generated live draft',observed_facts:[],risk_indicators:[],mitigating_factors:[],missing_information:[],relevant_controls:[],suggested_action:'review',draft_case_note:'Review.',limitations:[]};
 await db.analysis.create({data:{alertId:'ALT-010',mode:'live',model:'test-model',promptVersion:'v2',validation:'passed',output:JSON.stringify(draft)}});
 await page.goto('/cases/ALT-010');
 await expect(page.getByText('TEMPLATE',{exact:true})).toBeVisible();
 await expect(page.getByText('Displayed memo: AI response',{exact:true})).toBeVisible();
 await expect(page.getByText('Previously generated live draft')).toBeVisible();
 await page.getByText('View evidence used for this memo').click();
 await expect(page.getByText('Evidence snapshots were not recorded for this older memo.')).toBeVisible();
});
