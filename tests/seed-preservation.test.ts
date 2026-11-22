import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

it('refuses to seed a database containing client data even when it has no alerts', () => {
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

it('refuses to add onboarding data when onboarding rows already exist and changes nothing', () => {
 const dir = mkdtempSync(join(tmpdir(), 'kyc-onboarding-'));
 try {
  const { path, env } = migratedDatabase(dir);
  const seeded = spawnSync('node_modules/.bin/tsx', ['prisma/seed.ts'], { env, encoding: 'utf8' });
  expect(seeded.status).toBe(0);
  const db = new DatabaseSync(path);
  try {
   const before = onboardingCounts(db);
   expect(before).toEqual({ cases: 12, identity: 24, screening: 3, supplementalDocuments: 11 });
   const result = spawnSync('node_modules/.bin/tsx', ['prisma/seed-onboarding.ts'], { env, encoding: 'utf8' });
   expect(result.status).not.toBe(0);
   expect(result.stderr).toContain('Onboarding data already exists');
   expect(onboardingCounts(db)).toEqual(before);
  } finally { db.close(); }
 } finally { rmSync(dir, { recursive: true, force: true }); }
}, 60000);

it('adds onboarding data to an old-style database without touching existing alerts or audit events', () => {
 const dir = mkdtempSync(join(tmpdir(), 'kyc-onboarding-'));
 try {
  const { path, env } = migratedDatabase(dir);
  expect(spawnSync('node_modules/.bin/tsx', ['prisma/seed.ts'], { env, encoding: 'utf8' }).status).toBe(0);
  const db = new DatabaseSync(path);
  try {
   // Turn the freshly seeded database back into the pre-onboarding shape.
   db.exec(`DELETE FROM "ScreeningResult"; DELETE FROM "IdentityDocument"; DELETE FROM "OnboardingCase"; DELETE FROM "KYCDocument" WHERE "id" >= 'DOC-101'`);
   db.prepare(`INSERT INTO "AuditEvent" ("alertId", "actor", "action", "detail") VALUES ('ALT-001', 'Demo analyst', 'Saved review', '{}')`).run();
   expect(onboardingCounts(db)).toEqual({ cases: 0, identity: 0, screening: 0, supplementalDocuments: 0 });
   const snapshot = () => ({
    alerts: db.prepare('SELECT * FROM "Alert" ORDER BY "id"').all(),
    audit: db.prepare('SELECT * FROM "AuditEvent" ORDER BY "id"').all(),
    clients: db.prepare('SELECT * FROM "Client" ORDER BY "id"').all(),
    originalDocuments: db.prepare(`SELECT * FROM "KYCDocument" WHERE "id" < 'DOC-101' ORDER BY "id"`).all()
   });
   const before = snapshot();
   const result = spawnSync('node_modules/.bin/tsx', ['prisma/seed-onboarding.ts'], { env, encoding: 'utf8' });
   expect(result.stderr).toBe('');
   expect(result.status).toBe(0);
   expect(onboardingCounts(db)).toEqual({ cases: 12, identity: 24, screening: 3, supplementalDocuments: 11 });
   expect(snapshot()).toEqual(before);
  } finally { db.close(); }
 } finally { rmSync(dir, { recursive: true, force: true }); }
}, 60000);

it('refuses to add onboarding data when an expected demo client is missing or renamed', () => {
 const dir = mkdtempSync(join(tmpdir(), 'kyc-onboarding-'));
 try {
  const { path, env } = migratedDatabase(dir);
  expect(spawnSync('node_modules/.bin/tsx', ['prisma/seed.ts'], { env, encoding: 'utf8' }).status).toBe(0);
  const db = new DatabaseSync(path);
  try {
   db.exec(`DELETE FROM "ScreeningResult"; DELETE FROM "IdentityDocument"; DELETE FROM "OnboardingCase"; DELETE FROM "KYCDocument" WHERE "id" >= 'DOC-101'`);
   db.prepare('UPDATE "Client" SET "name" = ? WHERE "id" = ?').run('Renamed client', 'CLI-010');
   const result = spawnSync('node_modules/.bin/tsx', ['prisma/seed-onboarding.ts'], { env, encoding: 'utf8' });
   expect(result.status).not.toBe(0);
   expect(result.stderr).toContain('CLI-010');
   expect(onboardingCounts(db)).toEqual({ cases: 0, identity: 0, screening: 0, supplementalDocuments: 0 });
  } finally { db.close(); }
 } finally { rmSync(dir, { recursive: true, force: true }); }
}, 60000);
