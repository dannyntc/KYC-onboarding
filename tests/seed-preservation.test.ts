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
