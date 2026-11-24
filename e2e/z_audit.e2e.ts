import {test,expect} from '@playwright/test';
import {spawnSync} from 'node:child_process';
import {db} from '../src/lib/db';

test('audit events reject edits and deletion while explicit reset restores protection',async()=>{
 expect(process.env.DATABASE_URL).toContain('kyc-onboarding-e2e-');
 const event=await db.onboardingEvent.create({data:{onboardingCaseId:'ONB-001',actor:'Test analyst',action:'Test action',detail:'Original'}});
 await expect(db.onboardingEvent.update({where:{id:event.id},data:{detail:'Changed'}})).rejects.toThrow();
 await expect(db.onboardingEvent.delete({where:{id:event.id}})).rejects.toThrow();
 await expect(db.$executeRaw`INSERT OR REPLACE INTO "OnboardingEvent" ("id","onboardingCaseId","actor","action","detail") VALUES (${event.id}, 'ONB-001', 'Other', 'Replace', 'Changed')`).rejects.toThrow();
 expect((await db.onboardingEvent.findUniqueOrThrow({where:{id:event.id}})).detail).toBe('Original');
 const reset=spawnSync('npx',['tsx','prisma/seed.ts'],{env:{...process.env,KYC_ONBOARDING_RESET:'1'},encoding:'utf8'});
 expect(reset.status,reset.stderr).toBe(0);
 expect(await db.onboardingEvent.count()).toBe(0);
 expect(await db.onboardingCase.count()).toBe(12);
 const after=await db.onboardingEvent.create({data:{onboardingCaseId:'ONB-001',actor:'Test analyst',action:'After reset',detail:'Still protected'}});
 await expect(db.onboardingEvent.delete({where:{id:after.id}})).rejects.toThrow();
 await expect(db.onboardingEvent.update({where:{id:after.id},data:{detail:'Changed'}})).rejects.toThrow();
});
