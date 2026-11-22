import {it,expect} from 'vitest';
import {reviewChange} from '../src/lib/review';
it('records the previous and new status and notes for an analyst action',()=>{
 expect(reviewChange({status:'Open',notes:'Prior note'},'escalate','Need review')).toEqual({status:'Escalated',detail:JSON.stringify({before:{status:'Open',notes:'Prior note'},after:{status:'Escalated',notes:'Need review'}})});
});
it('rejects an unsupported action',()=>expect(()=>reviewChange({status:'Open',notes:''},'close','done')).toThrow());
