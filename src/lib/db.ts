import { PrismaClient } from '@/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { databaseUrl } from './database-url';
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient({adapter:new PrismaBetterSqlite3({url:databaseUrl(process.env.DATABASE_URL ?? 'file:./dev.db',process.cwd())})});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
