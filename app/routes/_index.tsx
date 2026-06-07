import {redirect} from 'react-router';
import type {Route} from './+types/_index';
import {localeCookieHeader, resolvePreferredLocale} from '~/lib/i18n';

export async function loader({request}: Route.LoaderArgs) {
  const locale = resolvePreferredLocale(request);
  const headers = new Headers();
  headers.append('Set-Cookie', localeCookieHeader(locale.path));

  return redirect(`/${locale.path}`, {headers});
}
