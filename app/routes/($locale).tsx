import type {Route} from './+types/($locale)';
import {findLocaleByPath} from '~/lib/i18n';

export async function loader({params, context}: Route.LoaderArgs) {
  const localeDef = findLocaleByPath(params.locale);
  if (!localeDef) {
    throw new Response(null, {status: 404});
  }

  const {language, country} = context.storefront.i18n;
  const expected = `${language}-${country}`.toUpperCase();

  if (params.locale && params.locale.toUpperCase() !== expected) {
    throw new Response(null, {status: 404});
  }

  return {locale: localeDef};
}

export default function LocaleLayout() {
  return null;
}
