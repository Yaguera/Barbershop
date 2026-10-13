import { describe, expect, it } from 'vitest';
import { safeRedirect, sanitizeCallbackUrl } from './safe-redirect';

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
});
