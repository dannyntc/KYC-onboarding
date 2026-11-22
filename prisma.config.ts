import 'dotenv/config';
import {defineConfig} from 'prisma/config';
import {databaseUrl} from './src/lib/database-url';
export default defineConfig({schema:'prisma/schema.prisma',migrations:{path:'prisma/migrations'},datasource:{url:databaseUrl(process.env.DATABASE_URL ?? 'file:./dev.db',process.cwd())}});
