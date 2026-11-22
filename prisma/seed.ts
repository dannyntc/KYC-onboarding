import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { databaseUrl } from '../src/lib/database-url';
import { createSeed } from '../src/lib/seed-data';
const prisma = new PrismaClient({adapter:new PrismaBetterSqlite3({url:databaseUrl(process.env.DATABASE_URL ?? 'file:./dev.db',process.cwd())})});
async function main() {
 const data = createSeed();
 await prisma.$transaction(async tx => {
  if (process.env.KYC_ONBOARDING_RESET !== "1") {
   const counts = await Promise.all([tx.client.count(), tx.account.count(), tx.transaction.count(), tx.alert.count(), tx.analysis.count(), tx.auditEvent.count(), tx.kYCDocument.count(), tx.relationship.count(), tx.analysisLock.count()]);
   if (counts.some(count => count > 0)) throw new Error("Existing demo data found. Use npm run db:reset to erase it explicitly.");
  }
  // Explicit reset is the only application workflow that removes the demo audit history.
  // SQLite DDL is transactional, so failed resets restore the original triggers and data.
  if(process.env.KYC_ONBOARDING_RESET === '1') {
   await tx.$executeRawUnsafe('DROP TRIGGER IF EXISTS "audit_event_no_update"');
   await tx.$executeRawUnsafe('DROP TRIGGER IF EXISTS "audit_event_no_delete"');
   await tx.$executeRawUnsafe('DROP TRIGGER IF EXISTS "audit_event_no_replace"');
   await tx.analysisLock.deleteMany(); await tx.relationship.deleteMany(); await tx.kYCDocument.deleteMany(); await tx.auditEvent.deleteMany(); await tx.analysis.deleteMany(); await tx.alert.deleteMany(); await tx.transaction.deleteMany(); await tx.account.deleteMany(); await tx.client.deleteMany();
   await tx.$executeRawUnsafe(`CREATE TRIGGER "audit_event_no_update" BEFORE UPDATE ON "AuditEvent" BEGIN SELECT RAISE(ABORT, 'Audit events are append-only'); END`);
   await tx.$executeRawUnsafe(`CREATE TRIGGER "audit_event_no_delete" BEFORE DELETE ON "AuditEvent" BEGIN SELECT RAISE(ABORT, 'Audit events are append-only'); END`);
   await tx.$executeRawUnsafe(`CREATE TRIGGER "audit_event_no_replace" BEFORE INSERT ON "AuditEvent" WHEN EXISTS (SELECT 1 FROM "AuditEvent" WHERE "id" = NEW."id") BEGIN SELECT RAISE(ABORT, 'Audit events are append-only'); END`);
  }
  await tx.client.createMany({data:data.clients}); await tx.account.createMany({data:data.accounts}); await tx.transaction.createMany({data:data.transactions}); await tx.alert.createMany({data:data.alerts}); await tx.kYCDocument.createMany({data:data.documents}); await tx.relationship.createMany({data:data.relationships});
 });
 console.log(`Seeded ${data.clients.length} clients, ${data.transactions.length} transactions and ${data.alerts.length} alerts.`);
}
main().finally(()=>prisma.$disconnect());
