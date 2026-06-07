import {getDefaultLocale, LOCALE_PATHS} from './config';

const LOCALE_PREFIX_RE = new RegExp(
  `^/(${LOCALE_PATHS.join('|')})/`,
  'i',
);

const LOCALE_ONLY_RE = new RegExp(
  `^/(${LOCALE_PATHS.join('|')})$`,
  'i',
);

/** Extract locale path segment from a pathname, if present. */
export function parseLocaleFromPathname(pathname: string) {
  const only = pathname.match(LOCALE_ONLY_RE);
  if (only) return only[1]!.toUpperCase();

  const prefixed = pathname.match(LOCALE_PREFIX_RE);
  if (prefixed) return prefixed[1]!.toUpperCase();

  return undefined;
}

/** Remove a leading /XX-YY locale segment from a pathname. */
export function stripLocalePrefix(pathname: string) {
  const without = pathname.replace(LOCALE_PREFIX_RE, '/').replace(LOCALE_ONLY_RE, '/');
  if (!without || without === '') return '/';
  return without.startsWith('/') ? without : `/${without}`;
}

/**
 * Prefix an internal path with the active locale segment.
 * External URLs and already-localized paths are returned unchanged.
 */
export function localizePath(path: string, localePath?: string) {
  if (!path || !path.startsWith('/')) return path;

  if (parseLocaleFromPathname(path)) return path;

  const segment = localePath ?? getDefaultLocale().path;
  const [pathname, search = ''] = path.split('?');
  const normalized = pathname === '/' ? '' : pathname;
  const query = search ? `?${search}` : '';
  return `/${segment}${normalized}${query}`;
}

/** Paths that must never receive a locale prefix (auth callbacks, SEO). */
export function isLocaleExemptPath(pathname: string) {
  return (
    /^\/account\/(login|logout|authorize)(\/|$)/.test(pathname) ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /^\/sitemap\//.test(pathname)
  );
}
