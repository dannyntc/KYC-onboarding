import {test,expect} from '@playwright/test';
import {db} from '../src/lib/db';

test('a rejected fixture is retained and linked to its audit event',async({request})=>{
 await db.kYCDocument.create({data:{id:'',clientId:'CLI-002',kind:'company_sale',title:'Invalid synthetic record',summary:'Test record with an invalid evidence ID.',corroboratedAmount:600000000}});
 try {
  const previous=await db.analysis.findFirst({where:{alertId:'ALT-002',validation:'passed'},orderBy:{id:'desc'}});
  const response=await request.post('/api/action',{headers:{origin:'http://127.0.0.1:3105'},form:{id:'ALT-002',action:'analyze'}});
  expect(response.status()).toBe(422);
  const attempt=await db.analysis.findFirst({where:{alertId:'ALT-002',mode:'fixture',validation:'rejected'},orderBy:{id:'desc'}});
  expect(attempt).not.toBeNull();
  expect(attempt?.model).toBe('fixture');
  expect(attempt?.rawResponse).toBeNull();
  expect(attempt?.inputSnapshot).toContain('Invalid synthetic record');
  expect(attempt?.output).toContain('Company-sale records report different amounts.');
  const latestAccepted=await db.analysis.findFirst({where:{alertId:'ALT-002',validation:'passed'},orderBy:{id:'desc'}});
  expect(latestAccepted?.id).toBe(previous?.id);
  const events=await db.auditEvent.findMany({where:{alertId:'ALT-002',action:'Template alert memo failed'}});
  expect(events.filter(event=>event.detail.includes(`Attempt ID: ${attempt?.id};`))).toHaveLength(1);
 } finally {await db.kYCDocument.delete({where:{id:''}});}
});
