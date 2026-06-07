import {BRAND} from '~/lib/brand';
import type {UiLocale} from './config';
import {translate} from './messages';

export function localizedPageTitle(
  page: string | undefined,
  uiLocale: UiLocale,
) {
  const tagline = translate(uiLocale, 'brand.tagline');
  return page ? `${page} | ${BRAND.name}` : `${BRAND.name} — ${tagline}`;
}
