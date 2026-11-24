// Loads the starting demo data, and restores it on an explicit reset. Shared by the seed scripts
// (npm run db:seed / db:reset, and their :postgres versions) and the in-app "Reset demo data" button.
// Relative imports only: the seed scripts run outside Next.js, where the "@/" alias does not exist.
import type { Prisma, PrismaClient } from '../generated/prisma/client';
import { createSeed } from './seed-data';

type Tx = Prisma.TransactionClient;
export type Engine = 'sqlite' | 'postgres';

// A new Postgres connection may take a few seconds to open, and the inserts run
// inside the same transaction, so allow more than Prisma's 2 s / 5 s defaults.
const TRANSACTION_OPTIONS = { maxWait: 15000, timeout: 60000 };

async function insertStartingData(tx: Tx) {
  const data = createSeed();
  await tx.client.createMany({ data: data.clients });
  await tx.account.createMany({ data: data.accounts });
  await tx.transaction.createMany({ data: data.transactions });
  await tx.alert.createMany({ data: data.alerts });
  await tx.kYCDocument.createMany({ data: data.documents });
  await tx.relationship.createMany({ data: data.relationships });
  await tx.onboardingCase.createMany({ data: data.onboardingCases });
  await tx.identityDocument.createMany({ data: data.identityDocuments });
  await tx.screeningResult.createMany({ data: data.screeningResults });
  return data;
}

async function demoRowCount(tx: Tx): Promise<number> {
  const counts = await Promise.all([
    tx.client.count(), tx.account.count(), tx.transaction.count(), tx.alert.count(), tx.analysis.count(),
    tx.auditEvent.count(), tx.kYCDocument.count(), tx.relationship.count(), tx.analysisLock.count(),
    tx.onboardingCase.count(), tx.identityDocument.count(), tx.screeningResult.count(),
    tx.onboardingEvent.count(), tx.onboardingAnalysis.count()
  ]);
  return counts.reduce((sum, count) => sum + count, 0);
}

// Onboarding tables reference clients, so they are cleared first.
async function deleteAllDemoData(tx: Tx) {
  await tx.onboardingEvent.deleteMany();
  await tx.onboardingAnalysis.deleteMany();
  await tx.screeningResult.deleteMany();
  await tx.identityDocument.deleteMany();
  await tx.onboardingCase.deleteMany();
  await tx.analysisLock.deleteMany();
  await tx.relationship.deleteMany();
  await tx.kYCDocument.deleteMany();
  await tx.auditEvent.deleteMany();
  await tx.analysis.deleteMany();
  await tx.alert.deleteMany();
  await tx.transaction.deleteMany();
  await tx.account.deleteMany();
  await tx.client.deleteMany();
}

// The audit tables are append-only (database triggers refuse updates and deletes). A reset is the
// only workflow allowed to clear them: it drops the triggers, deletes, and recreates them, all in
// one transaction, so a failed reset leaves the triggers and the data exactly as they were.
async function resetSqlite(tx: Tx) {
  for (const name of ['audit_event_no_update', 'audit_event_no_delete', 'audit_event_no_replace', 'onboarding_event_no_update', 'onboarding_event_no_delete', 'onboarding_event_no_replace']) {
    await tx.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${name}"`);
  }
  await deleteAllDemoData(tx);
  await tx.$executeRawUnsafe(`CREATE TRIGGER "audit_event_no_update" BEFORE UPDATE ON "AuditEvent" BEGIN SELECT RAISE(ABORT, 'Audit events are append-only'); END`);
  await tx.$executeRawUnsafe(`CREATE TRIGGER "audit_event_no_delete" BEFORE DELETE ON "AuditEvent" BEGIN SELECT RAISE(ABORT, 'Audit events are append-only'); END`);
  await tx.$executeRawUnsafe(`CREATE TRIGGER "audit_event_no_replace" BEFORE INSERT ON "AuditEvent" WHEN EXISTS (SELECT 1 FROM "AuditEvent" WHERE "id" = NEW."id") BEGIN SELECT RAISE(ABORT, 'Audit events are append-only'); END`);
  await tx.$executeRawUnsafe(`CREATE TRIGGER "onboarding_event_no_update" BEFORE UPDATE ON "OnboardingEvent" BEGIN SELECT RAISE(ABORT, 'Onboarding events are append-only'); END`);
  await tx.$executeRawUnsafe(`CREATE TRIGGER "onboarding_event_no_delete" BEFORE DELETE ON "OnboardingEvent" BEGIN SELECT RAISE(ABORT, 'Onboarding events are append-only'); END`);
  await tx.$executeRawUnsafe(`CREATE TRIGGER "onboarding_event_no_replace" BEFORE INSERT ON "OnboardingEvent" WHEN EXISTS (SELECT 1 FROM "OnboardingEvent" WHERE "id" = NEW."id") BEGIN SELECT RAISE(ABORT, 'Onboarding events are append-only'); END`);
}

async function resetPostgres(tx: Tx) {
  await tx.$executeRawUnsafe('DROP TRIGGER IF EXISTS onboarding_event_no_update ON "OnboardingEvent"');
  await tx.$executeRawUnsafe('DROP TRIGGER IF EXISTS onboarding_event_no_delete ON "OnboardingEvent"');
  await deleteAllDemoData(tx);
  await tx.$executeRawUnsafe('CREATE TRIGGER onboarding_event_no_update BEFORE UPDATE ON "OnboardingEvent" FOR EACH ROW EXECUTE FUNCTION onboarding_event_append_only_guard()');
  await tx.$executeRawUnsafe('CREATE TRIGGER onboarding_event_no_delete BEFORE DELETE ON "OnboardingEvent" FOR EACH ROW EXECUTE FUNCTION onboarding_event_append_only_guard()');
}

// Erases every review, memo and audit entry and restores the starting data, all or nothing.
export async function resetDemoData(client: PrismaClient, engine: Engine) {
  return client.$transaction(async tx => {
    if (engine === 'postgres') await resetPostgres(tx);
    else await resetSqlite(tx);
    return insertStartingData(tx);
  }, TRANSACTION_OPTIONS);
}

// Loads the starting data into an empty database, and refuses to overwrite existing data.
export async function seedEmptyDatabase(client: PrismaClient, resetCommand: string) {
  return client.$transaction(async tx => {
    if ((await demoRowCount(tx)) > 0) throw new Error(`Existing demo data found. Use ${resetCommand} to erase it explicitly.`);
    return insertStartingData(tx);
  }, TRANSACTION_OPTIONS);
}
