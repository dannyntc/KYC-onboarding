import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma-postgres/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createSeed } from '../src/lib/seed-data';

// Adds the KYC onboarding demo data to a database that already holds the original alert demo data.
// It only inserts. It refuses to run unless the onboarding tables are empty and the expected
// clients CLI-001..CLI-019 are present, and everything happens in one transaction.
const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl || (!configuredUrl.startsWith('postgres://') && !configuredUrl.startsWith('postgresql://'))) {
  throw new Error('DATABASE_URL must be a PostgreSQL connection string when running the PostgreSQL onboarding seed.');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: configuredUrl }) });

async function main() {
  const data = createSeed();
  const expectedClients = data.clients.slice(0, 19);
  const supplementalIds = data.supplementalDocuments.map(d => d.id);

  await prisma.$transaction(async tx => {
    const counts = await Promise.all([
      tx.onboardingCase.count(),
      tx.identityDocument.count(),
      tx.screeningResult.count(),
      tx.onboardingEvent.count(),
      tx.onboardingAnalysis.count()
    ]);
    if (counts.some(count => count > 0)) {
      throw new Error('Onboarding data already exists. Nothing was changed.');
    }

    const existingClients = await tx.client.findMany({
      where: { id: { in: expectedClients.map(c => c.id) } },
      select: { id: true, name: true }
    });
    const namesById = new Map(existingClients.map(c => [c.id, c.name]));
    const mismatched = expectedClients.filter(c => namesById.get(c.id) !== c.name);
    if (mismatched.length > 0) {
      throw new Error(
        `Expected demo clients are missing or renamed: ${mismatched.map(c => c.id).join(', ')}. Nothing was changed.`
      );
    }

    const existingDocuments = await tx.kYCDocument.count({ where: { id: { in: supplementalIds } } });
    if (existingDocuments > 0) {
      throw new Error('Supplemental documents DOC-101 and later already exist. Nothing was changed.');
    }

    await tx.kYCDocument.createMany({ data: data.supplementalDocuments });
    await tx.onboardingCase.createMany({ data: data.onboardingCases });
    await tx.identityDocument.createMany({ data: data.identityDocuments });
    await tx.screeningResult.createMany({ data: data.screeningResults });
  });

  console.log(
    `Added ${data.onboardingCases.length} onboarding cases, ${data.identityDocuments.length} identity documents, ` +
      `${data.screeningResults.length} screening results and ${data.supplementalDocuments.length} supplemental documents.`
  );
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
