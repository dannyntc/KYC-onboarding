import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('a saved fixture stays labeled when live generation is configured',async({page})=>{
 const draft={case_summary:'Previously generated fixture draft',observed_facts:[],risk_indicators:[],mitigating_factors:[],missing_information:[],relevant_controls:[],suggested_action:'review',draft_case_note:'Review.',limitations:[]};
 await db.analysis.create({data:{alertId:'ALT-002',mode:'fixture',model:'fixture',promptVersion:'v1',validation:'passed',output:JSON.stringify(draft)}});
 await page.goto('/cases/ALT-002');
 await expect(page.getByText('AI',{exact:true})).toBeVisible();
 await expect(page.getByText('Displayed memo: template (no AI used)',{exact:true})).toBeVisible();
 await expect(page.getByText('Previously generated fixture draft')).toBeVisible();
});
