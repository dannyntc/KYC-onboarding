import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

it('refuses to seed a database containing client data even when it has no onboarding files', () => {
 const dir = mkdtempSync(join(tmpdir(), 'kyc-onboarding-seed-'));
 const path = join(dir, 'test.db');
 const env = { ...process.env, DATABASE_URL: `file:${path}`, KYC_ONBOARDING_RESET: '' };
 try {
  execFileSync('node_modules/.bin/prisma', ['migrate', 'deploy'], { env, stdio: 'pipe' });
  const db = new DatabaseSync(path);
  try {
   db.prepare('INSERT INTO "Client" (id, name, expectedMonthlyMin, expectedMonthlyMax, declaredWealth, profile) VALUES (?, ?, ?, ?, ?, ?)').run('preserve-me', 'Existing client', 0, 1, 2, 'Existing profile');
   const result = spawnSync('node_modules/.bin/tsx', ['prisma/seed.ts'], { env, encoding: 'utf8' });
   expect(result.status).not.toBe(0);
   expect(result.stderr).toContain('Existing demo data found');
   expect(db.prepare('SELECT name, profile FROM "Client" WHERE id = ?').get('preserve-me')).toMatchObject({ name: 'Existing client', profile: 'Existing profile' });
  } finally { db.close(); }
 } finally { rmSync(dir, { recursive: true, force: true }); }
}, 30000);

function migratedDatabase(dir: string) {
 const path = join(dir, 'test.db');
 const env = { ...process.env, DATABASE_URL: `file:${path}`, KYC_ONBOARDING_RESET: '' };
 execFileSync('node_modules/.bin/prisma', ['migrate', 'deploy'], { env, stdio: 'pipe' });
 return { path, env };
}

function onboardingCounts(db: DatabaseSync) {
 const count = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
 return {
  cases: count('SELECT COUNT(*) AS c FROM "OnboardingCase"'),
  identity: count('SELECT COUNT(*) AS c FROM "IdentityDocument"'),
  screening: count('SELECT COUNT(*) AS c FROM "ScreeningResult"'),
  supplementalDocuments: count(`SELECT COUNT(*) AS c FROM "KYCDocument" WHERE "id" >= 'DOC-101'`)
 };
}

it('seeds a fresh database once, and a second seed refuses and changes nothing', () => {
 const dir = mkdtempSync(join(tmpdir(), 'kyc-onboarding-'));
 try {
  const { path, env } = migratedDatabase(dir);
  const seeded = spawnSync('node_modules/.bin/tsx', ['prisma/seed.ts'], { env, encoding: 'utf8' });
  expect(seeded.status, seeded.stderr).toBe(0);
  const db = new DatabaseSync(path);
  try {
   const before = onboardingCounts(db);
   expect(before).toEqual({ cases: 12, identity: 24, screening: 3, supplementalDocuments: 11 });
   expect((db.prepare('SELECT COUNT(*) AS c FROM "Client"').get() as { c: number }).c).toBe(13);
   const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all().map(row => (row as { name: string }).name);
   for (const removed of ['Account', 'Transaction', 'Alert', 'Analysis', 'AuditEvent']) expect(tables).not.toContain(removed);
   const again = spawnSync('node_modules/.bin/tsx', ['prisma/seed.ts'], { env, encoding: 'utf8' });
   expect(again.status).not.toBe(0);
   expect(again.stderr).toContain('Existing demo data found');
   expect(onboardingCounts(db)).toEqual(before);
  } finally { db.close(); }
 } finally { rmSync(dir, { recursive: true, force: true }); }
}, 60000);
