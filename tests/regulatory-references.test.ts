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
