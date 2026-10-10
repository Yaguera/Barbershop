import { processReminders } from '@/infra/notifications/process-reminders';
import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import { GET,POST } from './route';
vi.mock('@/infra/notifications/process-reminders', () => ({ processReminders: vi.fn().mockResolvedValue({ processedReminders: 1 }) }));
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('CRON_SECRET', 'test-secret'); });
afterEach(() => vi.unstubAllEnvs());
it('fails closed without configuration', async () => {
  vi.stubEnv('CRON_SECRET', '');
  expect((await POST(new Request('https://shop.example/api/cron'))).status).toBe(503);
  expect(processReminders).not.toHaveBeenCalled();
});
it.each([GET, POST])('rejects unauthenticated calls', async handler => {
  expect((await handler(new Request('https://shop.example/api/cron'))).status).toBe(401);
  expect(processReminders).not.toHaveBeenCalled();
});
it('accepts the secret', async () => {
  const response = await POST(new Request('https://shop.example/api/cron', { headers: { authorization: 'Bearer test-secret' } }));
  expect(response.status).toBe(200);
  expect(processReminders).toHaveBeenCalledOnce();
});
