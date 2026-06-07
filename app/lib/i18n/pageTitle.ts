import {BRAND} from '~/lib/brand';
import type {RootLoader} from '~/root';
import type {UiLocale} from './config';
import {translate} from './messages';

/** Reads resolved brand from the root route match in a meta `matches` tuple. */
export function brandNameFromMatches(matches: unknown): string {
  if (!Array.isArray(matches)) return BRAND.name;
  const root = matches.find(
    (match) =>
      match &&
      typeof match === 'object' &&
      (match as {id?: string}).id === 'root',
  ) as {data?: unknown} | undefined;
  const brand = (root?.data as Awaited<ReturnType<RootLoader>> | undefined)
    ?.brand;
  return brand?.name ?? BRAND.name;
}

export function localizedPageTitle(
  page: string | undefined,
  uiLocale: UiLocale,
  brandName: string = BRAND.name,
) {
  const tagline = translate(uiLocale, 'brand.tagline');
  return page ? `${page} | ${brandName}` : `${brandName} — ${tagline}`;
}
