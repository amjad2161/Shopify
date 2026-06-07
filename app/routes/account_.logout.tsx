import {redirect} from 'react-router';
import type {Route} from './+types/account_.logout';
import {resolvePreferredLocale} from '~/lib/i18n';

// if we don't implement this, /account/logout will get caught by account.$.tsx to do login
export async function loader({request}: Route.LoaderArgs) {
  const locale = resolvePreferredLocale(request);
  return redirect(`/${locale.path}`);
}

export async function action({context}: Route.ActionArgs) {
  return context.customerAccount.logout();
}
