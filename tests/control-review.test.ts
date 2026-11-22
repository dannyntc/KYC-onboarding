import {expect,it} from 'vitest';
import {controlFingerprint,reviewedControlsForScenario} from '../src/lib/control-review';
import {regulatoryReferences} from '../src/lib/regulatory-references';

const reference=regulatoryReferences.find(r=>r.id==='MAS-626-6.20')!;
const review={id:reference.id,fingerprint:controlFingerprint(reference),reviewer:'Independent reviewer',reviewedOn:'2026-01-01',expiresOn:'2026-12-31',scenarios:['rapid_movement']};
const select=(entries:unknown,scenario='rapid_movement')=>reviewedControlsForScenario(entries,scenario,'2026-06-01');
it('selects only a current, explicitly attested reference for its permitted scenario',()=>{
 expect(select([review]).map(r=>r.id)).toEqual([reference.id]);
 expect(select([review],'documented_sale')).toEqual([]);
});
it('fails closed for stale, future, invalid, changed or duplicate reviews',()=>{
 for(const invalid of [
  [{...review,expiresOn:'2026-05-31'}],
  [{...review,reviewedOn:'2026-07-01'}],
  [{...review,reviewer:'  '}],
  [{...review,fingerprint:'old'}],
  [{...review,expiresOn:'2026-02-30'}],
  [{...review,scenarios:['wealth_gap']}],
  [review,review],
  {reviews:[review]},
 ]) expect(select(invalid)).toEqual([]);
});
