import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('Defina TEST_DATABASE_URL para um banco PostgreSQL local exclusivo de testes.');
const target = new URL(url);
if (!['localhost', '127.0.0.1'].includes(target.hostname) || !target.pathname.endsWith('_test')) {
  throw new Error('Os testes exigem localhost/127.0.0.1 e nome de banco terminado em _test.');
}
process.env.DATABASE_URL = url;
process.env.DIRECT_URL = url;
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['src/**/*.integration.test.ts'], fileParallelism: false, testTimeout: 15000, hookTimeout: 30000 },
});
