import { PrismaClient as SQLitePrismaClient } from '@/generated/prisma/client';
import { PrismaClient as PostgresPrismaClient } from '@/generated/prisma-postgres/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { attachDatabasePool } from '@vercel/functions';
import { Pool } from 'pg';
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
  // Direct address, not Prisma's pooled one: measured on Vercel (2026-11-24), the first query on a new pooled
  // connection often waited 1-47 s, while direct connections answered in under 0.5 s every time.
  // To stay under the direct connection limit, each app copy keeps at most 5 connections and closes idle ones
  // after 5 s; one that never opens fails after 10 s instead of hanging the page.
  const pool = new Pool({connectionString:configuredUrl, max:5, connectionTimeoutMillis:10_000, idleTimeoutMillis:5_000});
  // On Vercel, closes idle connections before a paused app copy is frozen, so a later visit never reuses a dead one.
  attachDatabasePool(pool);
  return new PostgresPrismaClient({adapter:new PrismaPg(pool)}) as unknown as DatabaseClient;
 }
 return new SQLitePrismaClient({adapter:new PrismaBetterSqlite3({url:databaseUrl(configuredUrl,process.cwd())})});
}

export const db = globalForPrisma.prisma ?? createDatabaseClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
