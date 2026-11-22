import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { databaseUrl } from '../src/lib/database-url';
import { createSeed } from '../src/lib/seed-data';
const prisma = new PrismaClient({adapter:new PrismaBetterSqlite3({url:databaseUrl(process.env.DATABASE_URL ?? 'file:./dev.db',process.cwd())})});
async function main() {
 const data = createSeed();
 if (await prisma.alert.count() > 0 && process.env.KYC_ONBOARDING_RESET !== "1") throw new Error("Existing demo data found. Use npm run db:reset to erase it explicitly.");
 await prisma.$transaction(async tx => {
  await tx.relationship.deleteMany(); await tx.kYCDocument.deleteMany(); await tx.auditEvent.deleteMany(); await tx.analysis.deleteMany(); await tx.alert.deleteMany(); await tx.transaction.deleteMany(); await tx.client.deleteMany();
  await tx.client.createMany({data:data.clients}); await tx.transaction.createMany({data:data.transactions}); await tx.alert.createMany({data:data.alerts}); await tx.kYCDocument.createMany({data:data.documents}); await tx.relationship.createMany({data:data.relationships});
 });
 console.log(`Seeded ${data.clients.length} clients, ${data.transactions.length} transactions and ${data.alerts.length} alerts.`);
}
main().finally(()=>prisma.$disconnect());
