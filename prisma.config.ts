import 'dotenv/config';
import {defineConfig} from 'prisma/config';
import {databaseUrl, isPostgresDatabaseUrl} from './src/lib/database-url';
const configuredUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const usePostgres = process.env.DATABASE_ENGINE === 'postgres' || isPostgresDatabaseUrl(configuredUrl);
export default defineConfig({
 schema:usePostgres?'prisma/schema.postgres.prisma':'prisma/schema.prisma',
 migrations:{path:usePostgres?'prisma/migrations-postgres':'prisma/migrations'},
 datasource:{url:databaseUrl(configuredUrl,process.cwd())}
});
