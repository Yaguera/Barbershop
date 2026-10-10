import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextAuthConfig } from 'next-auth';
const captured = vi.hoisted(() => ({ config: null as NextAuthConfig | null, findUnique: vi.fn() }));
vi.mock('next-auth', () => ({ default: (config: NextAuthConfig) => {
  captured.config = config;
  return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
} }));
vi.mock('@/infra/db/prisma-client', () => ({ prisma: { user: { findUnique: captured.findUnique } } }));
import './auth';
type JwtCallback = NonNullable<NonNullable<NextAuthConfig['callbacks']>['jwt']>;
function jwt(token: Record<string, unknown>, extra = {}) {
  return captured.config!.callbacks!.jwt!({ token, ...extra } as Parameters<JwtCallback>[0]);
}
beforeEach(() => captured.findUnique.mockReset());
describe('session account validation', () => {
  it('revokes a token when the account is disabled', async () => {
    captured.findUnique.mockResolvedValue({ active: false, sessionVersion: 0 });
    expect(await jwt({ id: 'user', sessionVersion: 0 })).toBeNull();
  });
  it('rejects an old token even after reactivation', async () => {
    captured.findUnique.mockResolvedValue({ active: true, sessionVersion: 1, role: 'BARBER' });
    expect(await jwt({ id: 'user', sessionVersion: 0 })).toBeNull();
  });
  it('refreshes the role from the database, ignoring client-supplied session fields', async () => {
    captured.findUnique.mockResolvedValue({ active: true, sessionVersion: 0, role: 'CLIENT', name: 'Cliente' });
    expect(await jwt({ id: 'user', sessionVersion: 0, role: 'ADMIN' }, { trigger: 'update', session: { role: 'ADMIN' } })).toMatchObject({ role: 'CLIENT' });
  });
  it('rejects legacy tokens without a session version', async () => {
    captured.findUnique.mockResolvedValue({ active: true, sessionVersion: 0 });
    expect(await jwt({ id: 'user' })).toBeNull();
  });
});
