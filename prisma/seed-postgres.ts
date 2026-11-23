import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma-postgres/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createSeed } from '../src/lib/seed-data';

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl || (!configuredUrl.startsWith('postgres://') && !configuredUrl.startsWith('postgresql://'))) {
 throw new Error('DATABASE_URL must be a PostgreSQL connection string when running the PostgreSQL seed.');
}
const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:configuredUrl})});

async function main() {
 const data = createSeed();
 {
  if (process.env.KYC_ONBOARDING_RESET !== '1') {
   const counts = await Promise.all([
    prisma.client.count(), prisma.account.count(), prisma.transaction.count(), prisma.alert.count(),
    prisma.analysis.count(), prisma.auditEvent.count(), prisma.kYCDocument.count(), prisma.relationship.count(), prisma.analysisLock.count(),
    prisma.onboardingCase.count(), prisma.identityDocument.count(), prisma.screeningResult.count(), prisma.onboardingEvent.count(), prisma.onboardingAnalysis.count()
   ]);
   if (counts.some(count => count > 0)) throw new Error('Existing demo data found. Use KYC_ONBOARDING_RESET=1 only when an explicit reset is intended.');
  }
  if (process.env.KYC_ONBOARDING_RESET === '1') {
   // Onboarding tables reference clients, so they are cleared first. The append-only triggers on
   // OnboardingEvent are dropped and recreated in one transaction (Postgres DDL is transactional).
   await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe('DROP TRIGGER IF EXISTS onboarding_event_no_update ON "OnboardingEvent"');
    await tx.$executeRawUnsafe('DROP TRIGGER IF EXISTS onboarding_event_no_delete ON "OnboardingEvent"');
    await tx.onboardingEvent.deleteMany();
    await tx.$executeRawUnsafe('CREATE TRIGGER onboarding_event_no_update BEFORE UPDATE ON "OnboardingEvent" FOR EACH ROW EXECUTE FUNCTION onboarding_event_append_only_guard()');
    await tx.$executeRawUnsafe('CREATE TRIGGER onboarding_event_no_delete BEFORE DELETE ON "OnboardingEvent" FOR EACH ROW EXECUTE FUNCTION onboarding_event_append_only_guard()');
   }, { maxWait: 15000, timeout: 30000 }); // A pooled connection can take a few seconds to open.
   await prisma.onboardingAnalysis.deleteMany();
   await prisma.screeningResult.deleteMany();
   await prisma.identityDocument.deleteMany();
   await prisma.onboardingCase.deleteMany();
   await prisma.analysisLock.deleteMany();
   await prisma.relationship.deleteMany();
   await prisma.kYCDocument.deleteMany();
   await prisma.auditEvent.deleteMany();
   await prisma.analysis.deleteMany();
   await prisma.alert.deleteMany();
   await prisma.transaction.deleteMany();
   await prisma.account.deleteMany();
   await prisma.client.deleteMany();
  }
  await prisma.client.createMany({data:data.clients});
  await prisma.account.createMany({data:data.accounts});
  await prisma.transaction.createMany({data:data.transactions});
  await prisma.alert.createMany({data:data.alerts});
  await prisma.kYCDocument.createMany({data:data.documents});
  await prisma.relationship.createMany({data:data.relationships});
  await prisma.onboardingCase.createMany({data:data.onboardingCases});
  await prisma.identityDocument.createMany({data:data.identityDocuments});
  await prisma.screeningResult.createMany({data:data.screeningResults});
 }
 console.log(`Seeded ${data.clients.length} clients, ${data.transactions.length} transactions and ${data.alerts.length} alerts.`);
}

main().finally(()=>prisma.$disconnect());
