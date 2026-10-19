import { describe, expect, it } from 'vitest';
import {
  resolveSafeRedirectUrl,
  safeRedirect,
  sanitizeCallbackUrl,
  sanitizeProductionAuthEnv,
} from './safe-redirect';

describe('safe-redirect utility', () => {
  const baseUrl = 'https://barbeariajosecarlos-chi.vercel.app';

  describe('sanitizeCallbackUrl', () => {
    it('accepts valid relative internal paths', () => {
      expect(sanitizeCallbackUrl('/atendente')).toBe('/atendente');
      expect(sanitizeCallbackUrl('/admin/dashboard')).toBe('/admin/dashboard');
      expect(sanitizeCallbackUrl('/agenda?date=2026-10-14')).toBe('/agenda?date=2026-10-14');
    });

    it('rejects external URLs and returns fallback', () => {
      expect(sanitizeCallbackUrl('https://evil.com')).toBe('/');
      expect(sanitizeCallbackUrl('http://localhost:3000/admin')).toBe('/');
      expect(sanitizeCallbackUrl('//evil.com/hack')).toBe('/');
      expect(sanitizeCallbackUrl('/\\evil.com/hack')).toBe('/');
    });

    it('rejects javascript: and data: URIs', () => {
      expect(sanitizeCallbackUrl('javascript:alert(1)')).toBe('/');
      expect(sanitizeCallbackUrl('data:text/html,evil')).toBe('/');
    });

    it('handles null, undefined, empty string with fallback', () => {
      expect(sanitizeCallbackUrl(null)).toBe('/');
      expect(sanitizeCallbackUrl(undefined, '/agenda')).toBe('/agenda');
      expect(sanitizeCallbackUrl('', '/profile')).toBe('/profile');
    });
  });

  describe('safeRedirect', () => {
    it('resolves valid relative paths against baseUrl', () => {
      expect(safeRedirect('/atendente', baseUrl)).toBe('https://barbeariajosecarlos-chi.vercel.app/atendente');
    });

    it('resolves valid same-origin absolute URLs', () => {
      expect(safeRedirect('https://barbeariajosecarlos-chi.vercel.app/agenda', baseUrl)).toBe(
        'https://barbeariajosecarlos-chi.vercel.app/agenda'
      );
    });

    it('rejects external origins and falls back to baseUrl origin', () => {
      expect(safeRedirect('https://evil.com/steal', baseUrl)).toBe(
        'https://barbeariajosecarlos-chi.vercel.app'
      );
    });
  });

  describe('sanitizeProductionAuthEnv', () => {
    it('removes localhost AUTH_URL and NEXTAUTH_URL in production or Vercel', () => {
      const fakeEnv = {
        NODE_ENV: 'production',
        AUTH_URL: 'http://localhost:3000',
        NEXTAUTH_URL: 'http://127.0.0.1:3000',
      } as unknown as NodeJS.ProcessEnv;

      sanitizeProductionAuthEnv(fakeEnv);

      expect(fakeEnv.AUTH_URL).toBeUndefined();
      expect(fakeEnv.NEXTAUTH_URL).toBeUndefined();
    });

    it('preserves localhost AUTH_URL in development', () => {
      const fakeEnv = {
        NODE_ENV: 'development',
        AUTH_URL: 'http://localhost:3000',
      } as unknown as NodeJS.ProcessEnv;

      sanitizeProductionAuthEnv(fakeEnv);

      expect(fakeEnv.AUTH_URL).toBe('http://localhost:3000');
    });
  });

  describe('resolveSafeRedirectUrl', () => {
    it('replaces mutated localhost req.nextUrl with x-forwarded-host in production', () => {
      const req = {
        nextUrl: new URL('http://localhost:3000/'),
        headers: new Headers({
          'x-forwarded-host': 'barbeariajosecarlos-chi.vercel.app',
          'x-forwarded-proto': 'https',
        }),
      };
      const fakeEnv = { NODE_ENV: 'production' } as unknown as NodeJS.ProcessEnv;

      const resolved = resolveSafeRedirectUrl('/admin/dashboard', req, fakeEnv);
      expect(resolved.href).toBe('https://barbeariajosecarlos-chi.vercel.app/admin/dashboard');
    });

    it('falls back to production domain when req.nextUrl is localhost and headers are missing in production', () => {
      const req = {
        nextUrl: new URL('http://localhost:3000/'),
      };
      const fakeEnv = {
        NODE_ENV: 'production',
        VERCEL_PROJECT_PRODUCTION_URL: 'barbeariajosecarlos-chi.vercel.app',
      } as unknown as NodeJS.ProcessEnv;

      const resolved = resolveSafeRedirectUrl('/atendente', req, fakeEnv);
      expect(resolved.href).toBe('https://barbeariajosecarlos-chi.vercel.app/atendente');
    });

    it('preserves localhost redirect in local development', () => {
      const req = {
        nextUrl: new URL('http://localhost:3000/'),
      };
      const fakeEnv = { NODE_ENV: 'development' } as unknown as NodeJS.ProcessEnv;

      const resolved = resolveSafeRedirectUrl('/barber/dashboard', req, fakeEnv);
      expect(resolved.href).toBe('http://localhost:3000/barber/dashboard');
    });
  });
});

