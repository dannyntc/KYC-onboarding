import { describe, it, expect } from 'vitest';
import { validateAnalysis } from '../src/lib/analysis';
const draft = {case_summary:'Review',observed_facts:[{description:'Transfer',evidence_ids:['TXN-001']}],risk_indicators:[],mitigating_factors:[],missing_information:[],relevant_controls:[],suggested_action:'review',draft_case_note:'Review evidence',limitations:[]};
describe('evidence validation',()=>{
 it('accepts cited evidence from the case',()=>expect(validateAnalysis(draft,['TXN-001'],[]).success).toBe(true));
 it('rejects invented evidence',()=>expect(validateAnalysis(draft,['TXN-002'],[]).success).toBe(false));
 it('rejects an autonomous closure action',()=>expect(validateAnalysis({...draft,suggested_action:'close'},['TXN-001'],[]).success).toBe(false));
});
import { runLiveAnalysis } from '../src/lib/live-analysis';
it('rejects live model output that cites evidence outside the case',async()=>{
 await expect(runLiveAnalysis({caseId:'ALT-001',evidenceIds:['TXN-002'],context:{},model:'test'},async()=>({outputText:JSON.stringify(draft),rawResponse:JSON.stringify({output:draft})}))).rejects.toThrow('unavailable record');
});
it('returns validated live output when citations match',async()=>{
 const result=await runLiveAnalysis({caseId:'ALT-001',evidenceIds:['TXN-001'],context:{},model:'test'},async()=>({outputText:JSON.stringify(draft),rawResponse:JSON.stringify({output:draft})}));
 expect(result.draft.case_summary).toBe('Review');
 expect(result.rawResponse).toBe(JSON.stringify({output:draft}));
});
it('cites ownership evidence and property sale mitigation in scenario fixtures',async()=>{
 const {fixtureAnalysis}=await import('../src/lib/analysis');
 const base={trigger:{id:'TXN-1',amount:250000000,currency:'SGD'},client:{id:'CLI-1',declaredWealth:0,expectedMonthlyMax:10000000},documents:[{id:'DOC-1',kind:'property_sale',corroboratedAmount:250000000}],relationships:[{id:'REL-1',owner:'Owner',entity:'Entity'}],relatedRelationships:[{id:'REL-2',owner:'Owner',entity:'Entity'}]};
 expect(fixtureAnalysis({...base,scenario:'linked_ownership'}).risk_indicators[0].evidence_ids).toEqual(['REL-1','REL-2']);
 expect(fixtureAnalysis({...base,scenario:'documented_sale'}).mitigating_factors[0].evidence_ids).toEqual(['DOC-1','TXN-1']);
});
it('retains rejected structured output for an auditable validation failure',async()=>{
 const {AnalysisValidationError}=await import('../src/lib/live-analysis');
 try {await runLiveAnalysis({caseId:'ALT-001',evidenceIds:['TXN-002'],context:{},model:'test'},async()=>({outputText:JSON.stringify(draft),rawResponse:JSON.stringify({output:draft})})); throw new Error('unexpected success');}
 catch(error){expect(error).toBeInstanceOf(AnalysisValidationError);expect((error as InstanceType<typeof AnalysisValidationError>).output).toEqual(draft);}
});
it('rejects explicit autonomous case determinations while allowing uncertain language',()=>{
 expect(validateAnalysis({...draft,draft_case_note:'The client is guilty of money laundering.'},['TXN-001'],[]).success).toBe(false);
 expect(validateAnalysis({...draft,draft_case_note:'The alert has been automatically closed.'},['TXN-001'],[]).success).toBe(false);
 expect(validateAnalysis({...draft,draft_case_note:'There is insufficient evidence to determine whether activity is suspicious.'},['TXN-001'],[]).success).toBe(true);
});
it('preserves a malformed model response for audit',async()=>{
 const {AnalysisValidationError}=await import('../src/lib/live-analysis');
 const rawResponse=JSON.stringify({id:'response-1',output_text:'{invalid json'});
 try {await runLiveAnalysis({caseId:'ALT-001',evidenceIds:['TXN-001'],context:{},model:'test'},async()=>({outputText:'{invalid json',rawResponse}));throw new Error('unexpected success');}
 catch(error){expect(error).toBeInstanceOf(AnalysisValidationError);expect((error as InstanceType<typeof AnalysisValidationError>).rawResponse).toBe(rawResponse);}
});

