import {expect,it} from 'vitest';
import {referencesForScenario,referenceUrl} from '../src/lib/regulatory-references';
it('does not suggest references for an unknown scenario',()=>{
 expect(referencesForScenario('unknown')).toEqual([]);
});
it('offers each reference only for the checks it relates to',()=>{
 expect(referencesForScenario('beneficial_ownership').map(r=>r.id)).toContain('MAS-626-6.13-6.14');
 expect(referencesForScenario('screening').map(r=>r.id)).not.toContain('MAS-626-6.13-6.14');
 expect(referencesForScenario('screening').map(r=>r.id)).toContain('MAS-626-6.39-6.42');
 expect(referenceUrl(14)).toMatch(/^https:\/\/www\.mas\.gov\.sg\/.*#page=14$/);
});
it('lists references with unique IDs, valid pages and known check keys, covering every check',async()=>{
 const {regulatoryReferences}=await import('../src/lib/regulatory-references');
 const checkKeys=['identity_verification','beneficial_ownership','screening','pep','source_of_wealth','risk_assessment'];
 expect(new Set(regulatoryReferences.map(r=>r.id)).size).toBe(regulatoryReferences.length);
 for(const reference of regulatoryReferences) {
  expect(Number.isInteger(reference.page)&&reference.page>=1&&reference.page<=44,reference.id).toBe(true);
  expect(reference.id.startsWith('MAS-626-'),reference.id).toBe(true);
  for(const key of reference.scenarios) expect(checkKeys,reference.id).toContain(key);
 }
 for(const key of checkKeys) expect(regulatoryReferences.some(r=>(r.scenarios as readonly string[]).includes(key)),key).toBe(true);
});
it('supplies a reviewed onboarding reference for each applicable check key only once and only while current',async()=>{
 const {controlFingerprint,reviewedControlsForChecks}=await import('../src/lib/control-review');
 const {regulatoryReferences}=await import('../src/lib/regulatory-references');
 const reference=regulatoryReferences.find(r=>r.id==='MAS-626-8.3')!;
 const review={id:reference.id,fingerprint:controlFingerprint(reference),reviewer:'Test reviewer',reviewedOn:'2026-01-01',expiresOn:'2026-12-31',scenarios:['pep','source_of_wealth']};
 const ids=(keys:string[],asOf='2026-06-01')=>reviewedControlsForChecks([review],keys,asOf).map(c=>c.id);
 expect(ids(['pep','source_of_wealth'])).toEqual(['MAS-626-8.3']);
 expect(ids(['screening','risk_assessment'])).toEqual([]);
 expect(ids(['pep'],'2027-01-01')).toEqual([]);
 expect(reviewedControlsForChecks([{...review,fingerprint:'stale'}],['pep'],'2026-06-01')).toEqual([]);
});
it('chooses check keys from what the file contains',async()=>{
 const {onboardingCheckKeys}=await import('../src/lib/onboarding-rules');
 const {buildFile}=await import('./helpers/onboarding-file');
 expect(onboardingCheckKeys(buildFile('ONB-006')).sort()).toEqual(['identity_verification','risk_assessment','screening']);
 expect(onboardingCheckKeys(buildFile('ONB-003'))).toContain('beneficial_ownership');
 expect(onboardingCheckKeys(buildFile('ONB-008'))).toEqual(expect.arrayContaining(['pep','source_of_wealth']));
});
