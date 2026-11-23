import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { databaseUrl } from '../src/lib/database-url';
import { resetDemoData, seedEmptyDatabase } from '../src/lib/demo-reset';
const prisma = new PrismaClient({adapter:new PrismaBetterSqlite3({url:databaseUrl(process.env.DATABASE_URL ?? 'file:./dev.db',process.cwd())})});
async function main() {
 // Explicit reset is the only workflow, besides the in-app reset button, that removes the demo audit history.
 const data = process.env.KYC_ONBOARDING_RESET === '1' ? await resetDemoData(prisma, 'sqlite') : await seedEmptyDatabase(prisma, 'npm run db:reset');
 console.log(`Seeded ${data.clients.length} clients, ${data.transactions.length} transactions and ${data.alerts.length} alerts.`);
}
main().finally(()=>prisma.$disconnect());
