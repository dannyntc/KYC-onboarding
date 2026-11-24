import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';
import {relatedRelationships} from '../src/lib/related-relationships';

test('related evidence requires both matching owner and entity and excludes the current client',async()=>{
 await db.relationship.createMany({data:[
  {id:'REL-TEST-OWNER',clientId:'CLI-013',owner:'Morgan Vale',entity:'Different Holdings',description:'Different entity'},
  {id:'REL-TEST-ENTITY',clientId:'CLI-014',owner:'Different owner',entity:'Cedar Harbour Holdings',description:'Different owner'},
 ]});
 try {
  const matches=await relatedRelationships('CLI-003',[{owner:'Morgan Vale',entity:'Cedar Harbour Holdings'}]);
  expect(matches.map(r=>r.id)).toEqual(['REL-002','REL-003']);
  expect(await relatedRelationships('CLI-003',[])).toEqual([]);
 } finally {await db.relationship.deleteMany({where:{id:{in:['REL-TEST-OWNER','REL-TEST-ENTITY']}}});}
});
