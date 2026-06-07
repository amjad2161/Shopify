import {
  type LocaleDefinition,
  findLocaleByPath,
  getDefaultLocale,
} from './config';
import {parseLocaleFromPathname} from './paths';

const LOCALE_COOKIE = 'locale';

function parseCookies(header: string | null) {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rest.join('='));
  }

  return cookies;
}

function matchAcceptLanguage(header: string | null): LocaleDefinition | undefined {
  if (!header) return undefined;

  const preferences = header
    .split(',')
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.split('=')[1] ?? '1') : 1;
      return {tag: tag?.toLowerCase() ?? '', q};
    })
    .filter((p) => p.tag)
    .sort((a, b) => b.q - a.q);

  for (const {tag} of preferences) {
    if (tag.startsWith('he') || tag.startsWith('iw')) {
      return findLocaleByPath('HE-IL');
    }
    if (tag.startsWith('fr')) {
      return findLocaleByPath('FR-CA');
    }
    if (tag.startsWith('en-ca')) {
      return findLocaleByPath('EN-CA');
    }
    if (tag.startsWith('en')) {
      return findLocaleByPath('EN-US');
    }
  }

  return undefined;
}

/** Resolve locale for Hydrogen storefront context (path → cookie → Accept-Language). */
export function resolveLocaleFromRequest(request: Request): LocaleDefinition {
  const url = new URL(request.url);
  const fromPath = parseLocaleFromPathname(url.pathname);
  if (fromPath) {
    const locale = findLocaleByPath(fromPath);
    if (locale) return locale;
  }

  const cookies = parseCookies(request.headers.get('Cookie'));
  const fromCookie = findLocaleByPath(cookies[LOCALE_COOKIE]);
  if (fromCookie) return fromCookie;

  return matchAcceptLanguage(request.headers.get('Accept-Language')) ?? getDefaultLocale();
}

/** Preferred locale when the URL has no locale prefix (e.g. `/` redirect). */
export function resolvePreferredLocale(request: Request) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const fromCookie = findLocaleByPath(cookies[LOCALE_COOKIE]);
  if (fromCookie) return fromCookie;

  return matchAcceptLanguage(request.headers.get('Accept-Language')) ?? getDefaultLocale();
}

export function localeCookieHeader(localePath: string) {
  return `${LOCALE_COOKIE}=${encodeURIComponent(localePath)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
