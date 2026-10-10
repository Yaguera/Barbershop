export function safeRedirect(url: string, baseUrl: string): string {
  const base = new URL(baseUrl);
  try {
    const target = new URL(url, base);
    if (['http:', 'https:'].includes(target.protocol) && target.origin === base.origin) return target.href;
  } catch { /* Invalid targets fall back to the configured origin. */ }
  return base.origin;
}
