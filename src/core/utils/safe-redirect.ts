/**
 * Validação e sanitização segura de URLs para prevenção contra Open Redirect.
 * Garante que redirecionamentos pertençam à mesma origem ou sejam caminhos relativos internos válidos.
 */

export function sanitizeCallbackUrl(url: string | null | undefined, fallback: string = '/'): string {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Proíbe URLs com esquemas maliciosos (javascript:, data:, vbscript:)
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return fallback;
  }

  // Previne caminhos com barra dupla ou barra invertida (//evil.com ou /\evil.com)
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\/')) {
    return fallback;
  }

  // Se for caminho relativo interno simples iniciado por '/'
  if (trimmed.startsWith('/')) {
    // Não pode conter caracteres de controle
    if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
      return fallback;
    }
    return trimmed;
  }

  return fallback;
}

export function safeRedirect(url: string, baseUrl: string): string {
  try {
    const base = new URL(baseUrl);

    // Se url for um caminho relativo seguro
    if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')) {
      const resolved = new URL(url, base);
      if (resolved.origin === base.origin) {
        return resolved.href;
      }
    }

    const target = new URL(url, base);
    if (['http:', 'https:'].includes(target.protocol) && target.origin === base.origin) {
      return target.href;
    }
  } catch {
    /* Destinos inválidos retornam para a origem base configurada */
  }

  try {
    return new URL(baseUrl).origin;
  } catch {
    return '/';
  }
}

function isLocalhostAddress(value: string | undefined | null): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('[::1]');
}

/**
 * Remove AUTH_URL / NEXTAUTH_URL apontando para localhost quando em produção/Vercel,
 * evitando que o wrapper `reqWithEnvURL` do NextAuth reescreva `req.nextUrl` para `http://localhost:3000`.
 */
export function sanitizeProductionAuthEnv(env: NodeJS.ProcessEnv = process.env): void {
  const isProd = env.NODE_ENV === 'production' || Boolean(env.VERCEL);
  if (!isProd) return;

  if (isLocalhostAddress(env.AUTH_URL)) {
    delete env.AUTH_URL;
  }
  if (isLocalhostAddress(env.NEXTAUTH_URL)) {
    delete env.NEXTAUTH_URL;
  }
}

export interface RedirectRequestLike {
  nextUrl: URL;
  headers?: {
    get(name: string): string | null;
  };
}

/**
 * Constrói uma URL de redirecionamento segura garantindo que em produção/Vercel
 * jamais redirecione para `localhost`, mesmo que `req.nextUrl` tenha sido reescrito.
 */
export function resolveSafeRedirectUrl(
  targetPath: string,
  req: RedirectRequestLike,
  env: NodeJS.ProcessEnv = process.env
): URL {
  const safePath = sanitizeCallbackUrl(targetPath, '/');
  const isProd = env.NODE_ENV === 'production' || Boolean(env.VERCEL);

  if (isProd && isLocalhostAddress(req.nextUrl.origin)) {
    const forwardedHost = req.headers?.get('x-forwarded-host')?.split(',')[0]?.trim();
    const hostHeader = req.headers?.get('host')?.split(',')[0]?.trim();
    const effectiveHost =
      forwardedHost && !isLocalhostAddress(forwardedHost)
        ? forwardedHost
        : hostHeader && !isLocalhostAddress(hostHeader)
          ? hostHeader
          : null;

    if (effectiveHost) {
      const forwardedProto = req.headers?.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
      return new URL(safePath, `${forwardedProto}://${effectiveHost}`);
    }

    if (env.VERCEL_PROJECT_PRODUCTION_URL && !isLocalhostAddress(env.VERCEL_PROJECT_PRODUCTION_URL)) {
      return new URL(safePath, `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
    }

    if (env.VERCEL_URL && !isLocalhostAddress(env.VERCEL_URL)) {
      return new URL(safePath, `https://${env.VERCEL_URL}`);
    }

    return new URL(safePath, 'https://barbeariajosecarlos-chi.vercel.app');
  }

  return new URL(safePath, req.nextUrl.origin);
}

