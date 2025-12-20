import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '../../packages/database/dev.db');
// In Prisma 7, the adapter factory handles the connection internally
const adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`
});

const prisma = new PrismaClient({ adapter: adapter as any });

export default prisma;
