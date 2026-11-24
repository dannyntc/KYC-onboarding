import {test,expect} from '@playwright/test';
import {acquireAnalysisLock,releaseAnalysisLock} from '../src/lib/analysis-lock';

test('analysis lease rejects concurrent requests and only its owner can release it',async()=>{
 const now=new Date('2026-01-01T00:00:00Z');
 const first=await acquireAnalysisLock('ONB-001',now);
 expect(first).not.toBeNull();
 expect(await acquireAnalysisLock('ONB-001',now)).toBeNull();
 await releaseAnalysisLock('ONB-001','another-owner');
 expect(await acquireAnalysisLock('ONB-001',now)).toBeNull();
 await releaseAnalysisLock('ONB-001',first!);
 const next=await acquireAnalysisLock('ONB-001',now);
 expect(next).not.toBeNull();
 const recovered=await acquireAnalysisLock('ONB-001',new Date(now.getTime()+121000));
 expect(recovered).not.toBeNull();
 await releaseAnalysisLock('ONB-001',next!);
 expect(await acquireAnalysisLock('ONB-001',new Date(now.getTime()+121000))).toBeNull();
 await releaseAnalysisLock('ONB-001',recovered!);
});
