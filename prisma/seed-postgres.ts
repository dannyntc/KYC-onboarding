import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma-postgres/client';
import type { PrismaClient as SharedClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { resetDemoData, seedEmptyDatabase } from '../src/lib/demo-reset';

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl || (!configuredUrl.startsWith('postgres://') && !configuredUrl.startsWith('postgresql://'))) {
 throw new Error('DATABASE_URL must be a PostgreSQL connection string when running the PostgreSQL seed.');
}
// Both generated clients expose the same model API (see src/lib/db.ts).
const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:configuredUrl})}) as unknown as SharedClient;

async function main() {
 const data = process.env.KYC_ONBOARDING_RESET === '1' ? await resetDemoData(prisma, 'postgres') : await seedEmptyDatabase(prisma, 'KYC_ONBOARDING_RESET=1');
 console.log(`Seeded ${data.clients.length} clients, ${data.transactions.length} transactions and ${data.alerts.length} alerts.`);
}

main().finally(()=>prisma.$disconnect());
