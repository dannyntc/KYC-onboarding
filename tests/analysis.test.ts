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
 await expect(runLiveAnalysis({caseId:'ALT-001',evidenceIds:['TXN-002'],context:{},model:'test'},async()=>draft)).rejects.toThrow('unavailable record');
});
it('returns validated live output when citations match',async()=>{
 const result=await runLiveAnalysis({caseId:'ALT-001',evidenceIds:['TXN-001'],context:{},model:'test'},async()=>draft);
 expect(result.case_summary).toBe('Review');
});
it('uses the supporting record for the wealth-gap fixture',async()=>{
 const {fixtureAnalysis}=await import('../src/lib/analysis');
 const result=fixtureAnalysis('wealth_gap','TXN-027','DOC-002');
 expect(result.risk_indicators[0].evidence_ids).toContain('DOC-002');
 expect(result.risk_indicators[0].description).toContain('5 million');
});
it('cites ownership evidence and property sale mitigation in scenario fixtures',async()=>{
 const {fixtureAnalysis}=await import('../src/lib/analysis');
 expect(fixtureAnalysis('linked_ownership','TXN-041','DOC-003','CLI-003','REL-001').risk_indicators[0].evidence_ids).toContain('REL-001');
 expect(fixtureAnalysis('documented_sale','TXN-055','DOC-004','CLI-004').mitigating_factors[0].evidence_ids).toContain('DOC-004');
});
it('retains rejected structured output for an auditable validation failure',async()=>{
 const {AnalysisValidationError}=await import('../src/lib/live-analysis');
 try {await runLiveAnalysis({caseId:'ALT-001',evidenceIds:['TXN-002'],context:{},model:'test'},async()=>draft); throw new Error('unexpected success');}
 catch(error){expect(error).toBeInstanceOf(AnalysisValidationError);expect((error as InstanceType<typeof AnalysisValidationError>).output).toEqual(draft);}
});
