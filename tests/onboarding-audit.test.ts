import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

it('rejects edits, deletes and replacements of onboarding events but allows new ones', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kyc-onboarding-audit-'));
  const path = join(dir, 'test.db');
  try {
    execFileSync('node_modules/.bin/prisma', ['migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: `file:${path}` },
      stdio: 'pipe'
    });
    const db = new DatabaseSync(path);
    try {
      db.prepare(
        'INSERT INTO "Client" (id, name, expectedMonthlyMin, expectedMonthlyMax, declaredWealth, profile) VALUES (?, ?, ?, ?, ?, ?)'
      ).run('CLI-X', 'Test client', 0, 1, 2, 'Test profile');
      db.prepare(
        'INSERT INTO "OnboardingCase" (id, clientId, applicationDate, purpose) VALUES (?, ?, ?, ?)'
      ).run('ONB-X', 'CLI-X', '2026-11-02', 'Test purpose');
      const insert = db.prepare(
        'INSERT INTO "OnboardingEvent" (id, onboardingCaseId, actor, action, detail) VALUES (?, ?, ?, ?, ?)'
      );
      insert.run(1, 'ONB-X', 'Demo analyst', 'Saved risk rating', '{"before":null,"after":"Low"}');

      expect(() => db.prepare('UPDATE "OnboardingEvent" SET action = ? WHERE id = 1').run('Edited')).toThrow(/append-only/);
      expect(() => db.prepare('DELETE FROM "OnboardingEvent" WHERE id = 1').run()).toThrow(/append-only/);
      expect(() =>
        db
          .prepare('INSERT OR REPLACE INTO "OnboardingEvent" (id, onboardingCaseId, actor, action, detail) VALUES (?, ?, ?, ?, ?)')
          .run(1, 'ONB-X', 'Someone else', 'Replaced', '{}')
      ).toThrow(/append-only/);

      expect(db.prepare('SELECT actor, action FROM "OnboardingEvent" WHERE id = 1').get()).toMatchObject({
        actor: 'Demo analyst',
        action: 'Saved risk rating'
      });

      insert.run(2, 'ONB-X', 'Demo senior approver', 'Approved', '{}');
      expect((db.prepare('SELECT COUNT(*) AS c FROM "OnboardingEvent"').get() as { c: number }).c).toBe(2);
    } finally {
      db.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 30000);