it('derives the wealth gap from the supplied client and sale record', async()=>{
 const {fixtureAnalysis}=await import('../src/lib/analysis');
 const result=fixtureAnalysis({scenario:'wealth_gap',trigger:{id:'TXN-1',amount:10000000,currency:'SGD'},client:{id:'CLI-1',declaredWealth:900000000,expectedMonthlyMax:10000000},documents:[{id:'DOC-1',kind:'company_sale',corroboratedAmount:200000000}],relationships:[],relatedRelationships:[]});
 expect(result.risk_indicators[0].description).toContain('SGD 7,000,000');
 expect(result.risk_indicators[0].evidence_ids).toEqual(['DOC-1','CLI-1']);
});
it('does not claim a matching property sale when evidence is missing or contradictory', async()=>{
 const {fixtureAnalysis}=await import('../src/lib/analysis');
 const base={scenario:'documented_sale',trigger:{id:'TXN-1',amount:250000000,currency:'SGD'},client:{id:'CLI-1',declaredWealth:0,expectedMonthlyMax:10000000},relationships:[],relatedRelationships:[]};
 for(const documents of [[],[{id:'DOC-1',kind:'property_sale',corroboratedAmount:100000000}]]) {
  const result=fixtureAnalysis({...base,documents});
  expect(result.mitigating_factors).toEqual([]);
  expect(result.missing_information.join(' ')).toMatch(/property.sale/i);
 }
});
it('cites the incoming and subsequent outgoing records in the rapid-movement fixture',async()=>{
 const {fixtureAnalysis}=await import('../src/lib/analysis');
 const trigger={id:'TXN-IN',amount:120000000,currency:'SGD',date:'2026-05-10'};
 const base={scenario:'rapid_movement',trigger,client:{id:'CLI-1',declaredWealth:0,expectedMonthlyMax:10000000},documents:[],relationships:[],relatedRelationships:[]};
 const outflow={id:'TXN-OUT',amount:-85000000,currency:'SGD',date:'2026-05-11'};
 const result=fixtureAnalysis({...base,transactions:[trigger,outflow]});
 expect(result.observed_facts).toContainEqual({description:'An outgoing payment was recorded within two calendar days of the incoming payment.',evidence_ids:['TXN-IN','TXN-OUT']});
 for(const invalid of [{...outflow,date:'2026-05-13'},{...outflow,currency:'USD'}]) {
  const unmatched=fixtureAnalysis({...base,transactions:[trigger,invalid]});
  expect(unmatched.observed_facts.some(f=>f.evidence_ids.includes('TXN-OUT'))).toBe(false);
  expect(unmatched.missing_information.join(' ')).toMatch(/outgoing payment/i);
 }
});
it('flags conflicting company-sale records without asserting an arbitrary wealth gap',async()=>{
 const {fixtureAnalysis}=await import('../src/lib/analysis');
 const base={scenario:'wealth_gap',trigger:{id:'TXN-1',amount:10000000,currency:'SGD'},client:{id:'CLI-1',declaredWealth:800000000,expectedMonthlyMax:10000000},relationships:[],relatedRelationships:[]};
 const first={id:'DOC-1',kind:'company_sale',corroboratedAmount:300000000};
 const second={id:'DOC-2',kind:'company_sale',corroboratedAmount:600000000};
 for(const documents of [[first,second],[second,first]]) {
  const result=fixtureAnalysis({...base,documents});
  expect(result.risk_indicators).toEqual([]);
  expect(result.observed_facts.find(f=>f.description.includes('different amounts'))?.evidence_ids).toEqual(documents.map(d=>d.id));
  expect(result.missing_information.join(' ')).toMatch(/conflict/i);
 }
});
it('rejects blank required narrative fields and blank finding descriptions',()=>{
 for(const invalid of [
  {...draft,case_summary:'   '},
  {...draft,draft_case_note:'\n'},
  {...draft,observed_facts:[{description:' ',evidence_ids:['TXN-001']}]},
  {...draft,missing_information:['  ']},
  {...draft,limitations:['']},
 ]) expect(validateAnalysis(invalid,['TXN-001'],[]).success).toBe(false);
});
it('retains a blank live response for audit instead of accepting it as a draft',async()=>{
 const {AnalysisValidationError}=await import('../src/lib/live-analysis');
 const invalid={...draft,case_summary:' '};
 const rawResponse=JSON.stringify({id:'blank-response'});
 try {await runLiveAnalysis({caseId:'ALT-001',evidenceIds:['TXN-001'],context:{},model:'test'},async()=>({outputText:JSON.stringify(invalid),rawResponse}));throw new Error('unexpected success');}
 catch(error){expect(error).toBeInstanceOf(AnalysisValidationError);expect((error as InstanceType<typeof AnalysisValidationError>).rawResponse).toBe(rawResponse);}
});
it('accepts only controls supplied to the live analysis',async()=>{
 const control={id:'CTRL-1',title:'Reviewed test control'};
 const withControl={...draft,relevant_controls:[{control_id:'CTRL-1',explanation:'Potentially relevant; confirm applicability.'}]};
 const provider=async()=>({outputText:JSON.stringify(withControl),rawResponse:'{}'});
 const input={caseId:'ALT-001',evidenceIds:['TXN-001'],context:{},model:'test'};
 await expect(runLiveAnalysis({...input,controls:[control]},provider)).resolves.toMatchObject({draft:withControl});
 await expect(runLiveAnalysis({...input,controls:[]},provider)).rejects.toThrow('unavailable record');
});
it('asks for reconciliation when property-sale records report different amounts',async()=>{
 const {fixtureAnalysis}=await import('../src/lib/analysis');
 const base={scenario:'documented_sale',trigger:{id:'TXN-1',amount:250000000,currency:'SGD'},client:{id:'CLI-1',declaredWealth:0,expectedMonthlyMax:10000000},relationships:[],relatedRelationships:[]};
 const matching={id:'DOC-1',kind:'property_sale',corroboratedAmount:250000000};
 const different={id:'DOC-2',kind:'property_sale',corroboratedAmount:100000000};
 for(const documents of [[matching,different],[different,matching]]) {
  const result=fixtureAnalysis({...base,documents});
  expect(result.mitigating_factors).toEqual([]);
  expect(result.observed_facts.find(f=>f.description.includes('different amounts'))?.evidence_ids).toEqual(documents.map(d=>d.id));
  expect(result.missing_information.join(' ')).toMatch(/reconcile/i);
 }
});
it('does not compare a foreign-currency inflow against an SGD activity threshold',async()=>{
 const {fixtureAnalysis}=await import('../src/lib/analysis');
 const trigger={id:'TXN-IN',amount:120000000,currency:'USD',date:'2026-05-10'};
 const outgoing={id:'TXN-OUT',amount:-85000000,currency:'USD',date:'2026-05-11'};
 const result=fixtureAnalysis({scenario:'rapid_movement',trigger,transactions:[trigger,outgoing],client:{id:'CLI-1',declaredWealth:0,expectedMonthlyMax:10000000},documents:[],relationships:[],relatedRelationships:[]});
 expect(result.risk_indicators).toEqual([]);
 expect(result.observed_facts.some(f=>f.evidence_ids.includes('TXN-OUT'))).toBe(false);
 expect(result.missing_information.join(' ')).toMatch(/currency|conversion/i);
 expect(result.missing_information.join(' ')).not.toMatch(/No qualifying subsequent outgoing/);
});
