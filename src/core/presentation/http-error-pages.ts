import { NextResponse } from 'next/server';
import { sanitizeCallbackUrl } from '../utils/safe-redirect';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  BARBER: 'Barbeiro',
  RECEPTIONIST: 'Atendente',
  CLIENT: 'Cliente',
};

const ROLE_DASHBOARDS: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  BARBER: '/barber/dashboard',
  RECEPTIONIST: '/atendente',
  CLIENT: '/agenda',
};

export function renderUnauthorizedHtml(callbackUrl: string): string {
  const safeCallback = sanitizeCallbackUrl(callbackUrl, '/');
  const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(safeCallback)}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>401 - Autenticação Necessária | Barbearia Premium</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0D0D0D;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: #141414;
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 1.5rem;
      padding: 2.5rem 2rem;
      max-width: 28rem;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .badge-code {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: rgba(245, 158, 11, 0.15);
      color: #F59E0B;
      border: 1px solid rgba(245, 158, 11, 0.3);
      margin-bottom: 1.25rem;
    }
    .icon-wrapper {
      width: 4rem;
      height: 4rem;
      margin: 0 auto 1.5rem;
      border-radius: 1.25rem;
      background: rgba(212, 175, 55, 0.1);
      border: 1px solid rgba(212, 175, 55, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #D4AF37;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 900;
      letter-spacing: -0.025em;
      margin-bottom: 0.5rem;
      color: #FFFFFF;
    }
    p {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.65);
      line-height: 1.5;
      margin-bottom: 2rem;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.875rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: #0D0D0D;
      background: #D4AF37;
      border-radius: 0.875rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary:hover {
      background: #E5C158;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.875rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.75);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.875rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-secondary:hover {
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.1);
    }
  </style>
</head>
<body>
  <main class="card" role="alert">
    <div class="badge-code">HTTP 401 • Não Autorizado</div>
    <div class="icon-wrapper">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    </div>
    <h1>Autenticação Necessária</h1>
    <p>Você precisa entrar na sua conta para acessar esta área da barbearia.</p>
    <div class="actions">
      <a href="${loginUrl}" class="btn-primary">Entrar na Conta</a>
      <a href="/" class="btn-secondary">Voltar para o Início</a>
    </div>
  </main>
</body>
</html>`;
}

export function renderForbiddenHtml(userRole?: string): string {
  const roleName = userRole ? ROLE_LABELS[userRole] || userRole : 'Usuário';
  const targetArea = userRole && ROLE_DASHBOARDS[userRole] ? ROLE_DASHBOARDS[userRole] : '/';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 - Acesso Negado | Barbearia Premium</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0D0D0D;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: #141414;
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 1.5rem;
      padding: 2.5rem 2rem;
      max-width: 28rem;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .badge-code {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: rgba(239, 68, 68, 0.15);
      color: #EF4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
      margin-bottom: 1.25rem;
    }
    .icon-wrapper {
      width: 4rem;
      height: 4rem;
      margin: 0 auto 1.5rem;
      border-radius: 1.25rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #EF4444;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 900;
      letter-spacing: -0.025em;
      margin-bottom: 0.5rem;
      color: #FFFFFF;
    }
    p {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.65);
      line-height: 1.5;
      margin-bottom: 1.25rem;
    }
    .role-info {
      display: inline-block;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.05);
      padding: 0.375rem 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
    }
    .role-info strong {
      color: #D4AF37;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.875rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: #0D0D0D;
      background: #D4AF37;
      border-radius: 0.875rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary:hover {
      background: #E5C158;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.875rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.75);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.875rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-secondary:hover {
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.1);
    }
  </style>
</head>
<body>
  <main class="card" role="alert">
    <div class="badge-code">HTTP 403 • Proibido</div>
    <div class="icon-wrapper">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    </div>
    <h1>Acesso Negado</h1>
    <p>Sua conta atual não possui permissão para acessar esta área restrita.</p>
    <div class="role-info">Perfil conectado: <strong>${roleName}</strong></div>
    <div class="actions">
      <a href="${targetArea}" class="btn-primary">Ir para Minha Área</a>
      <a href="/auth/login" class="btn-secondary">Entrar com Outra Conta</a>
    </div>
  </main>
</body>
</html>`;
}

function isApiOrJsonRequest(req: Request, pathname: string): boolean {
  if (pathname.startsWith('/api/')) return true;
  const accept = req.headers.get('accept') || '';
  if (accept.includes('application/json') || accept.includes('text/json')) return true;
  if (req.headers.has('next-action')) return true;
  return false;
}

export function createUnauthorizedResponse(req: Request, pathname: string): NextResponse {
  if (isApiOrJsonRequest(req, pathname)) {
    return NextResponse.json(
      {
        success: false,
        code: 'AUTHENTICATION_REQUIRED',
        status: 401,
        error: 'Entre na sua conta para continuar.',
      },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store, private',
        },
      }
    );
  }

  const html = renderUnauthorizedHtml(pathname);
  return new NextResponse(html, {
    status: 401,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, private',
    },
  });
}

export function createForbiddenResponse(req: Request, pathname: string, userRole?: string): NextResponse {
  if (isApiOrJsonRequest(req, pathname)) {
    return NextResponse.json(
      {
        success: false,
        code: 'FORBIDDEN',
        status: 403,
        error: 'Sua conta não tem permissão para acessar esta área.',
      },
      {
        status: 403,
        headers: {
          'Cache-Control': 'no-store, private',
        },
      }
    );
  }

  const html = renderForbiddenHtml(userRole);
  return new NextResponse(html, {
    status: 403,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, private',
    },
  });
}
