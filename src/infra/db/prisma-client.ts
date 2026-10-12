import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';

// Global declaration for hot-reloading in Next.js development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let cachedPrisma: PrismaClient | undefined = globalForPrisma.prisma;

function getPrismaClient(): PrismaClient {
  if (cachedPrisma) {
    return cachedPrisma;
  }
  if (globalForPrisma.prisma) {
    cachedPrisma = globalForPrisma.prisma;
    return cachedPrisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool, { disposeExternalPool: true });

  const client = new PrismaClient({ adapter });
  cachedPrisma = client;
  globalForPrisma.prisma = client;

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    if (prop === '$$typeof') return undefined;
    if (typeof prop === 'symbol') {
      if (prop === Symbol.toStringTag) return 'PrismaClient';
      if (prop === Symbol.toPrimitive) return undefined;
    }
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
