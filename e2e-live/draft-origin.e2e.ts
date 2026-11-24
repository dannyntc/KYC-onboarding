import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('a saved template memo stays labelled as a template when AI generation is configured',async({page})=>{
 const draft={applicant_summary:'Previously generated template memo',verified_facts:[],risk_factors:[],mitigating_factors:[],outstanding_items:[],suggested_risk_rating:'high',suggested_next_step:'refer_for_senior_review',relevant_controls:[],draft_note:'Review.',limitations:['Template.']};
 await db.onboardingAnalysis.create({data:{onboardingCaseId:'ONB-002',mode:'fixture',model:'fixture',promptVersion:'kyc-v1',validation:'passed',output:JSON.stringify(draft)}});
 await page.goto('/onboarding/ONB-002');
 await expect(page.getByText('AI',{exact:true})).toBeVisible();
 await expect(page.getByText('Displayed memo: template (no AI used)',{exact:true})).toBeVisible();
 await expect(page.getByText('Previously generated template memo')).toBeVisible();
});
