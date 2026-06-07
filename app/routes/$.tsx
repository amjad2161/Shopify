import {redirect} from 'react-router';
import type {Route} from './+types/$';
import {
  isLocaleExemptPath,
  localizePath,
  parseLocaleFromPathname,
  resolvePreferredLocale,
} from '~/lib/i18n';

export async function loader({request}: Route.LoaderArgs) {
  const url = new URL(request.url);

  if (isLocaleExemptPath(url.pathname) || parseLocaleFromPathname(url.pathname)) {
    throw new Response(`${url.pathname} not found`, {status: 404});
  }

  const locale = resolvePreferredLocale(request);
  const localized = localizePath(url.pathname, locale.path);
  const target = `${localized}${url.search}`;

  return redirect(target);
}

export default function CatchAllRedirect() {
  return null;
}
