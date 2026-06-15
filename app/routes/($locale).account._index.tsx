import {redirect} from 'react-router';
import type {Route} from './+types/($locale).account._index';
import {localizePath} from '~/lib/i18n';

export async function loader({params}: Route.LoaderArgs) {
  return redirect(localizePath('/account/orders', params.locale));
}
