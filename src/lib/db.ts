import { PrismaClient as SQLitePrismaClient } from '@/generated/prisma/client';
import { PrismaClient as PostgresPrismaClient } from '@/generated/prisma-postgres/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { databaseUrl, isPostgresDatabaseUrl } from './database-url';
import type { Engine } from './demo-reset';

// Both generated clients expose the same application model API. Keep the public
// type anchored to the SQLite client so existing query code remains portable
// across the two runtime adapters.
type DatabaseClient = SQLitePrismaClient;
const globalForPrisma = globalThis as unknown as { prisma?: DatabaseClient };
const configuredUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const usePostgres = process.env.DATABASE_ENGINE === 'postgres' || isPostgresDatabaseUrl(configuredUrl);
export const databaseEngine: Engine = usePostgres ? 'postgres' : 'sqlite';

function createDatabaseClient(): DatabaseClient {
 if (usePostgres) {
  // On Vercel, use the pooled address when it exists: many short-lived app copies share a few
  // real connections instead of each opening direct ones and hitting the connection limit.
  const connectionString = process.env.DATABASE_URL_POOLED || configuredUrl;
  return new PostgresPrismaClient({adapter:new PrismaPg({connectionString})}) as unknown as DatabaseClient;
 }
 return new SQLitePrismaClient({adapter:new PrismaBetterSqlite3({url:databaseUrl(configuredUrl,process.cwd())})});
}

export const db = globalForPrisma.prisma ?? createDatabaseClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
