import { describe, expect, it } from 'vitest';
import {
  renderUnauthorizedHtml,
  renderForbiddenHtml,
  createUnauthorizedResponse,
  createForbiddenResponse,
} from './http-error-pages';

describe('HTTP Error Pages Presentation', () => {
  it('renders 401 HTML containing status code, safe callback, and login link', () => {
    const html = renderUnauthorizedHtml('/admin/dashboard');
    expect(html).toContain('HTTP 401 • Não Autorizado');
    expect(html).toContain('Autenticação Necessária');
    expect(html).toContain('/auth/login?callbackUrl=%2Fadmin%2Fdashboard');
  });

  it('renders 401 HTML sanitizing malicious external or protocol-relative callbacks', () => {
    const html = renderUnauthorizedHtml('//evil.com/hack');
    expect(html).toContain('/auth/login?callbackUrl=%2F');
    expect(html).not.toContain('evil.com');
  });

  it('renders 403 HTML with role badge and appropriate dashboard link', () => {
    const clientHtml = renderForbiddenHtml('CLIENT');
    expect(clientHtml).toContain('HTTP 403 • Proibido');
    expect(clientHtml).toContain('Acesso Negado');
    expect(clientHtml).toContain('Cliente');
    expect(clientHtml).toContain('href="/agenda"');

    const barberHtml = renderForbiddenHtml('BARBER');
    expect(barberHtml).toContain('Barbeiro');
    expect(barberHtml).toContain('href="/barber/dashboard"');

    const recHtml = renderForbiddenHtml('RECEPTIONIST');
    expect(recHtml).toContain('Atendente');
    expect(recHtml).toContain('href="/atendente"');
  });

  it('createUnauthorizedResponse returns 401 response with no-store header for document requests', () => {
    const req = new Request('https://barbearia.vercel.app/admin/dashboard', {
      headers: { accept: 'text/html' },
    });
    const res = createUnauthorizedResponse(req, '/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('createUnauthorizedResponse returns JSON 401 for API requests', async () => {
    const req = new Request('https://barbearia.vercel.app/api/secret', {
      headers: { accept: 'application/json' },
    });
    const res = createUnauthorizedResponse(req, '/api/secret');
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toEqual({
      success: false,
      code: 'AUTHENTICATION_REQUIRED',
      status: 401,
      error: 'Entre na sua conta para continuar.',
    });
  });

  it('createForbiddenResponse returns 403 response with no-store header for document requests', () => {
    const req = new Request('https://barbearia.vercel.app/admin/dashboard', {
      headers: { accept: 'text/html' },
    });
    const res = createForbiddenResponse(req, '/admin/dashboard', 'CLIENT');
    expect(res.status).toBe(403);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('createForbiddenResponse returns JSON 403 for API or next-action requests', async () => {
    const req = new Request('https://barbearia.vercel.app/admin/dashboard', {
      headers: { 'next-action': 'some-action-id' },
    });
    const res = createForbiddenResponse(req, '/admin/dashboard', 'CLIENT');
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data).toEqual({
      success: false,
      code: 'FORBIDDEN',
      status: 403,
      error: 'Sua conta não tem permissão para acessar esta área.',
    });
  });
});
