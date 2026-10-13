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
