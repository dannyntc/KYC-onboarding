import {expect,it} from 'vitest';
import {referencesForScenario,referenceUrl} from '../src/lib/regulatory-references';
it('does not suggest references for an unknown scenario',()=>{
 expect(referencesForScenario('unknown')).toEqual([]);
});
it('offers ownership and monitoring references only in relevant demonstration scenarios',()=>{
 expect(referencesForScenario('linked_ownership').map(r=>r.id)).toContain('MAS-626-6.14B');
 expect(referencesForScenario('rapid_movement').map(r=>r.id)).not.toContain('MAS-626-6.14B');
 expect(referencesForScenario('rapid_movement').map(r=>r.id)).toContain('MAS-626-6.21-6.23');
 expect(referenceUrl(14)).toMatch(/^https:\/\/www\.mas\.gov\.sg\/.*#page=14$/);
});
it('keeps the fingerprints of the original four references unchanged, so recorded reviews stay valid',async()=>{
 const {controlFingerprint}=await import('../src/lib/control-review');
 const expected:Record<string,string>={
  'MAS-626-6.14B':'af7e69e59f95f29110eb12822a5b1fb9f505eec27c8522ff965739383cb4e027',
  'MAS-626-6.20':'5745a9bf6ffde883ad67715ef81bb409f7f9ec8b9c7d2f8360c94eb25c9d9382',
  'MAS-626-6.21-6.23':'303fd225fac42a1d49cdd6466041b4547e605e17c81308a063ca6d4e833594a9',
  'MAS-626-6.24':'90c7255e79db42fcb15358f8ae1606b3cf99839c2edfc9cc4f9f121eeb4a263f'
 };
 const {regulatoryReferences}=await import('../src/lib/regulatory-references');
 for(const [id,fingerprint] of Object.entries(expected)) {
  const reference=regulatoryReferences.find(r=>r.id===id)!;
  expect(controlFingerprint(reference),id).toBe(fingerprint);
 }
});
it('appends onboarding references with unique IDs, valid pages and known check keys',async()=>{
 const {regulatoryReferences}=await import('../src/lib/regulatory-references');
 const alertKeys=['rapid_movement','wealth_gap','linked_ownership','documented_sale'];
 const checkKeys=['identity_verification','beneficial_ownership','screening','pep','source_of_wealth','risk_assessment'];
 expect(new Set(regulatoryReferences.map(r=>r.id)).size).toBe(regulatoryReferences.length);
 expect(regulatoryReferences.slice(0,4).map(r=>r.id)).toEqual(['MAS-626-6.14B','MAS-626-6.20','MAS-626-6.21-6.23','MAS-626-6.24']);
 const added=regulatoryReferences.slice(4);
 expect(added.length).toBeGreaterThan(0);
 for(const reference of added) {
  expect(Number.isInteger(reference.page)&&reference.page>=1&&reference.page<=44,reference.id).toBe(true);
  expect(reference.id.startsWith('MAS-626-'),reference.id).toBe(true);
  for(const key of reference.scenarios) expect(checkKeys,reference.id).toContain(key);
 }
 for(const key of checkKeys) expect(added.some(r=>(r.scenarios as readonly string[]).includes(key)),key).toBe(true);
 expect(regulatoryReferences.slice(0,4).every(r=>r.scenarios.every(key=>alertKeys.includes(key)))).toBe(true);
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
