import {test,expect} from '@playwright/test';
import {spawnSync} from 'node:child_process';
import {db} from '../src/lib/db';

test('audit events reject edits and deletion while explicit reset restores protection',async()=>{
 expect(process.env.DATABASE_URL).toContain('kyc-onboarding-e2e-');
 const event=await db.auditEvent.create({data:{alertId:'ALT-001',actor:'Test analyst',action:'Test action',detail:'Original'}});
 await expect(db.auditEvent.update({where:{id:event.id},data:{detail:'Changed'}})).rejects.toThrow();
 await expect(db.auditEvent.delete({where:{id:event.id}})).rejects.toThrow();
 await expect(db.$executeRaw`INSERT OR REPLACE INTO "AuditEvent" ("id","alertId","actor","action","detail") VALUES (${event.id}, 'ALT-001', 'Other', 'Replace', 'Changed')`).rejects.toThrow();
 expect((await db.auditEvent.findUniqueOrThrow({where:{id:event.id}})).detail).toBe('Original');
 const reset=spawnSync('npx',['tsx','prisma/seed.ts'],{env:{...process.env,KYC_ONBOARDING_RESET:'1'},encoding:'utf8'});
 expect(reset.status,reset.stderr).toBe(0);
 expect(await db.auditEvent.count()).toBe(0);
 expect(await db.alert.count()).toBe(12);
 const after=await db.auditEvent.create({data:{alertId:'ALT-001',actor:'Test analyst',action:'After reset',detail:'Still protected'}});
 await expect(db.auditEvent.delete({where:{id:after.id}})).rejects.toThrow();
 await expect(db.auditEvent.update({where:{id:after.id},data:{detail:'Changed'}})).rejects.toThrow();
});
